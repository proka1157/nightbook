const reservationsList =
    document.getElementById("reservationsList");

const reservationCount =
    document.getElementById("reservationCount");

const newCount =
    document.getElementById("newCount");

const confirmedCount =
    document.getElementById("confirmedCount");

const refreshButton =
    document.getElementById("refreshReservations");

const clubFilter =
    document.getElementById("clubFilter");

const statusFilter =
    document.getElementById("statusFilter");

const dateFilter =
    document.getElementById("dateFilter");

const adminMessage =
    document.getElementById("adminMessage");


let allReservations = [];


// ========================================
// NORMALIZACIJA KLUBA
// ========================================

function normalizeClub(value) {

    const club =
        String(value || "")
            .trim()
            .toLowerCase();

    const aliases = {

        "lasta": "lasta",
        "splav lasta": "lasta",

        "freestyler": "freestyler",
        "free styler": "freestyler",
        "klub freestyler": "freestyler",

        "remiks": "remiks",
        "remix": "remiks",

        "tranzit": "tranzit",
        "tranzit bar": "tranzit",

        "bank": "bank",
        "the bank": "bank",
        "thebank": "bank",
        "klub bank": "bank",

        "leto": "leto",
        "splav leto": "leto",

        "gradska": "gradska",
        "gradska kafana": "gradska",
        "kafana gradska": "gradska"

    };

    return aliases[club] || club;
}


// ========================================
// NORMALIZACIJA STATUSA
// ========================================

function normalizeStatus(value) {

    return String(value || "nova")
        .trim()
        .toLowerCase()
        .replace("potvrđena", "potvrdjena");
}


// ========================================
// NORMALIZACIJA DATUMA
// ========================================

function normalizeDate(value) {

    if (!value) {
        return "";
    }

    const stringValue =
        String(value).trim();

    // PostgreSQL / standardni YYYY-MM-DD
    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            stringValue
        )
    ) {
        return stringValue;
    }

    // Ako server nekada vrati ISO datum
    // npr. 2026-09-19T00:00:00.000Z
    const isoMatch =
        stringValue.match(
            /^(\d{4}-\d{2}-\d{2})/
        );

    if (isoMatch) {
        return isoMatch[1];
    }

    return stringValue;
}


// ========================================
// FORMAT DATUMA
// ========================================

function formatDate(dateString) {

    const normalized =
        normalizeDate(dateString);

    if (!normalized) {
        return "-";
    }

    const parts =
        normalized.split("-");

    if (parts.length !== 3) {
        return normalized;
    }

    return `${parts[2]}.${parts[1]}.${parts[0]}.`;
}


// ========================================
// FORMAT VREMENA REZERVACIJE
// ========================================

