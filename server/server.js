
"use strict";

const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.resolve(__dirname, "..", "public");

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

// ========================================
// KLUBOVI
// ========================================

const CLUBS = {
    lasta: {
        name: "LASTA",
        url: "https://www.beogradnocu.com/klubovi-u-beogradu/klub-lasta/"
    },
    freestyler: {
        name: "FREESTYLER",
        url: "https://www.beogradnocu.com/klubovi-u-beogradu/klub-freestyler/"
    },
    remiks: {
        name: "REMIKS",
        url: "https://www.beogradnocu.com/klubovi-u-beogradu/remiks/"
    },
    tranzit: {
        name: "TRANZIT",
        url: "https://www.beogradnocu.com/klubovi-u-beogradu/tranzit-bar/"
    },
    bank: {
        name: "THE BANK",
        url: "https://www.beogradnocu.com/klubovi-u-beogradu/klub-bank/"
    },
    hype: {
        name: "HYPE",
        url: "https://www.beogradnocu.com/klubovi-u-beogradu/klub-hype/"
    },
    gradska: {
        name: "GRADSKA KAFANA",
        url: "https://www.beogradnocu.com/kafane-u-beogradu/gradska-kafana/"
    }
};

// ========================================
// USLOVI REZERVACIJA
// ========================================

const TABLES = {
    lasta: [
        { type: "Barski sto", condition: "1 obična flaša" },
        { type: "Visoko sedenje", condition: "1 premium flaša" },
        { type: "Separe", condition: "2 premium flaše" },
        { type: "Veliki separe", condition: "3 premium flaše" }
    ],
    freestyler: [
        { type: "Barski sto", condition: "1 obična flaša" },
        { type: "Mali separe", condition: "1 premium flaša" },
        { type: "Veliki separe", condition: "2 premium flaše" },
        { type: "Centralni separe", condition: "3 premium flaše" }
    ],
    remiks: [
        { type: "Barski sto", condition: "Bez uslova" },
        { type: "Visoko sedenje", condition: "1 obična flaša" },
        { type: "Separe", condition: "1 premium flaša" }
    ],
    tranzit: [
        { type: "Barski sto", condition: "50 €" },
        { type: "Visoko sedenje", condition: "100 € / 1 obična flaša" },
        { type: "Separe", condition: "1 premium flaša" }
    ],
    bank: [
        { type: "Barski sto", condition: "1 obična flaša" },
        { type: "Visoko sedenje", condition: "1 premium flaša" },
        { type: "Separe", condition: "2 premium flaše" },
        { type: "Centralni separe", condition: "3 premium flaše" }
    ],
    hype: [
        { type: "Barski sto", condition: "1 obična flaša" },
        { type: "Visoko sedenje", condition: "1 premium flaša" },
        { type: "Separe", condition: "2 premium flaše" },
        { type: "Centralni separe", condition: "3 premium flaše" }
    ],
    gradska: [
        { type: "Barski sto — dalje od bine", condition: "8.000 RSD" },
        { type: "Barski sto — bliže bini", condition: "1 obična flaša" },
        { type: "Nisko sedenje — dalje od bine", condition: "1 obična flaša" },
        { type: "Nisko sedenje — bliže bini", condition: "1 premium flaša" },
        { type: "Separe — dalje od bine", condition: "2 obične flaše" },
        { type: "Separe — bliže bini", condition: "2 premium flaše" }
    ]
};

// ========================================
// POMOCNE FUNKCIJE
// ========================================

function clean(value) {
    return typeof value === "string" ? value.trim() : "";
}

function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const date = new Date(`${value}T12:00:00Z`);

    return Number.isFinite(date.getTime()) &&
        date.toISOString().slice(0, 10) === value;
}

