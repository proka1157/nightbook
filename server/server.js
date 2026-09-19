const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;


// ========================================
// MIDDLEWARE
// ========================================

app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "../public")
    )
);


// ========================================
// POSTGRESQL
// ========================================

if (!process.env.DATABASE_URL) {
    console.error(
        "DATABASE_URL nije podešen."
    );
}

const pool = new Pool({
    connectionString:
        process.env.DATABASE_URL
});


// ========================================
// KREIRANJE TABELE
// ========================================

async function initializeDatabase() {

    try {

        await pool.query(`
            CREATE TABLE IF NOT EXISTS reservations (

                id BIGSERIAL PRIMARY KEY,

                club VARCHAR(100) NOT NULL,

                date DATE NOT NULL,

                name VARCHAR(200) NOT NULL,

                phone VARCHAR(100) NOT NULL,

                instagram VARCHAR(200) DEFAULT '',

                guests INTEGER NOT NULL,

                table_type VARCHAR(200) NOT NULL,

                condition TEXT DEFAULT '',

                status VARCHAR(50) NOT NULL DEFAULT 'nova',

                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

            );
        `);


        await pool.query(`
            CREATE INDEX IF NOT EXISTS
            idx_reservations_date
            ON reservations(date);
        `);


        await pool.query(`
            CREATE INDEX IF NOT EXISTS
            idx_reservations_status
            ON reservations(status);
        `);


        console.log(
            "PostgreSQL baza je spremna."
        );


    } catch (error) {

        console.error(
            "Greška pri inicijalizaciji baze:",
            error
        );

    }

}


// ========================================
// KLUBOVI
// ========================================

const CLUBS = {

    lasta: {
        name: "Lasta",
        url:
            "https://www.beogradnocu.com/splavovi-u-beogradu/splav-lasta/"
    },

    freestyler: {
        name: "Freestyler",
        url:
            "https://www.beogradnocu.com/klubovi-u-beogradu/klub-freestyler/"
    },

    remiks: {
        name: "Remiks",
        url:
            "https://www.beogradnocu.com/klubovi-u-beogradu/remiks/"
    },

    tranzit: {
        name: "Tranzit Bar",
        url:
            "https://www.beogradnocu.com/klubovi-u-beogradu/tranzit-bar/"
    },

    bank: {
        name: "The Bank",
        url:
            "https://www.beogradnocu.com/klubovi-u-beogradu/klub-bank/"
    },

    leto: {
        name: "Leto",
        url:
            "https://www.beogradnocu.com/splavovi-u-beogradu/splav-leto/"
    },

    gradska: {
        name: "Gradska Kafana",
        url:
            "https://www.beogradnocu.com/kafane-u-beogradu/gradska-kafana/"
    }

};


// ========================================
// MESECI I DANI
// ========================================

const MONTHS = [
    "Januar",
    "Februar",
    "Mart",
    "April",
    "Maj",
    "Jun",
    "Jul",
    "Avgust",
    "Septembar",
    "Oktobar",
    "Novembar",
    "Decembar"
];


const DAYS = [
    "NEDELJA",
    "PONEDELJAK",
    "UTORAK",
    "SREDA",
    "ČETVRTAK",
    "PETAK",
    "SUBOTA"
];


// ========================================
// DEKODIRANJE HTML-a
// ========================================

function decodeHTML(text) {

    return text

        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#039;/gi, "'")
        .replace(/&apos;/gi, "'")
        .replace(/&scaron;/gi, "š")
        .replace(/&Scaron;/gi, "Š")
        .replace(/&ccaron;/gi, "č")
        .replace(/&Ccaron;/gi, "Č")
        .replace(/&cacute;/gi, "ć")
        .replace(/&Cacute;/gi, "Ć")
        .replace(/&zcaron;/gi, "ž")
        .replace(/&Zcaron;/gi, "Ž")
        .replace(/&dstrok;/gi, "đ")
        .replace(/&Dstrok;/gi, "Đ")

        .replace(
            /&#(\d+);/g,
            (_, number) =>
                String.fromCharCode(
                    Number(number)
                )
        );

}


// ========================================
// HTML -> ČIST TEKST
// ========================================

function htmlToText(html) {

    return decodeHTML(

        html

            .replace(
                /<script[\s\S]*?<\/script>/gi,
                " "
            )

            .replace(
                /<style[\s\S]*?<\/style>/gi,
                " "
            )

            .replace(
                /<\/?(h1|h2|h3|h4|h5|p|div|li|br|section|article|tr|td)[^>]*>/gi,
                "\n"
            )

            .replace(
                /<[^>]+>/g,
                " "
            )

    )

        .replace(/\r/g, "")

        .replace(
            /[ \t]+/g,
            " "
        )

        .replace(
            /\n\s*\n+/g,
            "\n"
        )

        .trim();

}


// ========================================
// REGEX ZA TEKST
// ========================================

