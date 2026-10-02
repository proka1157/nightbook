// server/server.js — zameni ceo postojeći sadržaj ovog fajla.

"use strict";

const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

// server/server.js koristi glavni public folder, van server foldera.
const PUBLIC_DIR = path.resolve(__dirname, "..", "public");

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

// KLUBOVI

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

// USLOVI STOLOVA
// app.js preuzima ove podatke preko /api/clubs.

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

// POMOĆNE FUNKCIJE

function clean(value) {
    return typeof value === "string" ? value.trim() : "";
}

function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const date = new Date(`${value}T12:00:00Z`);

    return (
        Number.isFinite(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
    );
}

function todayInBelgrade() {
    const parts = new Intl.DateTimeFormat("en", {
        timeZone: "Europe/Belgrade",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const get = type => parts.find(part => part.type === type).value;

    return `${get("year")}-${get("month")}-${get("day")}`;
}

// ADMIN PRIJAVA

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
        const credentials = Buffer
            .from(header.slice(6), "base64")
            .toString("utf8");

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

// ZAŠTIĆENA ADMIN STRANICA

app.get(
    ["/admin", "/admin.html"],
    adminAuth,
    (req, res) => {
        res.sendFile(path.join(PUBLIC_DIR, "admin.html"));
    }
);

// Zaštita admin.html i kroz alternativno zapisane putanje.

app.use((req, res, next) => {
    let pathname;

    try {
        pathname = decodeURIComponent(req.path);
    } catch {
        return res.status(400).json({
            error: "Neispravna putanja."
        });
    }

    if (path.posix.basename(pathname).toLowerCase() === "admin.html") {
        return adminAuth(req, res, next);
    }

    next();
});

// STATIČKI FAJLOVI

app.use(
    express.static(PUBLIC_DIR, {
        index: false,

        setHeaders(res) {
            res.setHeader("Cache-Control", "no-cache");
        }
    })
);

// POSTGRESQL

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

async function initializeDatabase() {
    if (!pool) {
        console.warn(
            "DATABASE_URL nije podešen. Rezervacije trenutno nisu dostupne."
        );
        return;
    }

    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reservations (
                id SERIAL PRIMARY KEY,
                club VARCHAR(100) NOT NULL,
                event_date DATE NOT NULL,
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

        databaseReady = true;
        console.log("NightBook baza je spremna.");
    } catch (error) {
        console.error("Baza nije spremna:", error.message);
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

// PODACI O KLUBOVIMA I STOLOVIMA

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

// ČITANJE PROGRAMA SA BEOGRAD NOĆU

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
                const n = code[0].toLowerCase() === "x"
                    ? parseInt(code.slice(1), 16)
                    : Number(code);

                return n >= 0 && n <= 0x10ffff
                    ? String.fromCodePoint(n)
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

function extractEvents(html, sourceURL) {
    const accordion = html.match(
        /<div\b[^>]*id=["']accordion["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/i
    );

    if (!accordion) return [];

    const content = accordion[1];

    const headings = [
        ...content.matchAll(/<h4\b[^>]*>([\s\S]*?)<\/h4>/gi)
    ];

    const events = [];

    headings.forEach((heading, index) => {
        const segment = content.slice(
            heading.index,
            headings[index + 1]?.index ?? content.length
        );

        const title = heading[1].match(
            /<strong\b[^>]*>([\s\S]*?)<\/strong>/i
        );

        const program = title ? htmlText(title[1]) : "";

        if (!program) return;

        for (
            const link of segment.matchAll(
                /href\s*=\s*["']([^"']+)["']/gi
            )
        ) {
            try {
                const value = new URL(
                    decodeEntities(link[1]),
                    sourceURL
                ).searchParams.get("date") || "";

                const parts = value.match(
                    /^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/
                );

                if (!parts) continue;

                const date =
                    `${parts[3]}-` +
                    `${parts[2].padStart(2, "0")}-` +
                    `${parts[1].padStart(2, "0")}`;

                if (validDate(date)) {
                    events.push({ date, program });
                    break;
                }
            } catch {
                // Preskoči neispravan link iz izvora.
            }
        }
    });

    return events;
}

// KEŠ PROGRAMA

const programCache = new Map();
const pendingPrograms = new Map();

async function getClubEvents(key) {
    const cached = programCache.get(key);

    if (cached && cached.expires > Date.now()) {
        return cached.events;
    }

    if (pendingPrograms.has(key)) {
        return pendingPrograms.get(key);
    }

    const request = (async () => {
        const response = await fetch(CLUBS[key].url, {
            headers: {
                "User-Agent": "Mozilla/5.0 NightBook/1.0",
                Accept: "text/html"
            },

            signal: AbortSignal.timeout(12000)
        });

        if (!response.ok) {
            throw new Error(
                `Izvor je vratio HTTP ${response.status}`
            );
        }

        const events = extractEvents(
            await response.text(),
            CLUBS[key].url
        );

        programCache.set(key, {
            events,
            expires: Date.now() + 180000
        });

        return events;
    })();

    pendingPrograms.set(key, request);

    try {
        return await request;
    } finally {
        pendingPrograms.delete(key);
    }
}

// PROGRAM API

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
        const events = await getClubEvents(key);

        const programs = [
            ...new Set(
                events
                    .filter(event => event.date === date)
                    .map(event => event.program)
            )
        ];

        res.setHeader("Cache-Control", "no-cache");

        res.json({
            found: programs.length > 0,
            club: CLUBS[key].name,
            date,
            program: programs.join("\n") || null
        });
    } catch (error) {
        console.error(`Program (${key}):`, error.message);

        res.status(502).json({
            error: "Program trenutno nije moguće učitati. Pokušaj ponovo."
        });
    }
});

// NOVA REZERVACIJA

app.post("/api/reservations", async (req, res) => {
    const body = req.body || {};

    const club = clean(body.club).toLowerCase();
    const date = clean(body.date);
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
            error: "Izaberi današnji ili budući datum."
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
            error: "Baza trenutno nije dostupna. Pokušaj ponovo kasnije."
        });
    }

    try {
        const result = await pool.query(`
            INSERT INTO reservations
            (
                club,
                event_date,
                name,
                phone,
                instagram,
                guests,
                table_type,
                table_condition,
                status
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, 'pending'
            )
            RETURNING *
        `, [
            club,
            date,
            name,
            phone,
            instagram || null,
            guests,
            table.type,
            table.condition
        ]);

        res.status(201).json({
            success: true,
            reservation: result.rows[0]
        });
    } catch (error) {
        console.error("Čuvanje rezervacije:", error.message);

        res.status(500).json({
            error: "Rezervacija nije sačuvana. Pokušaj ponovo."
        });
    }
});

