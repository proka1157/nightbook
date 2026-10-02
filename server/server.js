const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();

const PORT =
    process.env.PORT || 3000;


// =========================================================
// BASIC MIDDLEWARE
// =========================================================

app.use(express.json({
    limit: "100kb"
}));

app.use(express.urlencoded({
    extended: true
}));


// =========================================================
// ADMIN AUTH
// =========================================================

function adminAuth(req, res, next) {

    const ADMIN_USER =
        process.env.ADMIN_USER;

    const ADMIN_PASSWORD =
        process.env.ADMIN_PASSWORD;

    if (
        !ADMIN_USER ||
        !ADMIN_PASSWORD
    ) {

        console.error(
            "ADMIN_USER ili ADMIN_PASSWORD nisu podešeni."
        );

        return res
            .status(503)
            .send(
                "Admin pristup trenutno nije podešen."
            );

    }

    const authHeader =
        req.headers.authorization;

    if (
        !authHeader ||
        !authHeader.startsWith("Basic ")
    ) {

        res.setHeader(
            "WWW-Authenticate",
            'Basic realm="NightBook Admin"'
        );

        return res
            .status(401)
            .send(
                "Potrebna je prijava."
            );

    }

    try {

        const encodedCredentials =
            authHeader.split(" ")[1];

        const decodedCredentials =
            Buffer
                .from(
                    encodedCredentials,
                    "base64"
                )
                .toString(
                    "utf8"
                );

        const separatorIndex =
            decodedCredentials.indexOf(":");

        if (separatorIndex === -1) {

            throw new Error(
                "Neispravan auth format."
            );

        }

        const username =
            decodedCredentials.slice(
                0,
                separatorIndex
            );

        const password =
            decodedCredentials.slice(
                separatorIndex + 1
            );

        if (
            username !== ADMIN_USER ||
            password !== ADMIN_PASSWORD
        ) {

            res.setHeader(
                "WWW-Authenticate",
                'Basic realm="NightBook Admin"'
            );

            return res
                .status(401)
                .send(
                    "Pogrešno korisničko ime ili lozinka."
                );

        }

        next();

    } catch (error) {

        console.error(
            "Admin auth greška:",
            error
        );

        res.setHeader(
            "WWW-Authenticate",
            'Basic realm="NightBook Admin"'
        );

        return res
            .status(401)
            .send(
                "Neispravna prijava."
            );

    }

}


// =========================================================
// PROTECTED ADMIN PAGE
// =========================================================

app.get(
    "/admin",
    adminAuth,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "public",
                "admin.html"
            )
        );

    }
);

app.get(
    "/admin.html",
    adminAuth,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "public",
                "admin.html"
            )
        );

    }
);


// =========================================================
// STATIC FILES
// =========================================================

app.use(
    express.static(
        path.join(
            __dirname,
            "public"
        ),
        {
            index: false
        }
    )
);


// =========================================================
// POSTGRESQL
// =========================================================

let pool = null;

if (process.env.DATABASE_URL) {

    pool = new Pool({

        connectionString:
            process.env.DATABASE_URL,

        ssl:
            process.env.NODE_ENV ===
            "production"
                ? {
                    rejectUnauthorized:
                        false
                }
                : false

    });

    pool.on(
        "error",
        (error) => {

            console.error(
                "Neočekivana PostgreSQL greška:",
                error
            );

        }
    );

} else {

    console.warn(
        "DATABASE_URL nije podešen. Rezervacije neće raditi dok baza ne bude povezana."
    );

}


// =========================================================
// DATABASE INITIALIZATION
// =========================================================

