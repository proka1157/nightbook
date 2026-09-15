const eventDate = document.getElementById("eventDate");
const clubCards = document.querySelectorAll(".club-card");
const programResult = document.getElementById("programResult");

const reservationSection = document.getElementById("reservationSection");
const reservationForm = document.getElementById("reservationForm");

const selectedClubInput = document.getElementById("selectedClub");
const selectedDateInput = document.getElementById("selectedDate");

// ========================================
// USLOVI PO KLUBOVIMA
// ========================================

const tableConditions = {
    freestyler: [
        {
            table: "Barski sto",
            condition: "1 obična flaša"
        },
        {
            table: "Mali separe",
            condition: "1 premium flaša"
        },
        {
            table: "Veliki separe",
            condition: "2 premium flaše"
        },
        {
            table: "Centralni separe",
            condition: "3 premium flaše"
        }
    ],

    lasta: [
        {
            table: "Barski sto",
            condition: "1 obična flaša"
        },
        {
            table: "Visoko sedenje",
            condition: "1 premium flaša"
        },
        {
            table: "Separe",
            condition: "2 premium flaše"
        },
        {
            table: "Veliki separe",
            condition: "3 premium flaše"
        }
    ],

    remiks: [
        {
            table: "Barski sto",
            condition: "Bez uslova"
        },
        {
            table: "Visoko sedenje",
            condition: "1 obična flaša"
        },
        {
            table: "Separe",
            condition: "1 premium flaša"
        }
    ],

    tranzit: [
        {
            table: "Barski sto",
            condition: "50 €"
        },
        {
            table: "Visoko sedenje",
            condition: "100 € / 1 obična flaša"
        },
        {
            table: "Separe",
            condition: "1 premium flaša"
        }
    ]
};

// ========================================
// DATUM
// ========================================

const today = new Date();
const todayString =
    today.getFullYear() +
    "-" +
    String(today.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(today.getDate()).padStart(2, "0");

if (eventDate) {
    eventDate.min = todayString;
}

// ========================================
// FORMAT DATUMA
// ========================================

function formatDate(dateString) {
    const [year, month, day] = dateString.split("-");
    return `${day}.${month}.${year}.`;
}

// ========================================
// ESCAPE HTML
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
// IZBOR KLUBA
// ========================================

clubCards.forEach(card => {

    card.addEventListener("click", async () => {

        const selectedDate = eventDate.value;
        const club = card.dataset.club;

        if (!selectedDate) {
            alert("Prvo izaberi datum.");
            eventDate.focus();
            return;
        }

        clubCards.forEach(item =>
            item.classList.remove("active")
        );

        card.classList.add("active");

        reservationSection.style.display = "none";

        programResult.innerHTML = `
            <div class="program-card">
                <span class="program-status">
                    UČITAVANJE...
                </span>

                <h2>Tražimo program</h2>

                <p>
                    Proveravamo program za
                    ${formatDate(selectedDate)}
                </p>
            </div>
        `;

        try {

            const response = await fetch(
                `/api/program?club=${encodeURIComponent(club)}&date=${encodeURIComponent(selectedDate)}`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Greška pri učitavanju programa."
                );
            }

            if (!data.found) {

                programResult.innerHTML = `
                    <div class="program-card">

                        <span class="program-status">
                            PROGRAM
                        </span>

                        <h2>
                            ${escapeHTML(data.club)}
                        </h2>

                        <p class="program-date">
                            ${formatDate(selectedDate)}
                        </p>

                        <div class="program-info">
                            <strong>
                                Program još nije objavljen
                            </strong>

                            <p>
                                ${escapeHTML(data.message)}
                            </p>
                        </div>

                    </div>
                `;

                reservationSection.style.display = "none";
                return;
            }

            // ========================================
            // PROGRAM JE PRONAĐEN
            // ========================================

            programResult.innerHTML = `
                <div class="program-card">

                    <span class="program-status">
                        PROGRAM PRONAĐEN
                    </span>

                    <h2>
                        ${escapeHTML(data.club)}
                    </h2>

                    <p class="program-date">
                        ${formatDate(selectedDate)}
                    </p>

                    <div class="program-info">

                        <div class="program-label">
                            PROGRAM
                        </div>

                        <div class="program-name">
                            ${escapeHTML(data.program)}
                        </div>

                    </div>

                    <button
                        type="button"
                        class="reserve-program-btn"
                        id="reserveProgramButton"
                    >
                        REZERVIŠI STO
                    </button>

                </div>
            `;

            selectedClubInput.value = club;
            selectedDateInput.value = selectedDate;

            createTableSelector(club);

            document
                .getElementById("reserveProgramButton")
                .addEventListener("click", () => {

                    reservationSection.style.display = "block";

                    reservationSection.scrollIntoView({
                        behavior: "smooth"
                    });
                });

        } catch (error) {

            console.error(error);

            programResult.innerHTML = `
                <div class="program-card">

                    <span class="program-status">
                        GREŠKA
                    </span>

                    <h2>
                        Program trenutno nije dostupan
                    </h2>

                    <p>
                        Pokušaj ponovo za nekoliko trenutaka.
                    </p>

                </div>
            `;

            reservationSection.style.display = "none";
        }
    });
});

