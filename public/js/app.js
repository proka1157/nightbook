const eventDate = document.getElementById("eventDate");
const clubCards = document.querySelectorAll(".club-card");

const programResult = document.getElementById("programResult");
const programClub = document.getElementById("programClub");
const programDate = document.getElementById("programDate");
const programContent = document.getElementById("programContent");

const reservationSection = document.getElementById("reservationSection");
const reservationForm = document.getElementById("reservationForm");

const selectedClub = document.getElementById("selectedClub");
const selectedDate = document.getElementById("selectedDate");

const reservationMessage = document.getElementById("reservationMessage");


// ========================================
// USLOVI REZERVACIJE
// ========================================

const TABLES = {

    freestyler: [
        {
            name: "Barski sto",
            condition: "1 obična flaša"
        },
        {
            name: "Mali separe",
            condition: "1 premium flaša"
        },
        {
            name: "Veliki separe",
            condition: "2 premium flaše"
        },
        {
            name: "Centralni separe",
            condition: "3 premium flaše"
        }
    ],

    lasta: [
        {
            name: "Barski sto",
            condition: "1 obična flaša"
        },
        {
            name: "Visoko sedenje",
            condition: "1 premium flaša"
        },
        {
            name: "Separe",
            condition: "2 premium flaše"
        },
        {
            name: "Veliki separe",
            condition: "3 premium flaše"
        }
    ],

    remiks: [
        {
            name: "Barski sto",
            condition: "Bez uslova"
        },
        {
            name: "Visoko sedenje",
            condition: "1 obična flaša"
        },
        {
            name: "Separe",
            condition: "1 premium flaša"
        }
    ],

    tranzit: [
        {
            name: "Barski sto",
            condition: "50 €"
        },
        {
            name: "Visoko sedenje",
            condition: "100 € / 1 obična flaša"
        },
        {
            name: "Separe",
            condition: "1 premium flaša"
        }
    ]

};


// ========================================
// MINIMALNI DATUM = DANAS
// ========================================

const today = new Date();

const minDate =
    today.getFullYear() +
    "-" +
    String(today.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(today.getDate()).padStart(2, "0");

eventDate.min = minDate;


// ========================================
// FORMAT DATUMA
// ========================================

function formatDate(value) {

    const parts = value.split("-");

    if (parts.length !== 3) {
        return value;
    }

    return `${parts[2]}.${parts[1]}.${parts[0]}.`;
}


// ========================================
// BEZBEDAN TEKST
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
// KLIK NA KLUB
// ========================================

clubCards.forEach(card => {

    card.addEventListener("click", async () => {

        const date = eventDate.value;
        const club = card.dataset.club;

        if (!date) {

            alert("Prvo izaberi datum.");

            eventDate.focus();

            return;
        }


        // Aktivni klub

        clubCards.forEach(button => {
            button.classList.remove("active");
        });

        card.classList.add("active");


        // Prikaži program sekciju

        programResult.classList.remove("hidden");

        reservationSection.classList.add("hidden");


        programClub.textContent =
            card.querySelector("strong").textContent.trim();

        programDate.textContent =
            formatDate(date);

        programContent.innerHTML = `
            <p>
                Učitavanje programa sa Beograd Noću...
            </p>
        `;


        try {

            const response = await fetch(
                `/api/program?club=${encodeURIComponent(club)}&date=${encodeURIComponent(date)}`
            );

            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Greška pri učitavanju programa."
                );

            }


            // ========================================
            // NEMA PROGRAMA
            // ========================================

            if (!data.found) {

                programContent.innerHTML = `
                    <div class="program-info">

                        <strong>
                            Program još nije objavljen.
                        </strong>

                        <p>
                            ${escapeHTML(
                                data.message ||
                                "Program za ovaj datum još nije objavljen."
                            )}
                        </p>

                    </div>
                `;

                return;
            }


            // ========================================
            // PROGRAM PRONAĐEN
            // ========================================

            programClub.textContent = data.club;

            programContent.innerHTML = `
                <div class="program-info">

                    <p class="program-label">
                        DOGAĐAJ
                    </p>

                    <h3>
                        ${escapeHTML(data.program)}
                    </h3>

                    <p style="margin-top:15px;">
                        Izvor: Beograd Noću
                    </p>

                    <button
                        type="button"
                        id="openReservation"
                        class="submit-button"
                        style="margin-top:20px;"
                    >
                        REZERVIŠI STO
                    </button>

                </div>
            `;


            selectedClub.value = club;
            selectedDate.value = date;


            createTableSelector(club);


            document
                .getElementById("openReservation")
                .addEventListener("click", () => {

                    reservationSection.classList.remove("hidden");

                    reservationSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                });


        } catch (error) {

            console.error(error);

            programContent.innerHTML = `
                <div class="program-info">

                    <strong>
                        Greška pri učitavanju programa.
                    </strong>

                    <p>
                        ${escapeHTML(error.message)}
                    </p>

                </div>
            `;

        }

    });

});