async function initializeDatabase() {

    if (!pool) {
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

                status VARCHAR(50)
                    NOT NULL
                    DEFAULT 'pending',

                created_at TIMESTAMPTZ
                    NOT NULL
                    DEFAULT NOW()

            );
        `);

        console.log(
            "NightBook baza je spremna."
        );

    } catch (error) {

        console.error(
            "Greška pri inicijalizaciji baze:",
            error
        );

    }

}


// =========================================================
// CLUB SOURCES
// =========================================================

const CLUBS = {

    lasta: {

        name:
            "Klub Lasta",

        aliases: [
            "Klub Lasta",
            "Lasta"
        ],

        url:
            "https://www.beogradnocu.com/klubovi-u-beogradu/klub-lasta/"

    },

    freestyler: {

        name:
            "Freestyler",

        aliases: [
            "Freestyler",
            "Freestyler Winter Stage",
            "Club Freestyler"
        ],

        url:
            "https://www.beogradnocu.com/klubovi-u-beogradu/club-freestyler/"

    },

    remiks: {

        name:
            "Remiks",

        aliases: [
            "Remiks",
            "Klub Remiks"
        ],

        url:
            "https://www.beogradnocu.com/klubovi-u-beogradu/remiks/"

    },

    tranzit: {

        name:
            "Tranzit",

        aliases: [
            "Tranzit",
            "Klub Tranzit",
            "Klub Tranzit Savamala"
        ],

        url:
            "https://www.beogradnocu.com/klubovi-u-beogradu/tranzit-bar/"

    },

    bank: {

        name:
            "The Bank",

        aliases: [
            "The Bank",
            "The Bank klub",
            "The Bank Club",
            "Klub Bank"
        ],

        url:
            "https://www.beogradnocu.com/klubovi-u-beogradu/klub-bank/"

    },

    hype: {

        name:
            "Klub Hype",

        aliases: [
            "Klub Hype",
            "Hype",
            "Hype Belgrade",
            "Club Hype"
        ],

        url:
            "https://www.beogradnocu.com/klubovi-u-beogradu/klub-hype/"

    },

    gradska: {

        name:
            "Gradska kafana",

        aliases: [
            "Gradska kafana",
            "Gradska Kafana"
        ],

        url:
            "https://www.beogradnocu.com/kafane-u-beogradu/gradska-kafana/"

    }

};


// =========================================================
// DATE HELPERS
// =========================================================

const SERBIAN_MONTHS = {

    januar: 0,
    januara: 0,

    februar: 1,
    februara: 1,

    mart: 2,
    marta: 2,

    april: 3,
    aprila: 3,

    maj: 4,
    maja: 4,

    jun: 5,
    juna: 5,

    jul: 6,
    jula: 6,

    avgust: 7,
    avgusta: 7,

    septembar: 8,
    septembra: 8,

    oktobar: 9,
    oktobra: 9,

    novembar: 10,
    novembra: 10,

    decembar: 11,
    decembra: 11

};


function parseRequestedDate(value) {

    if (
        !value ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {

        return null;

    }

    const [
        year,
        month,
        day
    ] = value
        .split("-")
        .map(Number);

    const date =
        new Date(
            year,
            month - 1,
            day,
            12,
            0,
            0,
            0
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {

        return null;

    }

    return date;

}


function normalizeText(value) {

    return String(
        value || ""
    )
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


// =========================================================
// HTML HELPERS
// =========================================================

function decodeHTMLEntities(value) {

    return String(
        value || ""
    )

        .replace(
            /&nbsp;/gi,
            " "
        )

        .replace(
            /&amp;/gi,
            "&"
        )

        .replace(
            /&quot;/gi,
            '"'
        )

        .replace(
            /&#039;/gi,
            "'"
        )

        .replace(
            /&apos;/gi,
            "'"
        )

        .replace(
            /&lt;/gi,
            "<"
        )

        .replace(
            /&gt;/gi,
            ">"
        )

        .replace(
            /&#(\d+);/g,
            (
                match,
                code
            ) => {

                return String.fromCharCode(
                    Number(code)
                );

            }
        );

}


function htmlToText(html) {

    return decodeHTMLEntities(
        String(
            html || ""
        )

            .replace(
                /<script[\s\S]*?<\/script>/gi,
                " "
            )

            .replace(
                /<style[\s\S]*?<\/style>/gi,
                " "
            )

            .replace(
                /<br\s*\/?>/gi,
                "\n"
            )

            .replace(
                /<\/p>/gi,
                "\n"
            )

            .replace(
                /<\/div>/gi,
                "\n"
            )

            .replace(
                /<\/h[1-6]>/gi,
                "\n"
            )

            .replace(
                /<\/li>/gi,
                "\n"
            )

            .replace(
                /<[^>]+>/g,
                " "
            )
    )

        .replace(
            /\r/g,
            ""
        )

        .replace(
            /[ \t]+/g,
            " "
        )

        .replace(
            /\n[ \t]+/g,
            "\n"
        )

        .replace(
            /\n{3,}/g,
            "\n\n"
        )

        .trim();

}


// =========================================================
// FETCH PAGE
// =========================================================

async function fetchPage(
    url
) {

    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () => {

                controller.abort();

            },
            9000
        );

    try {

        const response =
            await fetch(
                url,
                {

                    headers: {

                        "User-Agent":
                            "Mozilla/5.0 NightBook/1.0",

                        "Accept":
                            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

                        "Accept-Language":
                            "sr-RS,sr;q=0.9,en;q=0.8"

                    },

                    signal:
                        controller.signal

                }
            );

        if (!response.ok) {

            throw new Error(
                `Source HTTP ${response.status}`
            );

        }

        return await response.text();

    } finally {

        clearTimeout(
            timeout
        );

    }

}


// =========================================================
// PROGRAM PARSING
// =========================================================

function buildDateMatchers(
    date
) {

    const day =
        date.getDate();

    const month =
        date.getMonth();

    const year =
        date.getFullYear();

    const monthNames =
        Object.entries(
            SERBIAN_MONTHS
        )
            .filter(
                (
                    [
                        name,
                        index
                    ]
                ) => {

                    return index === month;

                }
            )
            .map(
                (
                    [
                        name
                    ]
                ) => name
            );

    return {

        day,
        month,
        year,
        monthNames

    };

}


function lineMatchesDate(
    line,
    requestedDate
) {

    const normalized =
        normalizeText(line);

    const {
        day,
        monthNames
    } =
        buildDateMatchers(
            requestedDate
        );

    const containsDay =
        new RegExp(
            `(^|\\D)0?${day}(\\D|$)`
        ).test(
            normalized
        );

    if (!containsDay) {

        return false;

    }

    const containsMonth =
        monthNames.some(
            (monthName) => {

                return normalized.includes(
                    normalizeText(
                        monthName
                    )
                );

            }
        );

    return containsMonth;

}


function cleanProgramLine(
    line
) {

    return String(
        line || ""
    )

        .replace(
            /\s+/g,
            " "
        )

        .replace(
            /^[-–—•]+\s*/,
            ""
        )

        .trim();

}


function isNoiseLine(
    line
) {

    const normalized =
        normalizeText(line);

    if (!normalized) {

        return true;

    }

    const noise = [

        "rezervisi online",
        "online rezervacije",
        "program kluba",
        "telefoni za rezervacije",
        "enterijer",
        "galerija",
        "lokacija",
        "adresa",
        "radno vreme",
        "beograd nocu"

    ];

    return noise.some(
        (item) => {

            return normalized ===
                normalizeText(item);

        }
    );

}


function extractProgramFromText(
    text,
    requestedDate
) {

    const lines =
        String(
            text || ""
        )
            .split("\n")
            .map(
                cleanProgramLine
            )
            .filter(Boolean);

    if (!lines.length) {

        return null;

    }

    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        if (
            !lineMatchesDate(
                lines[i],
                requestedDate
            )
        ) {

            continue;

        }

        const candidates =
            [];

        for (
            let offset = 1;
            offset <= 4;
            offset++
        ) {

            const nextLine =
                lines[
                    i + offset
                ];

            if (!nextLine) {

                break;

            }

            if (
                lineMatchesDate(
                    nextLine,
                    requestedDate
                )
            ) {

                continue;

            }

            if (
                isNoiseLine(
                    nextLine
                )
            ) {

                continue;

            }

            const normalized =
                normalizeText(
                    nextLine
                );

            if (
                normalized.includes(
                    "rezervisi"
                )
            ) {

                break;

            }

            if (
                normalized.includes(
                    "program kluba"
                )
            ) {

                break;

            }

            candidates.push(
                nextLine
            );

            if (
                candidates.join(" ")
                    .length >
                250
            ) {

                break;

            }

        }

        if (
            candidates.length
        ) {

            return candidates
                .join(" ")
                .trim();

        }

    }

    return null;

}


// =========================================================
// PROGRAM CACHE
// =========================================================

const programCache =
    new Map();

const PROGRAM_CACHE_TIME =
    5 * 60 * 1000;


function getCachedProgram(
    key
) {

    const cached =
        programCache.get(
            key
        );

    if (!cached) {

        return null;

    }

    if (
        Date.now() -
        cached.createdAt >
        PROGRAM_CACHE_TIME
    ) {

        programCache.delete(
            key
        );

        return null;

    }

    return cached.data;

}


function setCachedProgram(
    key,
    data
) {

    programCache.set(
        key,
        {

            createdAt:
                Date.now(),

            data

        }
    );

}


// =========================================================
// PROGRAM API
// =========================================================

app.get(
    "/api/program",
    async (
        req,
        res
    ) => {

        const clubKey =
            String(
                req.query.club || ""
            )
                .toLowerCase()
                .trim();

        const dateValue =
            String(
                req.query.date || ""
            )
                .trim();

        const club =
            CLUBS[
                clubKey
            ];

        if (!club) {

            return res
                .status(400)
                .json({

                    error:
                        "Nepoznat klub."

                });

        }

        const requestedDate =
            parseRequestedDate(
                dateValue
            );

        if (!requestedDate) {

            return res
                .status(400)
                .json({

                    error:
                        "Neispravan datum."

                });

        }

        const cacheKey =
            `${clubKey}:${dateValue}`;

        const cached =
            getCachedProgram(
                cacheKey
            );

        if (cached) {

            return res.json(
                cached
            );

        }

        try {

            const html =
                await fetchPage(
                    club.url
                );

            const text =
                htmlToText(
                    html
                );

            const program =
                extractProgramFromText(
                    text,
                    requestedDate
                );

            const result =
                program
                    ? {

                        found:
                            true,

                        club:
                            club.name,

                        date:
                            dateValue,

                        program

                    }
                    : {

                        found:
                            false,

                        club:
                            club.name,

                        date:
                            dateValue,

                        program:
                            null

                    };

            setCachedProgram(
                cacheKey,
                result
            );

            return res.json(
                result
            );

        } catch (error) {

            console.error(
                `Program fetch greška (${clubKey}):`,
                error
            );

            return res
                .status(502)
                .json({

                    found:
                        false,

                    error:
                        "Program trenutno nije moguće učitati."

                });

        }

    }
);


// =========================================================
// VALID CLUB
// =========================================================

function isValidClub(
    club
) {

    return Boolean(
        CLUBS[
            String(
                club || ""
            )
                .toLowerCase()
                .trim()
        ]
    );

}


// =========================================================
// CREATE RESERVATION
// =========================================================

app.post(
    "/api/reservations",
    async (
        req,
        res
    ) => {

        if (!pool) {

            return res
                .status(503)
                .json({

                    error:
                        "Baza trenutno nije dostupna."

                });

        }

        const club =
            String(
                req.body.club || ""
            )
                .toLowerCase()
                .trim();

        const date =
            String(
                req.body.date || ""
            )
                .trim();

        const name =
            String(
                req.body.name || ""
            )
                .trim();

        const phone =
            String(
                req.body.phone || ""
            )
                .trim();

        const instagram =
            String(
                req.body.instagram || ""
            )
                .trim();

        const guests =
            Number(
                req.body.guests
            );

        const tableType =
            String(
                req.body.tableType || ""
            )
                .trim();

        const tableCondition =
            String(
                req.body.tableCondition || ""
            )
                .trim();

        if (
            !club ||
            !date ||
            !name ||
            !phone ||
            !guests ||
            !tableType
        ) {

            return res
                .status(400)
                .json({

                    error:
                        "Popuni sva obavezna polja."

                });

        }

        if (
            !isValidClub(
                club
            )
        ) {

            return res
                .status(400)
                .json({

                    error:
                        "Izabrani klub nije validan."

                });

        }

        const requestedDate =
            parseRequestedDate(
                date
            );

        if (!requestedDate) {

            return res
                .status(400)
                .json({

                    error:
                        "Datum nije validan."

                });

        }

        const today =
            new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );

        const reservationDay =
            new Date(
                requestedDate
            );

        reservationDay.setHours(
            0,
            0,
            0,
            0
        );

        if (
            reservationDay <
            today
        ) {

            return res
                .status(400)
                .json({

                    error:
                        "Nije moguće rezervisati datum koji je prošao."

                });

        }

        if (
            !Number.isInteger(
                guests
            ) ||
            guests < 1 ||
            guests > 30
        ) {

            return res
                .status(400)
                .json({

                    error:
                        "Broj osoba mora biti između 1 i 30."

                });

        }

        if (
            name.length > 150 ||
            phone.length > 100 ||
            instagram.length > 150 ||
            tableType.length > 200 ||
            tableCondition.length > 250
        ) {

            return res
                .status(400)
                .json({

                    error:
                        "Uneti podaci su predugački."

                });

        }

        try {

            const result =
                await pool.query(
                    `
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

                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7,
                        $8,
                        'pending'
                    )

                    RETURNING
                        id,
                        club,
                        event_date,
                        name,
                        phone,
                        instagram,
                        guests,
                        table_type,
                        table_condition,
                        status,
                        created_at
                    `,
                    [
                        club,
                        date,
                        name,
                        phone,
                        instagram || null,
                        guests,
                        tableType,
                        tableCondition || null
                    ]
                );

            return res
                .status(201)
                .json({

                    success:
                        true,

                    reservation:
                        result.rows[0]

                });

        } catch (error) {

            console.error(
                "Greška pri čuvanju rezervacije:",
                error
            );

            return res
                .status(500)
                .json({

                    error:
                        "Rezervacija trenutno nije mogla da bude sačuvana."

                });

        }

    }
);


// =========================================================
// ADMIN - GET RESERVATIONS
// =========================================================

app.get(
    "/api/reservations",
    adminAuth,
    async (
        req,
        res
    ) => {

        if (!pool) {

            return res
                .status(503)
                .json({

                    error:
                        "Baza trenutno nije dostupna."

                });

        }

        try {

            const result =
                await pool.query(`
                    SELECT
                        id,
                        club,
                        event_date,
                        name,
                        phone,
                        instagram,
                        guests,
                        table_type,
                        table_condition,
                        status,
                        created_at

                    FROM reservations

                    ORDER BY
                        event_date ASC,
                        created_at DESC
                `);

            return res.json(
                result.rows
            );

        } catch (error) {

            console.error(
                "Greška pri čitanju rezervacija:",
                error
            );

            return res
                .status(500)
                .json({

                    error:
                        "Rezervacije trenutno nije moguće učitati."

                });

        }

    }
);


// =========================================================
// ADMIN - UPDATE RESERVATION
// =========================================================

app.patch(
    "/api/reservations/:id",
    adminAuth,
    async (
        req,
        res
    ) => {

        if (!pool) {

            return res
                .status(503)
                .json({

                    error:
                        "Baza trenutno nije dostupna."

                });

        }

        const id =
            Number(
                req.params.id
            );

        const status =
            String(
                req.body.status || ""
            )
                .toLowerCase()
                .trim();

        const allowedStatuses = [
            "pending",
            "confirmed",
            "cancelled"
        ];

        if (
            !Number.isInteger(
                id
            ) ||
            id < 1
        ) {

            return res
                .status(400)
                .json({

                    error:
                        "Neispravan ID rezervacije."

                });

        }

        if (
            !allowedStatuses.includes(
                status
            )
        ) {

            return res
                .status(400)
                .json({

                    error:
                        "Neispravan status."

                });

        }

        try {

            const result =
                await pool.query(
                    `
                    UPDATE reservations

                    SET status = $1

                    WHERE id = $2

                    RETURNING *
                    `,
                    [
                        status,
                        id
                    ]
                );

            if (
                result.rowCount === 0
            ) {

                return res
                    .status(404)
                    .json({

                        error:
                            "Rezervacija nije pronađena."

                    });

            }

            return res.json({

                success:
                    true,

                reservation:
                    result.rows[0]

            });

        } catch (error) {

            console.error(
                "Greška pri promeni statusa:",
                error
            );

            return res
                .status(500)
                .json({

                    error:
                        "Status trenutno nije moguće promeniti."

                });

        }

    }
);


// =========================================================
// ADMIN - DELETE RESERVATION
// =========================================================

app.delete(
    "/api/reservations/:id",
    adminAuth,
    async (
        req,
        res
    ) => {

        if (!pool) {

            return res
                .status(503)
                .json({

                    error:
                        "Baza trenutno nije dostupna."

                });

        }

        const id =
            Number(
                req.params.id
            );

        if (
            !Number.isInteger(
                id
            ) ||
            id < 1
        ) {

            return res
                .status(400)
                .json({

                    error:
                        "Neispravan ID rezervacije."

                });

        }

        try {

            const result =
                await pool.query(
                    `
                    DELETE FROM reservations

                    WHERE id = $1

                    RETURNING id
                    `,
                    [
                        id
                    ]
                );

            if (
                result.rowCount === 0
            ) {

                return res
                    .status(404)
                    .json({

                        error:
                            "Rezervacija nije pronađena."

                    });

            }

            return res.json({

                success:
                    true

            });

        } catch (error) {

            console.error(
                "Greška pri brisanju rezervacije:",
                error
            );

            return res
                .status(500)
                .json({

                    error:
                        "Rezervaciju trenutno nije moguće obrisati."

                });

        }

    }
);


// =========================================================
// API 404
// =========================================================

app.use(
    "/api",
    (
        req,
        res
    ) => {

        return res
            .status(404)
            .json({

                error:
                    "API ruta nije pronađena."

            });

    }
);


// =========================================================
// FRONTEND FALLBACK
// =========================================================

app.get(
    "*",
    (
        req,
        res
    ) => {

        res.sendFile(
            path.join(
                __dirname,
                "public",
                "index.html"
            )
        );

    }
);


// =========================================================
// START SERVER
// =========================================================

async function startServer() {

    await initializeDatabase();

    app.listen(
        PORT,
        () => {

            console.log(
                `NightBook radi na portu ${PORT}`
            );

            console.log(
                "NightBook premium verzija je pokrenuta."
            );

        }
    );

}


startServer();