function escapeRegex(text) {

    return text.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );

}


// ========================================
// PRONALAŽENJE PROGRAMA
// ========================================

function extractProgram(
    html,
    selectedDate
) {

    const date =
        new Date(
            selectedDate + "T12:00:00"
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return null;
    }


    const dayNumber =
        date.getDate();


    const month =
        MONTHS[
            date.getMonth()
        ];


    const dayName =
        DAYS[
            date.getDay()
        ];


    const text =
        htmlToText(html);


    const exactDateRegex =
        new RegExp(

            `${escapeRegex(dayName)}\\s+${dayNumber}\\.\\s*${escapeRegex(month)}`,

            "i"

        );


    const match =
        exactDateRegex.exec(text);


    if (!match) {
        return null;
    }


    let afterDate =
        text
            .slice(
                match.index +
                match[0].length
            )
            .trim();


    const nextDateRegex =
        /(?:PONEDELJAK|UTORAK|SREDA|ČETVRTAK|PETAK|SUBOTA|NEDELJA)\s+\d{1,2}\.\s*(?:Januar|Februar|Mart|April|Maj|Jun|Jul|Avgust|Septembar|Oktobar|Novembar|Decembar)/i;


    const nextDate =
        afterDate.search(
            nextDateRegex
        );


    if (nextDate !== -1) {

        afterDate =
            afterDate.slice(
                0,
                nextDate
            );

    }


    afterDate =
        afterDate

            .replace(
                /rezerviši online/gi,
                "\n"
            )

            .replace(
                /rezervisi online/gi,
                "\n"
            )

            .replace(
                /online rezervacije/gi,
                "\n"
            )

            .trim();


    const lines =
        afterDate

            .split("\n")

            .map(
                line =>
                    line.trim()
            )

            .filter(Boolean)

            .filter(
                line =>
                    line.length > 2
            );


    if (!lines.length) {
        return null;
    }


    const ignored = [

        "enterijer",

        "beograd noću",

        "beograd nocu",

        "rezervacije brzo i lako",

        "freestyler winter stage je",

        "klub freestyler predstavlja",

        "posetioce ovog",

        "mesto za izlazak",

        "noćnom životu beograda",

        "nocnom zivotu beograda",

        "rezervacije su obavezne",

        "putem korisničkog",

        "putem korisnickog",

        "program kluba",

        "program splava",

        "nema najavljenih dogadjaja",

        "nema najavljenih događaja"

    ];


    const programLine =
        lines.find(line => {

            const lower =
                line.toLowerCase();


            const shouldIgnore =
                ignored.some(
                    ignoredText =>
                        lower.includes(
                            ignoredText
                        )
                );


            return !shouldIgnore;

        });


    if (!programLine) {
        return null;
    }


    let cleanProgram =
        programLine

            .replace(
                /\s+/g,
                " "
            )

            .trim();


    cleanProgram =
        cleanProgram

            .split(
                /\s*[•|]\s*Enterijer/i
            )[0]

            .trim();


    cleanProgram =
        cleanProgram

            .split(
                /\s*[•|]\s*Beograd Noću/i
            )[0]

            .trim();


    cleanProgram =
        cleanProgram

            .split(
                /Freestyler Winter Stage je/i
            )[0]

            .trim();


    if (!cleanProgram) {
        return null;
    }


    return cleanProgram;

}


// ========================================
// API - PROGRAM KLUBA
// ========================================

app.get(
    "/api/program",
    async (req, res) => {

        const {
            club: clubKey,
            date
        } = req.query;


        if (
            !clubKey ||
            !date
        ) {

            return res
                .status(400)
                .json({

                    error:
                        "Klub i datum su obavezni."

                });

        }


        const club =
            CLUBS[clubKey];


        if (!club) {

            return res
                .status(404)
                .json({

                    error:
                        "Klub nije pronađen."

                });

        }


        try {

            const response =
                await fetch(
                    club.url,
                    {

                        headers: {

                            "User-Agent":
                                "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",

                            "Accept":
                                "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

                            "Accept-Language":
                                "sr-RS,sr;q=0.9,en-US;q=0.8,en;q=0.7"

                        }

                    }
                );


            if (!response.ok) {

                throw new Error(
                    `Izvor status: ${response.status}`
                );

            }


            const html =
                await response.text();


            const program =
                extractProgram(
                    html,
                    date
                );


            if (!program) {

                return res.json({

                    found: false,

                    club:
                        club.name,

                    date,

                    message:
                        "Program za ovaj datum još nije objavljen."

                });

            }


            return res.json({

                found: true,

                club:
                    club.name,

                date,

                program

            });


        } catch (error) {

            console.error(
                "Greška pri preuzimanju programa:",
                error
            );


            return res
                .status(502)
                .json({

                    error:
                        "Trenutno nije moguće učitati program."

                });

        }

    }
);