function todayInBelgrade() {
    const parts = new Intl.DateTimeFormat("en", {
        timeZone: "Europe/Belgrade",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const get = type => parts.find(p => p.type === type).value;

    return `${get("year")}-${get("month")}-${get("day")}`;
}

function isoDate(date) {
    return date.toISOString().slice(0, 10);
}

function dateFromISO(value) {
    return validDate(value)
        ? new Date(`${value}T12:00:00Z`)
        : null;
}

function addDays(value, amount) {
    const date = dateFromISO(value);
    if (!date) return "";

    date.setUTCDate(date.getUTCDate() + amount);
    return isoDate(date);
}

function dayOfWeek(value) {
    const date = dateFromISO(value);
    return date ? date.getUTCDay() : -1;
}

function weekendStartFor(value) {
    const dow = dayOfWeek(value);

    if (dow < 0) return "";
    if (dow === 5) return value;
    if (dow === 6) return addDays(value, -1);
    if (dow === 0) return addDays(value, -2);

    return addDays(value, 5 - dow);
}

function weekendRangeFromStart(start) {
    return {
        start,
        end: addDays(start, 2)
    };
}

function formatWindowLabel(start, end) {
    if (!validDate(start) || !validDate(end)) {
        return "SLEDEĆI VIKEND";
    }

    const first = dateFromISO(start);
    const last = dateFromISO(end);

    const dayMonth = date =>
        new Intl.DateTimeFormat("sr-Latn-RS", {
            timeZone: "Europe/Belgrade",
            day: "2-digit",
            month: "2-digit"
        }).format(date);

    return `${dayMonth(first)} — ${dayMonth(last)}.${last.getUTCFullYear()}.`;
}

// ========================================
// ADMIN AUTENTIFIKACIJA
// ========================================

function secureEqual(actual, expected) {
    const a = crypto.createHash("sha256").update(actual).digest();
    const b = crypto.createHash("sha256").update(expected).digest();

    return crypto.timingSafeEqual(a, b);
}

function adminAuth(req, res, next) {
    const user = process.env.ADMIN_USER;
    const password = process.env.ADMIN_PASSWORD;

    res.setHeader("Cache-Control", "no-store");

    if (!user || !password) {
        return res.status(503).json({
            error: "Admin pristup trenutno nije podešen."
        });
    }

    const header = req.headers.authorization || "";

    if (header.startsWith("Basic ")) {
        let credentials = "";

        try {
            credentials = Buffer.from(
                header.slice(6),
                "base64"
            ).toString("utf8");
        } catch {
            credentials = "";
        }

        const separator = credentials.indexOf(":");

        if (
            separator >= 0 &&
            secureEqual(credentials.slice(0, separator), user) &&
            secureEqual(credentials.slice(separator + 1), password)
        ) {
            return next();
        }
    }

    res.setHeader(
        "WWW-Authenticate",
        'Basic realm="NightBook Admin", charset="UTF-8"'
    );

    return res.status(401).json({
        error: "Potrebna je ispravna admin prijava."
    });
}

app.get(["/admin", "/admin.html"], adminAuth, (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "admin.html"));
});

app.use((req, res, next) => {
    let pathname;

    try {
        pathname = decodeURIComponent(req.path);
    } catch {
        return res.status(400).json({
            error: "Neispravna putanja."
        });
    }

    if (
        path.posix.basename(pathname).toLowerCase() ===
        "admin.html"
    ) {
        return adminAuth(req, res, next);
    }

    next();
});

app.use(express.static(PUBLIC_DIR, {
    index: false,
    setHeaders(res) {
        res.setHeader("Cache-Control", "no-cache");
    }
}));

// ========================================
// POSTGRESQL BAZA
// ========================================

const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false,
        connectionTimeoutMillis: 10000,
        max: 10
    })
    : null;

let databaseReady = false;

if (pool) {
    pool.on("error", error => {
        console.error("PostgreSQL greška:", error.message);
    });
}

// ========================================
// AUTOMATSKA MIGRACIJA BAZE
// ========================================

