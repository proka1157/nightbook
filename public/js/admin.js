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
// FORMAT DATUMA
// ========================================

function formatDate(dateString) {

    if (!dateString) {
        return "-";
    }

    const parts =
        String(dateString).split("-");

    if (parts.length !== 3) {
        return dateString;
    }

    return `${parts[2]}.${parts[1]}.${parts[0]}.`;

}


// ========================================
// FORMAT VREMENA
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
// KLUBOVI
// ========================================

function clubName(club) {

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

    return clubs[club] || club || "-";

}


// ========================================
// STATUS
// ========================================

function statusName(status) {

    const statuses = {

        nova:
            "NOVA",

        potvrdjena:
            "POTVRĐENA",

        odbijena:
            "ODBIJENA"

    };

    return statuses[status] ||
        String(status || "nova")
            .toUpperCase();

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
// TELEFON
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
// INSTAGRAM
// ========================================

function instagramLink(instagram) {

    if (!instagram) {
        return "-";
    }

    let username =
        String(instagram)
            .trim()
            .replace(/^@/, "");


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
// PORUKA
// ========================================

function showMessage(message) {

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
                reservation.status === "nova"
        ).length;


    confirmedCount.textContent =
        allReservations.filter(
            reservation =>
                reservation.status ===
                "potvrdjena"
        ).length;

}


// ========================================
// FILTERI
// ========================================

function applyFilters() {

    const selectedClub =
        clubFilter.value;

    const selectedStatus =
        statusFilter.value;

    const selectedDate =
        dateFilter.value;


    const filtered =
        allReservations.filter(
            reservation => {

                const clubMatches =
                    !selectedClub ||
                    reservation.club ===
                    selectedClub;


                const statusMatches =
                    !selectedStatus ||
                    reservation.status ===
                    selectedStatus;


                const dateMatches =
                    !selectedDate ||
                    reservation.date ===
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
// UČITAVANJE
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
                "/api/reservations",
                {
                    cache:
                        "no-store"
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

        console.error(error);


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
// PRIKAZ
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
                        reservation.status ||
                        "nova";


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

        console.error(error);

        showMessage(
            "Nije moguće promeniti status."
        );

    }

}


// ========================================
// BRISANJE
// ========================================

async function deleteReservation(
    id
) {

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

        console.error(error);

        showMessage(
            "Nije moguće obrisati rezervaciju."
        );

    }

}


// ========================================
// ACTION BUTTONS
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


        button.disabled = true;


        if (action === "confirm") {

            await changeStatus(
                id,
                "potvrdjena"
            );

            return;

        }


        if (action === "reject") {

            await changeStatus(
                id,
                "odbijena"
            );

            return;

        }


        if (action === "delete") {

            button.disabled = false;

            await deleteReservation(
                id
            );

        }

    }
);


// ========================================
// FILTER EVENTS
// ========================================

clubFilter.addEventListener(
    "change",
    applyFilters
);


statusFilter.addEventListener(
    "change",
    applyFilters
);


dateFilter.addEventListener(
    "change",
    applyFilters
);


// ========================================
// REFRESH
// ========================================

refreshButton.addEventListener(
    "click",
    loadReservations
);


// ========================================
// START
// ========================================

loadReservations();
