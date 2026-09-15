const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

const reservationsFile = path.join(
    __dirname,
    "data",
    "reservations.json"
);


// ========================================
// KLUBOVI
// ========================================

const CLUBS = {

    lasta: {
        name: "Lasta",
        url: "https://www.beogradnocu.com/splavovi-u-beogradu/splav-lasta/"
    },

    freestyler: {
        name: "Freestyler",
        url: "https://www.beogradnocu.com/klubovi-u-beogradu/klub-freestyler/"
    },

    remiks: {
        name: "Remiks",
        url: "https://www.beogradnocu.com/klubovi-u-beogradu/remiks/"
    },

    tranzit: {
        name: "Tranzit",
        url: "https://www.beogradnocu.com/klubovi-u-beogradu/tranzit-bar/"
    }

};


// ========================================
// MESECI
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


// ========================================
// POMOĆNE FUNKCIJE
// ========================================

function normalizeText(text) {

    return String(text || "")

        .replace(/&nbsp;/gi, " ")

        .replace(/&amp;/gi, "&")

        .replace(/&quot;/gi, '"')

        .replace(/&#039;/gi, "'")

        .replace(/&#8217;/gi, "'")

        .replace(/&#8211;/gi, "–")

        .replace(/&#8212;/gi, "—")

        .replace(/<br\s*\/?>/gi, " ")

        .replace(/<\/p>/gi, " ")

        .replace(/<\/div>/gi, " ")

        .replace(/<[^>]*>/g, " ")

        .replace(/\s+/g, " ")

        .trim();
}


function getDateParts(dateString) {

    const parts = dateString
        .split("-")
        .map(Number);

    const year = parts[0];
    const month = parts[1];
    const day = parts[2];

    if (
        !year ||
        !month ||
        !day ||
        month < 1 ||
        month > 12
    ) {
        return null;
    }

    return {
        year,
        month,
        day,
        monthName: MONTHS[month - 1]
    };
}


// ========================================
// PARSER PROGRAMA
// ========================================

function parseClubPage(html, dateString) {

    const dateParts = getDateParts(dateString);

    if (!dateParts) {
        return null;
    }

    const {
        day,
        monthName
    } = dateParts;


    /*
        Na Beograd Noću stranici program je
        organizovan po datumima.

        Primer:

        PETAK 18. Septembar

        DJ's ...
        od 23h
        ulaz 500 rsd
    */


    const headingRegex =
        /<h4[^>]*>([\s\S]*?)<\/h4>/gi;


    const headings = [];

    let match;


    while (
        (match = headingRegex.exec(html)) !== null
    ) {

        headings.push({

            text:
                normalizeText(match[1]),

            start:
                match.index,

            end:
                headingRegex.lastIndex

        });

    }


    const wantedDay =
        String(day);

    const wantedMonth =
        monthName.toLowerCase();


    for (
        let i = 0;
        i < headings.length;
        i++
    ) {

        const heading =
            headings[i];

        const headingText =
            heading.text.toLowerCase();


        const dateRegex =
            new RegExp(
                `\\b${wantedDay}\\.\\s*${wantedMonth}\\b`,
                "i"
            );


        if (!dateRegex.test(headingText)) {
            continue;
        }


        const contentStart =
            heading.end;


        const contentEnd =
            headings[i + 1]
                ? headings[i + 1].start
                : html.length;


        let section =
            html.slice(
                contentStart,
                contentEnd
            );


        /*
            Ako nakon programa počinje
            drugi veliki deo stranice,
            prekidamo čitanje.
        */

        const stopMarkers = [
            "<h2",
            "<h3",
            "<footer"
        ];


        for (
            const marker of stopMarkers
        ) {

            const markerIndex =
                section
                    .toLowerCase()
                    .indexOf(
                        marker.toLowerCase()
                    );


            if (markerIndex !== -1) {

                section =
                    section.slice(
                        0,
                        markerIndex
                    );

            }

        }


        let program =
            normalizeText(section);


        /*
            Uklanjamo tekstove koji nam
            ne trebaju u NightBook programu.
        */

        program =
            program

                .replace(
                    /rezerviši online/gi,
                    ""
                )

                .replace(
                    /rezervisi online/gi,
                    ""
                )

                .replace(
                    /rezerviši/gi,
                    ""
                )

                .replace(
                    /rezervisi/gi,
                    ""
                )

                .replace(
                    /\s+/g,
                    " "
                )

                .trim();


        if (!program) {
            return null;
        }


        /*
            Zaštita da slučajno ne povučemo
            ogroman deo cele stranice.
        */

        if (program.length > 500) {

            program =
                program.slice(
                    0,
                    500
                );

        }


        return program;

    }


    return null;
}


// ========================================
// API - PROGRAM KLUBA
// ========================================

app.get(
    "/api/program",
    async (req, res) => {

        try {

            const clubKey =
                String(
                    req.query.club || ""
                )
                    .toLowerCase()
                    .trim();


            const date =
                String(
                    req.query.date || ""
                )
                    .trim();


            if (!clubKey || !date) {

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


            if (!getDateParts(date)) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Datum nije ispravan."

                    });

            }


            // =================================
            // PREUZIMANJE BEOGRAD NOĆU STRANICE
            // =================================


            const response =
                await fetch(
                    club.url,
                    {

                        headers: {

                            "User-Agent":
                                "Mozilla/5.0 (compatible; NightBook/1.0)",

                            "Accept":
                                "text/html,application/xhtml+xml"

                        }

                    }
                );


            if (!response.ok) {

                throw new Error(
                    `Beograd Noću HTTP ${response.status}`
                );

            }


            const html =
                await response.text();


            // =================================
            // SVA 4 KLUBA KORISTE ISTI PARSER
            // =================================


            const program =
                parseClubPage(
                    html,
                    date
                );


            // =================================
            // PROGRAM NIJE OBJAVLJEN
            // =================================


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


            // =================================
            // PROGRAM JE PRONAĐEN
            // =================================


            return res.json({

                found: true,

                club:
                    club.name,

                date,

                title:
                    program,

                source:
                    "Beograd Noću"

            });


        } catch (error) {

            console.error(
                "Greška pri učitavanju programa:",
                error
            );


            return res
                .status(500)
                .json({

                    error:
                        "Trenutno nije moguće učitati program."

                });

        }

    }
);


// ========================================
// GET REZERVACIJE
// ========================================

app.get(
    "/api/reservations",
    (req, res) => {

        try {

            if (
                !fs.existsSync(
                    reservationsFile
                )
            ) {

                return res.json([]);

            }


            const reservations =
                JSON.parse(

                    fs.readFileSync(
                        reservationsFile,
                        "utf8"
                    )

                );


            return res.json(
                reservations
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
                        "Greška pri učitavanju rezervacija."

                });

        }

    }
);


// ========================================
// NOVA REZERVACIJA
// ========================================

app.post(
    "/api/reservations",
    (req, res) => {

        try {

            const {
                club,
                date,
                name,
                phone,
                instagram,
                guests
            } = req.body;


            if (
                !club ||
                !date ||
                !name ||
                !phone ||
                !guests
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Popuni sva obavezna polja."

                    });

            }


            if (!CLUBS[club]) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Izabrani klub nije ispravan."

                    });

            }


            const guestNumber =
                Number(guests);


            if (
                !Number.isInteger(
                    guestNumber
                ) ||
                guestNumber < 1 ||
                guestNumber > 30
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Broj osoba mora biti između 1 i 30."

                    });

            }


            let reservations = [];


            if (
                fs.existsSync(
                    reservationsFile
                )
            ) {

                reservations =
                    JSON.parse(

                        fs.readFileSync(
                            reservationsFile,
                            "utf8"
                        )

                    );

            }


            const reservation = {

                id:
                    Date.now(),

                club,

                clubName:
                    CLUBS[club].name,

                date,

                name:
                    String(name).trim(),

                phone:
                    String(phone).trim(),

                instagram:
                    String(
                        instagram || ""
                    ).trim(),

                guests:
                    guestNumber,

                status:
                    "pending",

                createdAt:
                    new Date()
                        .toISOString()

            };


            reservations.push(
                reservation
            );


            fs.writeFileSync(

                reservationsFile,

                JSON.stringify(
                    reservations,
                    null,
                    2
                )

            );


            return res
                .status(201)
                .json({

                    success:
                        true,

                    reservation

                });


        } catch (error) {

            console.error(
                "Greška pri rezervaciji:",
                error
            );


            return res
                .status(500)
                .json({

                    error:
                        "Rezervacija nije sačuvana."

                });

        }

    }
);


// ========================================
// ADMIN STRANICA
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
// POČETNA STRANICA
// ========================================

app.get(
    "/",
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
// POKRETANJE SERVERA
// ========================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `NightBook radi na portu ${PORT}`
        );

    }
);