// ADMIN — LISTA REZERVACIJA

app.get(
    "/api/reservations",
    adminAuth,
    requireDatabase,
    async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT *
                FROM reservations
                ORDER BY event_date ASC, created_at DESC
            `);

            res.json(result.rows);
        } catch (error) {
            console.error("Čitanje rezervacija:", error.message);

            res.status(500).json({
                error: "Rezervacije trenutno nije moguće učitati."
            });
        }
    }
);

// ADMIN — PROMENA STATUSA

app.patch(
    "/api/reservations/:id",
    adminAuth,
    requireDatabase,
    async (req, res) => {
        const id = Number(req.params.id);
        const status = clean(req.body?.status).toLowerCase();

        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(400).json({
                error: "Neispravan ID rezervacije."
            });
        }

        if (!["pending", "confirmed", "cancelled"].includes(status)) {
            return res.status(400).json({
                error: "Neispravan status."
            });
        }

        try {
            const result = await pool.query(
                "UPDATE reservations SET status = $1 WHERE id = $2 RETURNING *",
                [status, id]
            );

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
            console.error("Promena statusa:", error.message);

            res.status(500).json({
                error: "Status trenutno nije moguće promeniti."
            });
        }
    }
);

// ADMIN — BRISANJE REZERVACIJE

app.delete(
    "/api/reservations/:id",
    adminAuth,
    requireDatabase,
    async (req, res) => {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id < 1) {
            return res.status(400).json({
                error: "Neispravan ID rezervacije."
            });
        }

        try {
            const result = await pool.query(
                "DELETE FROM reservations WHERE id = $1 RETURNING id",
                [id]
            );

            if (!result.rowCount) {
                return res.status(404).json({
                    error: "Rezervacija nije pronađena."
                });
            }

            res.json({ success: true });
        } catch (error) {
            console.error("Brisanje rezervacije:", error.message);

            res.status(500).json({
                error: "Rezervaciju trenutno nije moguće obrisati."
            });
        }
    }
);

// NEPOSTOJEĆE API RUTE

app.use("/api", (req, res) => {
    res.status(404).json({
        error: "API ruta nije pronađena."
    });
});

// FRONTEND — EXPRESS 5 KOMPATIBILNA RUTA

app.get("/{*splat}", (req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// OBRADA GREŠAKA

app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);

    console.error("HTTP greška:", error.message);

    const status =
        error.status === 400 || error.status === 413
            ? error.status
            : 500;

    const message =
        status === 400
            ? "Neispravan zahtev."
            : status === 413
                ? "Zahtev je prevelik."
                : "Došlo je do greške na serveru.";

    res.status(status).json({ error: message });
});

// POKRETANJE

async function startServer() {
    if (!fs.existsSync(path.join(PUBLIC_DIR, "index.html"))) {
        throw new Error(
            `Nedostaje public/index.html. Proveri folder: ${PUBLIC_DIR}`
        );
    }

    await initializeDatabase();

    app.listen(PORT, "0.0.0.0", error => {
        if (error) {
            console.error("Pokretanje servera:", error.message);
            process.exit(1);
        }

        console.log(`NightBook radi na portu ${PORT}`);
    });
}

startServer().catch(error => {
    console.error(error.message);
    process.exit(1);
});