async function initializeDatabase() {
    if (!pool) {
        console.warn(
            "DATABASE_URL nije podešen. Rezervacije nisu dostupne."
        );
        return;
    }

    databaseReady = false;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        await client.query(`
            CREATE TABLE IF NOT EXISTS reservations (
                id SERIAL PRIMARY KEY,
                club VARCHAR(100) NOT NULL,
                event_date DATE NOT NULL,
                event_program VARCHAR(500),
                name VARCHAR(150) NOT NULL,
                phone VARCHAR(100) NOT NULL,
                instagram VARCHAR(150),
                guests INTEGER NOT NULL,
                table_type VARCHAR(200),
                table_condition VARCHAR(250),
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        // Dodavanje kolona koje fale u staroj tabeli.

        await client.query(`
            ALTER TABLE reservations
                ADD COLUMN IF NOT EXISTS event_date DATE,
                ADD COLUMN IF NOT EXISTS event_program VARCHAR(500),
                ADD COLUMN IF NOT EXISTS club VARCHAR(100),
                ADD COLUMN IF NOT EXISTS name VARCHAR(150),
                ADD COLUMN IF NOT EXISTS phone VARCHAR(100),
                ADD COLUMN IF NOT EXISTS instagram VARCHAR(150),
                ADD COLUMN IF NOT EXISTS guests INTEGER,
                ADD COLUMN IF NOT EXISTS table_type VARCHAR(200),
                ADD COLUMN IF NOT EXISTS table_condition VARCHAR(250),
                ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
                ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()
        `);

        // Provera stare kolone "date".

        const dateColumn = await client.query(`
            SELECT data_type
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'reservations'
              AND column_name = 'date'
        `);

        if (dateColumn.rows.length > 0) {
            const dateType = dateColumn.rows[0].data_type;

            // Prebacivanje starih datuma u novu kolonu.
            // Ovo radi za PostgreSQL DATE i TIMESTAMP tipove.

            if (
                dateType === "date" ||
                dateType === "timestamp without time zone" ||
                dateType === "timestamp with time zone"
            ) {
                await client.query(`
                    UPDATE reservations
                    SET event_date = "date"::date
                    WHERE event_date IS NULL
                      AND "date" IS NOT NULL
                `);
            } else if (
                dateType === "text" ||
                dateType === "character varying"
            ) {
                await client.query(`
                    UPDATE reservations
                    SET event_date = "date"::date
                    WHERE event_date IS NULL
                      AND "date" IS NOT NULL
                      AND "date" ~ '^\\d{4}-\\d{2}-\\d{2}$'
                `);
            }

            // Ključna ispravka:
            // stara kolona vise ne blokira nove rezervacije.

            await client.query(`
                ALTER TABLE reservations
                ALTER COLUMN "date" DROP NOT NULL
            `);

            console.log(
                "Stara kolona date je usklađena."
            );
        }

        // Popunjavanje statusa kod starih rezervacija.

        await client.query(`
            UPDATE reservations
            SET status = 'pending'
            WHERE status IS NULL
        `);

        await client.query(`
            ALTER TABLE reservations
            ALTER COLUMN status SET DEFAULT 'pending'
        `);

        await client.query(`
            ALTER TABLE reservations
            ALTER COLUMN created_at SET DEFAULT NOW()
        `);

        // Provera obaveznih kolona.

        const result = await client.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'reservations'
        `);

        const existing = new Set(
            result.rows.map(row => row.column_name)
        );

        const required = [
            "id",
            "club",
            "event_date",
            "event_program",
            "name",
            "phone",
            "instagram",
            "guests",
            "table_type",
            "table_condition",
            "status",
            "created_at"
        ];

        const missing = required.filter(
            column => !existing.has(column)
        );

        if (missing.length) {
            throw new Error(
                "Nedostaju kolone: " + missing.join(", ")
            );
        }

        await client.query("COMMIT");

        databaseReady = true;

        console.log("NightBook baza je spremna.");
        console.log("Migracija baze je završena.");
        console.log("Rezervacije su omogućene.");

    } catch (error) {
        await client.query("ROLLBACK");
        databaseReady = false;

        console.error("Baza nije spremna:", error.message);
    } finally {
        client.release();
    }
}

function requireDatabase(req, res, next) {
    if (!databaseReady) {
        return res.status(503).json({
            error: "Baza trenutno nije dostupna. Pokušaj ponovo kasnije."
        });
    }

    next();
}

// ========================================
// API KLUBOVA
// ========================================

app.get("/api/clubs", (req, res) => {
    res.setHeader("Cache-Control", "no-cache");

    res.json(
        Object.fromEntries(
            Object.entries(CLUBS).map(([key, club]) => [
                key,
                {
                    name: club.name,
                    tables: TABLES[key]
                }
            ])
        )
    );
});

