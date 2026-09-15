const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// ========================================
// REZERVACIJE
// ========================================

const dataDir = path.join(__dirname, "data");
const reservationsFile = path.join(dataDir, "reservations.json");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(reservationsFile)) {
    fs.writeFileSync(reservationsFile, "[]");
}

// ========================================
// KLUBOVI - BEOGRAD NOĆU
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
        name: "Tranzit Bar",
        url: "https://www.beogradnocu.com/klubovi-u-beogradu/tranzit-bar/"
    }
};

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
// HTML -> ČIST TEKST
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
        .replace(/&#(\d+);/g, (_, number) =>
            String.fromCharCode(Number(number))
        );
}

function htmlToText(html) {
    return decodeHTML(
        html
            .replace(/<script[\s\S]*?<\/script>/gi, " ")
            .replace(/<style[\s\S]*?<\/style>/gi, " ")
            .replace(
                /<\/?(h1|h2|h3|h4|h5|p|div|li|br|section|article|tr|td)[^>]*>/gi,
                "\n"
            )
            .replace(/<[^>]+>/g, " ")
    )
        .replace(/\r/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n\s*\n+/g, "\n")
        .trim();
}

// ========================================
// PRONALAŽENJE PROGRAMA
// ========================================

function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractProgram(html, selectedDate) {

    const date = new Date(selectedDate + "T12:00:00");

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    const dayNumber = date.getDate();
    const month = MONTHS[date.getMonth()];
    const dayName = DAYS[date.getDay()];

    const text = htmlToText(html);

    // Primer koji tražimo:
    // PETAK 18. Septembar

    const exactDateRegex = new RegExp(
        `${escapeRegex(dayName)}\\s+${dayNumber}\\.\\s*${escapeRegex(month)}`,
        "i"
    );

    const match = exactDateRegex.exec(text);

    if (!match) {
        return null;
    }

    let afterDate = text
        .slice(match.index + match[0].length)
        .trim();

    // Pronađi sledeći datum da ne uzmemo program drugog dana
    const nextDateRegex =
        /(?:PONEDELJAK|UTORAK|SREDA|ČETVRTAK|PETAK|SUBOTA|NEDELJA)\s+\d{1,2}\.\s*(?:Januar|Februar|Mart|April|Maj|Jun|Jul|Avgust|Septembar|Oktobar|Novembar|Decembar)/i;

    const nextDate = afterDate.search(nextDateRegex);

    if (nextDate !== -1) {
        afterDate = afterDate.slice(0, nextDate);
    }

    // Ukloni nepotrebne delove
    afterDate = afterDate
        .replace(/rezerviši online/gi, "\n")
        .replace(/rezervisi online/gi, "\n")
        .replace(/rezervacija/gi, "\n")
        .trim();

    const lines = afterDate
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean)
        .filter(line => line.length > 2);

    if (!lines.length) {
        return null;
    }

    // Prvih nekoliko relevantnih linija
    const usefulLines = lines.slice(0, 5);

    return usefulLines.join(" • ");
}

// ========================================
// API - PROGRAM KLUBA
// ========================================

app.get("/api/program", async (req, res) => {

    const { club: clubKey, date } = req.query;

    if (!clubKey || !date) {
        return res.status(400).json({
            error: "Klub i datum su obavezni."
        });
    }

    const club = CLUBS[clubKey];

    if (!club) {
        return res.status(404).json({
            error: "Klub nije pronađen."
        });
    }

    try {

        const response = await fetch(club.url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
                "Accept":
                    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language":
                    "sr-RS,sr;q=0.9,en-US;q=0.8,en;q=0.7"
            }
        });

        if (!response.ok) {
            throw new Error(
                `Beograd Nocu status: ${response.status}`
            );
        }

        const html = await response.text();

        const program = extractProgram(html, date);

        if (!program) {
            return res.json({
                found: false,
                club: club.name,
                date,
                message:
                    "Program za ovaj datum još nije objavljen."
            });
        }

        return res.json({
            found: true,
            club: club.name,
            date,
            program,
            source: "Beograd Noću",
            sourceUrl: club.url
        });

    } catch (error) {

        console.error(
            "Greška pri preuzimanju programa:",
            error
        );

        return res.status(502).json({
            error:
                "Trenutno nije moguće učitati program sa Beograd Noću."
        });
    }
});

// ========================================
// POST REZERVACIJA
// ========================================

app.post("/api/reservations", (req, res) => {

    try {

        const {
            club,
            date,
            name,
            phone,
            instagram,
            guests
        } = req.body;

        if (!club || !date || !name || !phone || !guests) {
            return res.status(400).json({
                error: "Popuni sva obavezna polja."
            });
        }

        let reservations = [];

        try {
            reservations = JSON.parse(
                fs.readFileSync(reservationsFile, "utf8")
            );
        } catch {
            reservations = [];
        }

        const reservation = {
            id: Date.now(),
            club,
            date,
            name,
            phone,
            instagram: instagram || "",
            guests: Number(guests),
            createdAt: new Date().toISOString()
        };

        reservations.push(reservation);

        fs.writeFileSync(
            reservationsFile,
            JSON.stringify(reservations, null, 2)
        );

        return res.status(201).json({
            success: true,
            message: "Rezervacija je uspešno poslata.",
            reservation
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Greška pri čuvanju rezervacije."
        });
    }
});

// ========================================
// GET REZERVACIJE - ADMIN
// ========================================

app.get("/api/reservations", (req, res) => {

    try {

        const reservations = JSON.parse(
            fs.readFileSync(reservationsFile, "utf8")
        );

        res.json(reservations);

    } catch {
        res.json([]);
    }
});

// ========================================
// ADMIN
// ========================================

app.get("/admin", (req, res) => {
    res.sendFile(
        path.join(__dirname, "../public/admin.html")
    );
});

// ========================================
// FRONTEND FALLBACK
// ========================================

app.use((req, res) => {
    res.sendFile(
        path.join(__dirname, "../public/index.html")
    );
});

// ========================================
// START
// ========================================

app.listen(PORT, "0.0.0.0", () => {
    console.log(`NightBook radi na portu ${PORT}`);
});