// ========================================
// TIP STOLA + USLOV
// ========================================

function createTableSelector(club) {

    const oldSelector =
        document.getElementById("tableSelectorContainer");

    if (oldSelector) {
        oldSelector.remove();
    }

    const options = tableConditions[club] || [];

    const container = document.createElement("div");

    container.id = "tableSelectorContainer";
    container.className = "form-group";

    container.innerHTML = `
        <label for="tableType">
            TIP STOLA
        </label>

        <select
            id="tableType"
            name="tableType"
            required
        >
            <option value="">
                Izaberi tip stola
            </option>

            ${options.map(item => `
                <option
                    value="${escapeHTML(item.table)}"
                    data-condition="${escapeHTML(item.condition)}"
                >
                    ${escapeHTML(item.table)}
                </option>
            `).join("")}

        </select>

        <div
            id="conditionBox"
            style="display:none; margin-top:12px;"
        ></div>

        <input
            type="hidden"
            id="reservationCondition"
            name="condition"
        >
    `;

    const submitButton =
        reservationForm.querySelector(
            'button[type="submit"]'
        );

    reservationForm.insertBefore(
        container,
        submitButton
    );

    const tableType =
        document.getElementById("tableType");

    const conditionBox =
        document.getElementById("conditionBox");

    const conditionInput =
        document.getElementById(
            "reservationCondition"
        );

    tableType.addEventListener("change", () => {

        const option =
            tableType.options[
                tableType.selectedIndex
            ];

        const condition =
            option.dataset.condition || "";

        conditionInput.value = condition;

        if (!condition) {
            conditionBox.style.display = "none";
            return;
        }

        conditionBox.style.display = "block";

        conditionBox.innerHTML = `
            <div class="condition-card">

                <span>
                    USLOV REZERVACIJE
                </span>

                <strong>
                    ${escapeHTML(condition)}
                </strong>

            </div>
        `;
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

        const condition =
            document.getElementById(
                "reservationCondition"
            );

        if (!tableType || !tableType.value) {
            alert("Izaberi tip stola.");
            return;
        }

        const data = {
            club: selectedClubInput.value,
            date: selectedDateInput.value,

            name:
                document.getElementById("name").value.trim(),

            phone:
                document.getElementById("phone").value.trim(),

            instagram:
                document.getElementById("instagram").value.trim(),

            guests:
                document.getElementById("guests").value,

            tableType: tableType.value,

            condition: condition.value
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

                    body: JSON.stringify(data)
                }
            );

            const result =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error ||
                    "Rezervacija nije poslata."
                );
            }

            alert(
                "Rezervacija je uspešno poslata!"
            );

            reservationForm.reset();

            reservationSection.style.display =
                "none";

        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Došlo je do greške."
            );
        }
    }
);
