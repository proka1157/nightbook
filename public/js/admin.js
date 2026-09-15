const reservationsList =
    document.getElementById("reservationsList");

const reservationCount =
    document.getElementById("reservationCount");

const refreshButton =
    document.getElementById("refreshReservations");


// ========================================
// FORMAT DATUMA
// ========================================

function formatDate(dateString) {
    if (!dateString) return "-";

    const parts = dateString.split("-");

    if (parts.length !== 3) {
        return dateString;
    }

    return `${parts[2]}.${parts[1]}.${parts[0]}.`;
}


// ========================================
// FORMAT VREMENA REZERVACIJE
// ========================================

function formatCreatedAt(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString("sr-RS", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


// ========================================
// NAZIV KLUBA
// ========================================

function clubName(club) {
    const clubs = {
        lasta: "Lasta",
        freestyler: "Freestyler",
        remiks: "Remiks",
        tranzit: "Tranzit"
    };

    return clubs[club] || club || "-";
}


// ========================================
// ZAŠTITA HTML-a
// ========================================

function escapeHTML(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ========================================
// TELEFON LINK
// ========================================

function phoneLink(phone) {
    if (!phone) return "-";

    const safePhone = escapeHTML(phone);

    const tel =
        String(phone)
            .replace(/[^\d+]/g, "");

    return `
        <a
            href="tel:${tel}"
            style="
                color:white;
                text-decoration:none;
            "
        >
            ${safePhone}
        </a>
    `;
}


// ========================================
// INSTAGRAM
// ========================================

function instagramText(instagram) {
    if (!instagram) {
        return "-";
    }

    let username =
        String(instagram).trim();

    username =
        username.replace(/^@/, "");

    return `@${escapeHTML(username)}`;
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

    try {
        const response =
            await fetch("/api/reservations", {
                cache: "no-store"
            });

        if (!response.ok) {
            throw new Error(
                "Nije moguće učitati rezervacije."
            );
        }

        const reservations =
            await response.json();

        reservationCount.textContent =
            reservations.length;

        if (!reservations.length) {
            reservationsList.innerHTML = `
                <div class="empty">
                    Trenutno nema rezervacija.
                </div>
            `;

            return;
        }

        renderReservations(reservations);

    } catch (error) {
        console.error(error);

        reservationCount.textContent = "0";

        reservationsList.innerHTML = `
            <div class="empty">
                Greška pri učitavanju rezervacija.
                <br><br>
                Pokušaj ponovo.
            </div>
        `;
    }
}


// ========================================
// PRIKAŽI REZERVACIJE
// ========================================

function renderReservations(reservations) {
    reservationsList.innerHTML =
        reservations.map(reservation => {

            const status =
                reservation.status || "nova";

            return `
                <div class="reservation-card">

                    <div class="reservation-top">

                        <div>
                            <div class="reservation-club">
                                ${escapeHTML(
                                    clubName(reservation.club)
                                )}
                            </div>

                            <div class="reservation-date">
                                ${formatDate(
                                    reservation.date
                                )}
                            </div>
                        </div>

                        <div class="status">
                            ${escapeHTML(
                                status.toUpperCase()
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
                                ${instagramText(
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
                                "Nije naveden"
                            )}
                        </strong>

                    </div>

                </div>
            `;

        }).join("");
}


// ========================================
// OSVEŽI
// ========================================

refreshButton.addEventListener(
    "click",
    loadReservations
);


// ========================================
// AUTOMATSKI UČITAJ
// ========================================

loadReservations();