// ========================================
// OBRADA PODATAKA SA BEOGRAD NOCU
// ========================================

function decodeEntities(value) {
    const entities = {
        amp: "&",
        quot: '"',
        apos: "'",
        nbsp: " ",
        lt: "<",
        gt: ">"
    };

    return String(value || "")
        .replace(
            /&(amp|quot|apos|nbsp|lt|gt);/gi,
            (match, name) => entities[name.toLowerCase()]
        )
        .replace(
            /&#(x[\da-f]+|\d+);/gi,
            (match, code) => {
                const number =
                    code[0].toLowerCase() === "x"
                        ? parseInt(code.slice(1), 16)
                        : Number(code);

                return number >= 0 && number <= 0x10ffff
                    ? String.fromCodePoint(number)
                    : match;
            }
        );
}

function htmlText(value) {
    return decodeEntities(
        String(value || "").replace(/<[^>]*>/g, " ")
    )
        .replace(/\s+/g, " ")
        .trim();
}

function attributeValue(tag, name) {
    const expression = new RegExp(
        "(?:^|\\s)" +
        name +
        "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))",
        "i"
    );

    const match = String(tag || "").match(expression);

    return match
        ? decodeEntities(match[1] ?? match[2] ?? match[3])
        : "";
}

function sourceDate(value) {
    const text = clean(value);

    if (validDate(text)) return text;

    const parts = text.match(
        /^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/
    );

    if (!parts) return "";

    const date =
        `${parts[3]}-${parts[2].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;

    return validDate(date) ? date : "";
}

const SERBIAN_MONTHS = {
    januar: 1,
    januara: 1,
    februar: 2,
    februara: 2,
    mart: 3,
    marta: 3,
    april: 4,
    aprila: 4,
    maj: 5,
    maja: 5,
    jun: 6,
    juna: 6,
    jul: 7,
    jula: 7,
    avgust: 8,
    avgusta: 8,
    septembar: 9,
    septembra: 9,
    oktobar: 10,
    oktobra: 10,
    novembar: 11,
    novembra: 11,
    decembar: 12,
    decembra: 12
};

function foldText(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function dateFromHeading(value) {
    const text = foldText(htmlText(value));
    const monthNames = Object.keys(SERBIAN_MONTHS).join("|");

    const match = text.match(
        new RegExp(
            `\\b(\\d{1,2})\\.?\\s+(${monthNames})\\b`,
            "i"
        )
    );

    if (!match) return "";

    const day = Number(match[1]);
    const month = SERBIAN_MONTHS[match[2].toLowerCase()];

    if (!day || !month) return "";

    const today = todayInBelgrade();
    const currentYear = Number(today.slice(0, 4));

    let candidate =
        `${currentYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    if (!validDate(candidate)) return "";

    if (candidate < addDays(today, -14)) {
        candidate =
            `${currentYear + 1}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    return validDate(candidate) ? candidate : "";
}

function absoluteURL(value, base) {
    const text = clean(value);

    if (!text || text.startsWith("data:")) return "";

    try {
        const url = new URL(text, base);

        if (!/^https?:$/.test(url.protocol)) return "";

        return url.toString();
    } catch {
        return "";
    }
}

function usefulImage(url) {
    const text = String(url || "").toLowerCase();

    if (!text) return false;

    const rejected = [
        "logo",
        "icon",
        "avatar",
        "emoji",
        "spinner",
        "loader",
        "placeholder",
        "favicon",
        "sprite",
        "blank.gif",
        "pixel"
    ];

    if (rejected.some(word => text.includes(word))) {
        return false;
    }

    if (/\.svg(?:\?|$)/i.test(text)) return false;

    return true;
}

function imageFromTag(tag, base) {
    const candidates = [
        attributeValue(tag, "data-src"),
        attributeValue(tag, "data-lazy-src"),
        attributeValue(tag, "data-original"),
        attributeValue(tag, "src")
    ];

    const srcset =
        attributeValue(tag, "srcset") ||
        attributeValue(tag, "data-srcset");

    if (srcset) {
        const first = srcset
            .split(",")[0]
            ?.trim()
            .split(/\s+/)[0];

        if (first) candidates.unshift(first);
    }

    for (const candidate of candidates) {
        const url = absoluteURL(candidate, base);

        if (usefulImage(url)) return url;
    }

    return "";
}

function extractMetaImage(html, base) {
    const tags = [
        ...String(html || "").matchAll(/<meta\b[^>]*>/gi)
    ].map(match => match[0]);

    const wanted = [
        "og:image",
        "og:image:secure_url",
        "twitter:image",
        "twitter:image:src"
    ];

    for (const key of wanted) {
        for (const tag of tags) {
            const marker = (
                attributeValue(tag, "property") ||
                attributeValue(tag, "name")
            ).toLowerCase();

            if (marker !== key) continue;

            const url = absoluteURL(
                attributeValue(tag, "content"),
                base
            );

            if (usefulImage(url)) return url;
        }
    }

    return "";
}

function extractPageImage(html, base) {
    const meta = extractMetaImage(html, base);

    if (meta) return meta;

    for (const match of String(html || "").matchAll(/<img\b[^>]*>/gi)) {
        const url = imageFromTag(match[0], base);

        if (url) return url;
    }

    return "";
}

function extractSegmentImage(segment, base) {
    for (const match of String(segment || "").matchAll(/<img\b[^>]*>/gi)) {
        const url = imageFromTag(match[0], base);

        if (url) return url;
    }

    return "";
}

// ========================================
// IZDVAJANJE DOGADJAJA
// ========================================

function extractEvents(html, sourceURL) {
    const content = String(html || "").replace(
        /<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
        ""
    );

    const headings = [
        ...content.matchAll(/<h4\b[^>]*>([\s\S]*?)<\/h4\s*>/gi)
    ];

    const events = [];

    for (let index = 0; index < headings.length; index++) {
        const heading = headings[index];
        const headingHTML = heading[1];
        const headingText = htmlText(headingHTML);

        const segment = content.slice(
            heading.index + heading[0].length,
            headings[index + 1]?.index ?? content.length
        );

        const strong = headingHTML.match(
            /<strong\b[^>]*>([\s\S]*?)<\/strong\s*>/i
        );

        let program = strong ? htmlText(strong[1]) : "";

        if (!program) {
            const parts = headingHTML
                .split(/<br\b[^>]*>/i)
                .map(htmlText)
                .filter(Boolean);

            program = parts.length > 1
                ? parts.slice(1).join(" ")
                : "";
        }

        if (!program) {
            const segmentText = htmlText(segment);

            const reserveIndex = foldText(
                segmentText
            ).indexOf("rezervisi online");

            program = reserveIndex > 0
                ? segmentText.slice(0, reserveIndex).trim()
                : "";
        }

        if (!program) continue;

        let date = "";
        let eventURL = "";

        for (const anchor of segment.matchAll(/<a\b[^>]*>/gi)) {
            const href = attributeValue(anchor[0], "href");

            if (!href) continue;

            try {
                const link = new URL(href, sourceURL);

                const parsed = sourceDate(
                    link.searchParams.get("date") || ""
                );

                if (parsed) {
                    date = parsed;
                    eventURL = link.toString();
                    break;
                }
            } catch {
                // Neispravan link.
            }
        }

        if (!date) {
            date = dateFromHeading(headingText);
        }

        if (!date) continue;

        const image = extractSegmentImage(
            segment,
            sourceURL
        );

        events.push({
            date,
            program,
            image: image || null,
            sourceUrl: eventURL || sourceURL
        });
    }

    return events.filter(
        (event, index, all) =>
            all.findIndex(
                item =>
                    item.date === event.date &&
                    item.program === event.program
            ) === index
    );
}

// ========================================
// UCITAVANJE PROGRAMA
// ========================================

const programCache = new Map();
const pendingPrograms = new Map();

async function fetchClubPage(key) {
    const response = await fetch(CLUBS[key].url, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "sr-RS,sr;q=0.9,en;q=0.8",
            "Cache-Control": "no-cache"
        },
        signal: AbortSignal.timeout(20000)
    });

    if (!response.ok) {
        throw new Error(
            `Beograd Noću: HTTP ${response.status}`
        );
    }

    const html = await response.text();
    const finalURL = response.url || CLUBS[key].url;

    const events = extractEvents(html, finalURL);
    const clubImage = extractPageImage(html, finalURL);

    const hasProgramSection =
        /\bid\s*=\s*(?:"accordion"|'accordion'|accordion(?=[\s>]))/i.test(html);

    const hasDatedLinks =
        /[?&](?:amp;)?date=\d/i.test(html);

    if (
        !events.length &&
        (!hasProgramSection || hasDatedLinks)
    ) {
        throw new Error(
            `Beograd Noću: program nije pročitan (${html.length} znakova)`
        );
    }

    return {
        events,
        clubImage: clubImage || null,
        fetchedAt: new Date().toISOString()
    };
}

async function getClubData(key) {
    const cached = programCache.get(key);

    if (cached && cached.expires > Date.now()) {
        return cached.data;
    }

    if (pendingPrograms.has(key)) {
        return pendingPrograms.get(key);
    }

    const request = (async () => {
        const data = await fetchClubPage(key);

        programCache.set(key, {
            data,
            expires: Date.now() +
                (data.events.length ? 120000 : 30000)
        });

        console.log(
            `Program ${key}: učitano ${data.events.length} događaja sa Beograd Noću.`
        );

        return data;
    })();

    pendingPrograms.set(key, request);

    try {
        return await request;
    } finally {
        pendingPrograms.delete(key);
    }
}

// ========================================
// NAJBLIZI VIKEND
// ========================================

function eventsForRange(events, start, end, today) {
    return events
        .filter(event => {
            const dow = dayOfWeek(event.date);

            return (
                event.date >= today &&
                event.date >= start &&
                event.date <= end &&
                (dow === 5 || dow === 6 || dow === 0)
            );
        })
        .sort(
            (a, b) =>
                a.date.localeCompare(b.date) ||
                a.program.localeCompare(b.program)
        );
}

function selectWeekend(events) {
    const today = todayInBelgrade();
    const primaryStart = weekendStartFor(today);
    const primary = weekendRangeFromStart(primaryStart);

    const primaryEvents = eventsForRange(
        events,
        primary.start,
        primary.end,
        today
    );

    if (primaryEvents.length) {
        return {
            ...primary,
            events: primaryEvents
        };
    }

    const futureWeekendEvent = events
        .filter(event => {
            const dow = dayOfWeek(event.date);

            return event.date >= today &&
                (dow === 5 || dow === 6 || dow === 0);
        })
        .sort(
            (a, b) => a.date.localeCompare(b.date)
        )[0];

    if (futureWeekendEvent) {
        const start = weekendStartFor(
            futureWeekendEvent.date
        );

        const range = weekendRangeFromStart(start);

        return {
            ...range,
            events: eventsForRange(
                events,
                range.start,
                range.end,
                today
            )
        };
    }

    return {
        ...primary,
        events: []
    };
}

// ========================================
// API VIKEND DOGADJAJA
// ========================================

app.get("/api/weekend", async (req, res) => {
    const key = clean(req.query.club).toLowerCase();

    if (!Object.hasOwn(CLUBS, key)) {
        return res.status(400).json({
            error: "Nepoznat klub."
        });
    }

    try {
        const data = await getClubData(key);
        const weekend = selectWeekend(data.events);

        const fallbackImage = data.clubImage || null;

        const events = weekend.events.map(event => ({
            date: event.date,
            program: event.program,
            image: event.image || fallbackImage,
            sourceUrl: event.sourceUrl || CLUBS[key].url
        }));

        res.setHeader("Cache-Control", "no-store");

        res.json({
            club: CLUBS[key].name,
            clubKey: key,
            clubImage: fallbackImage,
            windowStart: weekend.start,
            windowEnd: weekend.end,
            windowLabel: formatWindowLabel(
                weekend.start,
                weekend.end
            ),
            events,
            source: "Beograd Noću",
            sourceUrl: CLUBS[key].url,
            fetchedAt: data.fetchedAt
        });

    } catch (error) {
        console.error(
            `Weekend program (${key}):`,
            error.message
        );

        res.status(502).json({
            error:
                "Program trenutno nije moguće učitati sa Beograd Noću. Pokušaj ponovo."
        });
    }
});

// ========================================
// KOMPATIBILNOST SA STARIM FRONTENDOM
// ========================================

app.get("/api/program", async (req, res) => {
    const key = clean(req.query.club).toLowerCase();
    const date = clean(req.query.date);

    if (!Object.hasOwn(CLUBS, key)) {
        return res.status(400).json({
            error: "Nepoznat klub."
        });
    }

    if (!validDate(date) || date < todayInBelgrade()) {
        return res.status(400).json({
            error: "Izaberi današnji ili budući datum."
        });
    }

    try {
        const data = await getClubData(key);

        const matches = data.events.filter(
            event => event.date === date
        );

        const programs = [
            ...new Set(
                matches.map(event => event.program)
            )
        ];

        res.setHeader("Cache-Control", "no-store");

        res.json({
            found: programs.length > 0,
            club: CLUBS[key].name,
            date,
            program: programs.join("\n") || null,
            image:
                matches.find(event => event.image)?.image ||
                data.clubImage ||
                null
        });

    } catch (error) {
        console.error(
            `Program (${key}):`,
            error.message
        );

        res.status(502).json({
            error:
                "Program trenutno nije moguće učitati. Pokušaj ponovo."
        });
    }
});

// ========================================
// SLANJE REZERVACIJE
// ========================================

app.post("/api/reservations", async (req, res) => {
    const body = req.body || {};

    const club = clean(body.club).toLowerCase();
    const date = clean(body.date);
    const program = clean(body.program);
    const name = clean(body.name);
    const phone = clean(body.phone);
    const instagram = clean(body.instagram);
    const guests = Number(body.guests);
    const tableType = clean(body.tableType);

    if (!Object.hasOwn(CLUBS, club)) {
        return res.status(400).json({
            error: "Izaberi validan klub."
        });
    }

    if (!validDate(date) || date < todayInBelgrade()) {
        return res.status(400).json({
            error: "Izaberi validan budući događaj."
        });
    }

    if (!program || program.length > 500) {
        return res.status(400).json({
            error: "Izaberi validan događaj."
        });
    }

    if (
        name.length < 2 ||
        name.length > 150 ||
        !phone ||
        phone.length > 100 ||
        instagram.length > 150
    ) {
        return res.status(400).json({
            error: "Proveri ime, telefon i Instagram podatke."
        });
    }

    if (
        !Number.isInteger(guests) ||
        guests < 1 ||
        guests > 30
    ) {
        return res.status(400).json({
            error: "Broj osoba mora biti između 1 i 30."
        });
    }

    const table = TABLES[club].find(
        item => item.type === tableType
    );

    if (!table) {
        return res.status(400).json({
            error: "Izaberi validan tip stola."
        });
    }

    if (!databaseReady) {
        return res.status(503).json({
            error:
                "Baza trenutno nije dostupna. Pokušaj ponovo kasnije."
        });
    }

    try {
        const result = await pool.query(`
            INSERT INTO reservations (
                club,
                event_date,
                event_program,
                name,
                phone,
                instagram,
                guests,
                table_type,
                table_condition,
                status
            )
            VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, 'pending'
            )
            RETURNING *
        `, [
            club,
            date,
            program,
            name,
            phone,
            instagram || null,
            guests,
            table.type,
            table.condition
        ]);

        console.log(
            `Nova rezervacija #${result.rows[0].id}: ${club}, ${date}`
        );

        res.status(201).json({
            success: true,
            reservation: result.rows[0]
        });

    } catch (error) {
        console.error(
            "Čuvanje rezervacije:",
            error.message
        );

        res.status(500).json({
            error:
                "Rezervacija nije sačuvana. Pokušaj ponovo."
        });
    }
});