// ========================================
// TIP STOLA
// ========================================

function createTableSelector(club) {

    const existing =
        document.getElementById("tableSelection");

    if (existing) {
        existing.remove();
    }


    const tables = TABLES[club] || [];


    const wrapper = document.createElement("div");

    wrapper.id = "tableSelection";

    wrapper.innerHTML = `

        <div class="form-group">

            <label for="tableType">
                TIP STOLA
            </label>

            <select
                id="tableType"
                required
                style="
                    width:100%;
                    padding:16px;
                    background:#111;
                    color:white;
                    border:1px solid #333;
                    border-radius:8px;
                    font-size:16px;
                "
            >

                <option value="">
                    Izaberi tip stola
                </option>

                ${tables.map(table => `

                    <option
                        value="${escapeHTML(table.name)}"
                        data-condition="${escapeHTML(table.condition)}"
                    >
                        ${escapeHTML(table.name)}
                    </option>

                `).join("")}

            </select>

        </div>


        <div
            id="conditionDisplay"
            class="form-group"
            style="display:none;"
        >

            <label>
                USLOV REZERVACIJE
            </label>

            <div
                id="conditionText"
                style="
                    padding:16px;
                    background:#111;
                    border:1px solid #ffb800;
                    border-radius:8px;
                    color:#ffb800;
                    font-weight:bold;
                "
            >
            </div>

        </div>


        <input
            type="hidden"
            id="reservationCondition"
        >
    `;


    const submitButton =
        reservationForm.querySelector(
            'button[type="submit"]'
        );


    reservationForm.insertBefore(
        wrapper,
        submitButton
    );


    const tableType =
        document.getElementById("tableType");

    const conditionDisplay =
        document.getElementById("conditionDisplay");

    const conditionText =
        document.getElementById("conditionText");

    const reservationCondition =
        document.getElementById("reservationCondition");


    tableType.addEventListener("change", () => {

        const option =
            tableType.options[
                tableType.selectedIndex
            ];


        const condition =
            option.dataset.condition || "";


        reservationCondition.value =
            condition;


        if (!condition) {

            conditionDisplay.style.display =
                "none";

            return;

        }


        conditionText.textContent =
            condition;

        conditionDisplay.style.display =
            "block";

    });

}


// ========================================
// SLANJE REZERVACIJE
// ========================================

reservationForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const tableType =
            document.getElementById("tableType");

        const reservationCondition =
            document.getElementById(
                "reservationCondition"
            );


        if (!tableType || !tableType.value) {

            alert("Izaberi tip stola.");

            return;
        }


        const reservation = {

            club: selectedClub.value,

            date: selectedDate.value,

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
                document
                    .getElementById("guests")
                    .value,

            tableType:
                tableType.value,

            condition:
                reservationCondition.value

        };


        reservationMessage.textContent =
            "Šaljemo rezervaciju...";


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


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Rezervacija nije poslata."
                );

            }


            reservationMessage.textContent =
                "✓ Rezervacija je uspešno poslata!";


            reservationForm.reset();


        } catch (error) {

            console.error(error);

            reservationMessage.textContent =
                "Greška: " + error.message;

        }

    }
);