// ========================================
// POST - NOVA REZERVACIJA
// ========================================

app.post(
    "/api/reservations",
    async (req, res) => {

        try {

            const {

                club,
                date,
                name,
                phone,
                instagram,
                guests,
                tableType,
                condition

            } = req.body;


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


            const guestsNumber =
                Number(guests);


            if (
                !Number.isInteger(
                    guestsNumber
                ) ||
                guestsNumber < 1 ||
                guestsNumber > 30
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Broj osoba mora biti između 1 i 30."

                    });

            }


            const result =
                await pool.query(
                    `
                    INSERT INTO reservations
                    (
                        club,
                        date,
                        name,
                        phone,
                        instagram,
                        guests,
                        table_type,
                        condition,
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
                        'nova'
                    )

                    RETURNING
                        id,
                        club,
                        date::text AS date,
                        name,
                        phone,
                        instagram,
                        guests,
                        table_type AS "tableType",
                        condition,
                        status,
                        created_at AS "createdAt"
                    `,

                    [
                        club,
                        date,
                        name.trim(),
                        phone.trim(),
                        instagram
                            ? instagram.trim()
                            : "",
                        guestsNumber,
                        tableType,
                        condition || ""
                    ]
                );


            const reservation =
                result.rows[0];


            console.log(
                `Nova rezervacija #${reservation.id}`
            );


            return res
                .status(201)
                .json({

                    success: true,

                    message:
                        "Rezervacija je uspešno poslata.",

                    reservation

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
                        "Greška pri čuvanju rezervacije."

                });

        }

    }
);


// ========================================
// GET - SVE REZERVACIJE
// ========================================

app.get(
    "/api/reservations",
    async (req, res) => {

        try {

            const result =
                await pool.query(`
                    SELECT

                        id,

                        club,

                        date::text AS date,

                        name,

                        phone,

                        instagram,

                        guests,

                        table_type AS "tableType",

                        condition,

                        status,

                        created_at AS "createdAt"

                    FROM reservations

                    ORDER BY
                        created_at DESC;
                `);


            return res.json(
                result.rows
            );


        } catch (error) {

            console.error(
                "Greška pri učitavanju rezervacija:",
                error
            );


            return res
                .status(500)
                .json({

                    error:
                        "Greška pri učitavanju rezervacija."

                });

        }

    }
);


// ========================================
// PATCH - PROMENA STATUSA
// ========================================

app.patch(
    "/api/reservations/:id/status",
    async (req, res) => {

        try {

            const {
                id
            } = req.params;


            const {
                status
            } = req.body;


            const allowedStatuses = [
                "nova",
                "potvrdjena",
                "odbijena"
            ];


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


            const result =
                await pool.query(
                    `
                    UPDATE reservations

                    SET status = $1

                    WHERE id = $2

                    RETURNING
                        id,
                        club,
                        date::text AS date,
                        name,
                        phone,
                        instagram,
                        guests,
                        table_type AS "tableType",
                        condition,
                        status,
                        created_at AS "createdAt";
                    `,

                    [
                        status,
                        id
                    ]
                );


            if (
                result.rows.length === 0
            ) {

                return res
                    .status(404)
                    .json({

                        error:
                            "Rezervacija nije pronađena."

                    });

            }


            return res.json({

                success: true,

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
                        "Greška pri promeni statusa."

                });

        }

    }
);


// ========================================
// DELETE - BRISANJE REZERVACIJE
// ========================================

app.delete(
    "/api/reservations/:id",
    async (req, res) => {

        try {

            const {
                id
            } = req.params;


            const result =
                await pool.query(
                    `
                    DELETE FROM reservations
                    WHERE id = $1
                    RETURNING id;
                    `,

                    [
                        id
                    ]
                );


            if (
                result.rows.length === 0
            ) {

                return res
                    .status(404)
                    .json({

                        error:
                            "Rezervacija nije pronađena."

                    });

            }


            return res.json({

                success: true,

                message:
                    "Rezervacija je obrisana."

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
                        "Greška pri brisanju rezervacije."

                });

        }

    }
);


// ========================================
// ADMIN
// ========================================

app.get(
    "/admin",
    (req, res) => {

        res.sendFile(

            path.join(
                __dirname,
                "../public/admin.html"
            )

        );

    }
);


// ========================================
// FRONTEND FALLBACK
// ========================================

app.use(
    (req, res) => {

        res.sendFile(

            path.join(
                __dirname,
                "../public/index.html"
            )

        );

    }
);


// ========================================
// START SERVERA
// ========================================

async function startServer() {

    try {

        await initializeDatabase();


        app.listen(
            PORT,
            "0.0.0.0",
            () => {

                console.log(
                    `NightBook radi na portu ${PORT}`
                );

            }
        );


    } catch (error) {

        console.error(
            "NightBook nije mogao da se pokrene:",
            error
        );

        process.exit(1);

    }

}


startServer();