// ========================================
// ADMIN - UCITAVANJE REZERVACIJA
// ========================================

app.get(
    "/api/reservations",
    adminAuth,
    requireDatabase,
    async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT *
                FROM reservations
                ORDER BY event_date ASC NULLS LAST,
                         created_at DESC
            `);

            res.json(result.rows);

        } catch (error) {
            console.error(
                "Čitanje rezervacija:",
                error.message
            );

            res.status(500).json({
                error:
                    "Rezervacije trenutno nije moguće učitati."
            });
        }
    }
);

// ========================================
// ADMIN - PROMENA STATUSA
// ========================================

app.patch(
    "/api/reservations/:id",
    adminAuth,
    requireDatabase,
    async (req, res) => {
        const id = Number(req.params.id);
        const status = clean(
            req.body?.status
        ).toLowerCase();

        if (
            !Number.isSafeInteger(id) ||
            id < 1
        ) {
            return res.status(400).json({
                error: "Neispravan ID rezervacije."
            });
        }

        if (
            !["pending", "confirmed", "cancelled"]
                .includes(status)
        ) {
            return res.status(400).json({
                error: "Neispravan status."
            });
        }

        try {
            const result = await pool.query(`
                UPDATE reservations
                SET status = $1
                WHERE id = $2
                RETURNING *
            `, [status, id]);

            if (!result.rowCount) {
                return res.status(404).json({
                    error: "Rezervacija nije pronađena."
                });
            }

            res.json({
                success: true,
                reservation: result.rows[0]
            });

        } catch (error) {
            console.error(
                "Promena statusa:",
                error.message
            );

            res.status(500).json({
                error:
                    "Status trenutno nije moguće promeniti."
            });
        }
    }
);

// ========================================
// ADMIN - BRISANJE REZERVACIJE
// ========================================

app.delete(
    "/api/reservations/:id",
    adminAuth,
    requireDatabase,
    async (req, res) => {
        const id = Number(req.params.id);

        if (
            !Number.isSafeInteger(id) ||
            id < 1
        ) {
            return res.status(400).json({
                error: "Neispravan ID rezervacije."
            });
        }

        try {
            const result = await pool.query(`
                DELETE FROM reservations
                WHERE id = $1
                RETURNING id
            `, [id]);

            if (!result.rowCount) {
                return res.status(404).json({
                    error: "Rezervacija nije pronađena."
                });
            }

            res.json({
                success: true
            });

        } catch (error) {
            console.error(
                "Brisanje rezervacije:",
                error.message
            );

            res.status(500).json({
                error:
                    "Rezervaciju trenutno nije moguće obrisati."
            });
        }
    }
);

// ========================================
// NEPOSTOJECE API RUTE
// ========================================

app.use("/api", (req, res) => {
    res.status(404).json({
        error: "API ruta nije pronađena."
    });
});

// ========================================
// GLAVNA STRANICA
// ========================================

app.get("/{*splat}", (req, res) => {
    res.setHeader("Cache-Control", "no-cache");

    res.sendFile(
        path.join(PUBLIC_DIR, "index.html")
    );
});

// ========================================
// OBRADA SERVER GRESAKA
// ========================================

app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    console.error(
        "HTTP greška:",
        error.message
    );

    const status =
        error.status === 400 ||
        error.status === 413
            ? error.status
            : 500;

    res.status(status).json({
        error:
            status === 400
                ? "Neispravan zahtev."
                : status === 413
                    ? "Zahtev je prevelik."
                    : "Došlo je do greške na serveru."
    });
});

// ========================================
// POKRETANJE SERVERA
// ========================================

async function startServer() {
    const indexFile = path.join(
        PUBLIC_DIR,
        "index.html"
    );

    if (!fs.existsSync(indexFile)) {
        throw new Error(
            `Nedostaje public/index.html. Proveri folder: ${PUBLIC_DIR}`
        );
    }

    await initializeDatabase();

    app.listen(PORT, "0.0.0.0", error => {
        if (error) {
            console.error(
                "Pokretanje servera:",
                error.message
            );

            process.exit(1);
        }

        console.log(
            `NightBook radi na portu ${PORT}`
        );

        console.log(
            "NightBook weekend verzija je pokrenuta."
        );
    });
}

startServer().catch(error => {
    console.error(error.message);
    process.exit(1);
});
