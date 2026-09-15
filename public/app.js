const dateInput = document.getElementById("eventDate");
const clubButtons = document.querySelectorAll(".club-card");

const programResult = document.getElementById("programResult");
const programClub = document.getElementById("programClub");
const programDate = document.getElementById("programDate");
const programContent = document.getElementById("programContent");

const reservationSection = document.getElementById("reservationSection");
const reservationForm = document.getElementById("reservationForm");
const reservationMessage = document.getElementById("reservationMessage");

const selectedClubInput = document.getElementById("selectedClub");
const selectedDateInput = document.getElementById("selectedDate");

// Ne dozvoli biranje prošlih datuma
const today = new Date();
const localToday = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
)
    .toISOString()
    .split("T")[0];

dateInput.min = localToday;


// ========================================
// KLIK NA KLUB
// ========================================

clubButtons.forEach((button) => {

    button.addEventListener("click", async () => {

        const date = dateInput.value;
        const club = button.dataset.club;

        if (!date) {
            alert("Prvo izaberi datum.");
            dateInput.focus();
            return;
        }

        // Označi izabrani klub
        clubButtons.forEach((btn) => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        // Prikaži rezultat
        programResult.classList.remove("hidden");

        reservationSection.classList.add("hidden");

        programClub.textContent =
            button.querySelector("strong").textContent;

        programDate.textContent =
            formatDate(date);

        programContent.innerHTML = `
            <div class="program-loading">
                Učitavamo program...
            </div>
        `;

        programResult.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        try {

            const response = await fetch(
                `/api/program?club=${encodeURIComponent(club)}&date=${encodeURIComponent(date)}`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Greška pri učitavanju programa."
                );
            }

            // PROGRAM NIJE OBJAVLJEN
            if (!data.found) {

                programContent.innerHTML = `
                    <div class="program-empty">

                        <h3>
                            PROGRAM JOŠ NIJE OBJAVLJEN
                        </h3>

                        <p>
                            ${escapeHTML(data.message)}
                        </p>

                        <small>
                            Proveri ponovo kasnije.
                        </small>

                    </div>
                `;

                return;
            }

            // PROGRAM PRONAĐEN
            programContent.innerHTML = `
                <div class="program-found">

                    <span class="status-badge">
                        PROGRAM PRONAĐEN
                    </span>

                    <h3>
                        ${escapeHTML(data.club)}
                    </h3>

                    <p>
                        Program za ${formatDate(data.date)}
                        je dostupan.
                    </p>

                    ${
                        data.title
                            ? `
                            <h4 class="event-title">
                                ${escapeHTML(data.title)}
                            </h4>
                            `
                            : ""
                    }

                    ${
                        data.details
                            ? `
                            <p class="event-details">
                                ${escapeHTML(data.details)}
                            </p>
                            `
                            : ""
                    }

                    <button
                        type="button"
                        class="reserve-now-button"
                        id="reserveNow"
                    >
                        REZERVIŠI STO
                    </button>

                </div>
            `;

            selectedClubInput.value = club;
            selectedDateInput.value = date;

            const reserveButton =
                document.getElementById("reserveNow");

            reserveButton.addEventListener(
                "click",
                () => {

                    reservationSection.classList.remove(
                        "hidden"
                    );

                    reservationSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }
            );

        } catch (error) {

            console.error(error);

            programContent.innerHTML = `
                <div class="program-error">

                    <h3>
                        PROGRAM TRENUTNO NIJE DOSTUPAN
                    </h3>

                    <p>
                        Pokušaj ponovo za nekoliko trenutaka.
                    </p>

                </div>
            `;
        }

    });

});


// ========================================
// PROMENA DATUMA
// ========================================

dateInput.addEventListener("change", () => {

    programResult.classList.add("hidden");
    reservationSection.classList.add("hidden");

    clubButtons.forEach((button) => {
        button.classList.remove("active");
    });

});


// ========================================
// SLANJE REZERVACIJE
// ========================================

reservationForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        reservationMessage.textContent =
            "Šaljemo rezervaciju...";

        const reservation = {

            club:
                selectedClubInput.value,

            date:
                selectedDateInput.value,

            name:
                document
                    .getElementById("name")
                    .value
                    .trim(),

            phone:
                document
                    .getElementById("phone")
                    .value
                    .trim(),

            instagram:
                document
                    .getElementById("instagram")
                    .value
                    .trim(),

            guests:
                Number(
                    document
                        .getElementById("guests")
                        .value
                )
        };

        try {

            const response = await fetch(
                "/api/reservations",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(reservation)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Rezervacija nije poslata."
                );
            }

            reservationMessage.textContent =
                "✓ Rezervacija je uspešno poslata!";

            reservationForm.reset();

            // Sačuvaj izabrani klub i datum
            selectedClubInput.value =
                reservation.club;

            selectedDateInput.value =
                reservation.date;

        } catch (error) {

            console.error(error);

            reservationMessage.textContent =
                error.message;
        }

    }
);


// ========================================
// POMOĆNE FUNKCIJE
// ========================================

function formatDate(dateString) {

    const [year, month, day] =
        dateString.split("-");

    return `${day}.${month}.${year}.`;
}


function escapeHTML(value) {

    if (!value) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}