function formatCreatedAt(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "-";
    }

    return date.toLocaleString(
        "sr-RS",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


// ========================================
// NAZIV KLUBA
// ========================================

function clubName(club) {

    const normalizedClub =
        normalizeClub(club);

    const clubs = {

        lasta:
            "Lasta",

        freestyler:
            "Freestyler",

        remiks:
            "Remiks",

        tranzit:
            "Tranzit",

        bank:
            "The Bank",

        leto:
            "Leto",

        gradska:
            "Gradska Kafana"

    };

    return (
        clubs[normalizedClub] ||
        club ||
        "-"
    );
}


// ========================================
// NAZIV STATUSA
// ========================================

function statusName(status) {

    const normalizedStatus =
        normalizeStatus(status);

    const statuses = {

        nova:
            "NOVA",

        potvrdjena:
            "POTVRĐENA",

        odbijena:
            "ODBIJENA"

    };

    return (
        statuses[normalizedStatus] ||
        normalizedStatus.toUpperCase()
    );
}


// ========================================
// HTML ZAŠTITA
// ========================================

function escapeHTML(value) {

    return String(value ?? "")

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


// ========================================
// TELEFON LINK
// ========================================

function phoneLink(phone) {

    if (!phone) {
        return "-";
    }

    const safePhone =
        escapeHTML(phone);

    const tel =
        String(phone)
            .replace(
                /[^\d+]/g,
                ""
            );

    return `
        <a
            class="info-link"
            href="tel:${escapeHTML(tel)}"
        >
            ${safePhone}
        </a>
    `;
}

// ========================================
// WHATSAPP LINK
// ========================================

function whatsappLink(reservation) {

    if (!reservation.phone) {
        return "";
    }

    let phone =
        String(reservation.phone)
            .replace(/\D/g, "");


    // 06x... -> 3816x...
    if (phone.startsWith("0")) {

        phone =
            "381" + phone.substring(1);

    }


    // Ako je neko uneo samo 6x...
    if (
        !phone.startsWith("381") &&
        phone.startsWith("6")
    ) {

        phone =
            "381" + phone;

    }


    const name =
        reservation.name || "";


    const club =
        clubName(
            reservation.club
        );


    const date =
        formatDate(
            reservation.date
        );


    const message =
        `Zdravo ${name}! 👋

Javljamo se povodom vaše NightBook rezervacije.

📍 ${club}
📅 ${date}

Vaša rezervacija je potvrđena. ✅

Vidimo se! 🥂`;


    return (
        "https://wa.me/" +
        phone +
        "?text=" +
        encodeURIComponent(message)
    );
}

// ========================================
// INSTAGRAM LINK
// ========================================

function instagramLink(instagram) {

    if (!instagram) {
        return "-";
    }

    let username =
        String(instagram)
            .trim()
            .replace(/^@/, "");


    // Ako je neko uneo ceo Instagram URL
    username =
        username
            .replace(
                /^https?:\/\/(www\.)?instagram\.com\//i,
                ""
            )
            .replace(
                /\/.*$/,
                ""
            );


    if (!username) {
        return "-";
    }


    const safeUsername =
        escapeHTML(username);

    const encodedUsername =
        encodeURIComponent(username);


    return `
        <a
            class="info-link"
            href="https://www.instagram.com/${encodedUsername}/"
            target="_blank"
            rel="noopener noreferrer"
        >
            @${safeUsername}
        </a>
    `;
}


// ========================================
// ADMIN PORUKA
// ========================================

function showMessage(message) {

    if (!adminMessage) {
        return;
    }

    adminMessage.textContent =
        message;

    adminMessage.classList.add(
        "show"
    );


    clearTimeout(
        showMessage.timeout
    );


    showMessage.timeout =
        setTimeout(
            () => {

                adminMessage.classList.remove(
                    "show"
                );

            },
            3000
        );
}


// ========================================
// STATISTIKA
// ========================================

function updateStats() {

    reservationCount.textContent =
        allReservations.length;


    newCount.textContent =
        allReservations.filter(
            reservation =>
                normalizeStatus(
                    reservation.status
                ) === "nova"
        ).length;


    confirmedCount.textContent =
        allReservations.filter(
            reservation =>
                normalizeStatus(
                    reservation.status
                ) === "potvrdjena"
        ).length;
}


// ========================================
// FILTERI
// ========================================

function applyFilters() {

    const selectedClub =
        normalizeClub(
            clubFilter.value
        );

    const selectedStatus =
        statusFilter.value
            ? normalizeStatus(
                statusFilter.value
            )
            : "";

    const selectedDate =
        normalizeDate(
            dateFilter.value
        );


    const filtered =
        allReservations.filter(
            reservation => {

                const reservationClub =
                    normalizeClub(
                        reservation.club
                    );


                const reservationStatus =
                    normalizeStatus(
                        reservation.status
                    );


                const reservationDate =
                    normalizeDate(
                        reservation.date
                    );


                const clubMatches =
                    !selectedClub ||
                    reservationClub ===
                        selectedClub;


                const statusMatches =
                    !selectedStatus ||
                    reservationStatus ===
                        selectedStatus;


                const dateMatches =
                    !selectedDate ||
                    reservationDate ===
                        selectedDate;


                return (
                    clubMatches &&
                    statusMatches &&
                    dateMatches
                );

            }
        );


    renderReservations(
        filtered
    );
}


// ========================================
// UČITAJ REZERVACIJE
// ========================================

async function loadReservations() {

    reservationsList.innerHTML = `
        <div class="empty">
            Učitavanje rezervacija...
        </div>
    `;


    refreshButton.disabled = true;

    refreshButton.textContent =
        "UČITAVANJE...";


    try {

        const response =
            await fetch(
                `/api/reservations?t=${Date.now()}`,
                {
                    method:
                        "GET",

                    cache:
                        "no-store",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "Nije moguće učitati rezervacije."
            );

        }


        const reservations =
            await response.json();


        if (
            !Array.isArray(
                reservations
            )
        ) {

            throw new Error(
                "Neispravan odgovor servera."
            );

        }


        allReservations =
            reservations;


        updateStats();

        applyFilters();


    } catch (error) {

        console.error(
            "Greška:",
            error
        );


        allReservations = [];

        updateStats();


        reservationsList.innerHTML = `
            <div class="empty">
                Greška pri učitavanju rezervacija.
                <br><br>
                Pokušaj ponovo.
            </div>
        `;


    } finally {

        refreshButton.disabled = false;

        refreshButton.textContent =
            "OSVEŽI REZERVACIJE";

    }
}


// ========================================
// PRIKAŽI REZERVACIJE
// ========================================

function renderReservations(
    reservations
) {

    if (!reservations.length) {

        reservationsList.innerHTML = `
            <div class="empty">
                Nema rezervacija za izabrane filtere.
            </div>
        `;

        return;
    }


    reservationsList.innerHTML =
        reservations

            .map(
                reservation => {

                    const status =
                        normalizeStatus(
                            reservation.status
                        );


                    const id =
                        escapeHTML(
                            reservation.id
                        );


                    return `

                        <article
                            class="
                                reservation-card
                                status-${escapeHTML(status)}
                            "
                        >


                            <div class="reservation-top">


                                <div>

                                    <div class="reservation-id">

                                        REZERVACIJA #${id}

                                    </div>


                                    <div class="reservation-club">

                                        ${escapeHTML(
                                            clubName(
                                                reservation.club
                                            )
                                        )}

                                    </div>


                                    <div class="reservation-date">

                                        ${escapeHTML(
                                            formatDate(
                                                reservation.date
                                            )
                                        )}

                                    </div>

                                </div>


                                <div
                                    class="
                                        status
                                        ${escapeHTML(status)}
                                    "
                                >

                                    ${escapeHTML(
                                        statusName(
                                            status
                                        )
                                    )}

                                </div>


                            </div>


                            <div class="reservation-grid">


                                <div class="info-box">

                                    <span>
                                        IME I PREZIME
                                    </span>

                                    <strong>

                                        ${escapeHTML(
                                            reservation.name
                                        )}

                                    </strong>

                                </div>


                                <div class="info-box">

                                    <span>
                                        TELEFON
                                    </span>

                                    <strong>

                                        ${phoneLink(
                                            reservation.phone
                                        )}

                                    </strong>

                                </div>


                                <div class="info-box">

                                    <span>
                                        INSTAGRAM
                                    </span>

                                    <strong>

                                        ${instagramLink(
                                            reservation.instagram
                                        )}

                                    </strong>

                                </div>


                                <div class="info-box">

                                    <span>
                                        BROJ OSOBA
                                    </span>

                                    <strong>

                                        ${escapeHTML(
                                            reservation.guests
                                        )}

                                    </strong>

                                </div>


                                <div class="info-box">

                                    <span>
                                        TIP STOLA
                                    </span>

                                    <strong>

                                        ${escapeHTML(
                                            reservation.tableType ||
                                            "-"
                                        )}

                                    </strong>

                                </div>


                                <div class="info-box">

                                    <span>
                                        PRIMLJENO
                                    </span>

                                    <strong>

                                        ${escapeHTML(
                                            formatCreatedAt(
                                                reservation.createdAt
                                            )
                                        )}

                                    </strong>

                                </div>


                            </div>


                            <div class="condition-box">

                                <span>
                                    USLOV REZERVACIJE
                                </span>

                                <strong>

                                    ${escapeHTML(
                                        reservation.condition ||
                                        "Bez uslova"
                                    )}

                                </strong>

                            </div>


                            <div class="reservation-actions">


                                <button
                                    type="button"

                                    class="
                                        action-button
                                        confirm
                                    "

                                    data-action="confirm"

                                    data-id="${id}"

                                    ${
                                        status ===
                                        "potvrdjena"

                                        ? "disabled"

                                        : ""
                                    }
                                >

                                    POTVRDI

                                </button>


                                <button
                                    type="button"

                                    class="
                                        action-button
                                        reject
                                    "

                                    data-action="reject"

                                    data-id="${id}"

                                    ${
                                        status ===
                                        "odbijena"

                                        ? "disabled"

                                        : ""
                                    }
                                >

                                    ODBIJ

                                </button>


                                <button
                                    type="button"

                                    class="
                                        action-button
                                        delete
                                    "

                                    data-action="delete"

                                    data-id="${id}"
                                >

                                    OBRIŠI

                                </button>


                            </div>


                        </article>

                    `;

                }
            )

            .join("");
}


// ========================================
// PROMENA STATUSA
// ========================================

async function changeStatus(
    id,
    status
) {

    try {

        const response =
            await fetch(
                `/api/reservations/${encodeURIComponent(id)}/status`,
                {

                    method:
                        "PATCH",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({
                            status
                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Greška pri promeni statusa."
            );

        }


        showMessage(
            status === "potvrdjena"
                ? "Rezervacija je potvrđena."
                : "Rezervacija je odbijena."
        );


        await loadReservations();


    } catch (error) {

        console.error(
            "Greška:",
            error
        );


        showMessage(
            "Nije moguće promeniti status."
        );

    }
}


// ========================================
// BRISANJE REZERVACIJE
// ========================================

async function deleteReservation(id) {

    const confirmed =
        window.confirm(
            "Da li sigurno želiš da obrišeš ovu rezervaciju?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/reservations/${encodeURIComponent(id)}`,
                {
                    method:
                        "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Greška pri brisanju."
            );

        }


        showMessage(
            "Rezervacija je obrisana."
        );


        await loadReservations();


    } catch (error) {

        console.error(
            "Greška:",
            error
        );


        showMessage(
            "Nije moguće obrisati rezervaciju."
        );

    }
}


// ========================================
// DUGMAD NA REZERVACIJAMA
// ========================================

reservationsList.addEventListener(
    "click",
    async event => {

        const button =
            event.target.closest(
                "[data-action]"
            );


        if (!button) {
            return;
        }


        const id =
            button.dataset.id;

        const action =
            button.dataset.action;


        if (!id) {
            return;
        }


        if (action === "confirm") {

            button.disabled = true;


            await changeStatus(
                id,
                "potvrdjena"
            );


            return;
        }


        if (action === "reject") {

            button.disabled = true;


            await changeStatus(
                id,
                "odbijena"
            );


            return;
        }


        if (action === "delete") {

            await deleteReservation(
                id
            );

        }

    }
);


// ========================================
// FILTER - KLUB
// ========================================

clubFilter.addEventListener(
    "change",
    () => {

        applyFilters();

    }
);


// ========================================
// FILTER - STATUS
// ========================================

statusFilter.addEventListener(
    "change",
    () => {

        applyFilters();

    }
);


// ========================================
// FILTER - DATUM
// ========================================

dateFilter.addEventListener(
    "change",
    () => {

        applyFilters();

    }
);


// ========================================
// OSVEŽI
// ========================================

refreshButton.addEventListener(
    "click",
    () => {

        loadReservations();

    }
);


// ========================================
// START
// ========================================

loadReservations();
