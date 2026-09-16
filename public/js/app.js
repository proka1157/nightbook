const eventDate =
    document.getElementById("eventDate");

const clubCards =
    document.querySelectorAll(".club-card");

const programResult =
    document.getElementById("programResult");

const programClub =
    document.getElementById("programClub");

const programDate =
    document.getElementById("programDate");

const programContent =
    document.getElementById("programContent");

const reservationSection =
    document.getElementById("reservationSection");

const reservationForm =
    document.getElementById("reservationForm");

const selectedClub =
    document.getElementById("selectedClub");

const selectedDate =
    document.getElementById("selectedDate");

const reservationMessage =
    document.getElementById("reservationMessage");

const mainQuickDates =
    document.getElementById("mainQuickDates");

const quickDates =
    document.getElementById("quickDates");

const otherDateButton =
    document.getElementById("otherDateButton");

const customDateWrapper =
    document.getElementById("customDateWrapper");

const selectedDateBadge =
    document.getElementById("selectedDateBadge");


/* ========================================
   STOLOVI
======================================== */

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


/* ========================================
   DATUMI
======================================== */

const DAY_NAMES = [
    "NED",
    "PON",
    "UTO",
    "SRE",
    "ČET",
    "PET",
    "SUB"
];

const FULL_DAY_NAMES = [
    "Nedelja",
    "Ponedeljak",
    "Utorak",
    "Sreda",
    "Četvrtak",
    "Petak",
    "Subota"
];

const MONTH_NAMES = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAJ",
    "JUN",
    "JUL",
    "AVG",
    "SEP",
    "OKT",
    "NOV",
    "DEC"
];

const FULL_MONTH_NAMES = [
    "januar",
    "februar",
    "mart",
    "april",
    "maj",
    "jun",
    "jul",
    "avgust",
    "septembar",
    "oktobar",
    "novembar",
    "decembar"
];


function startOfToday() {

    const date = new Date();

    date.setHours(12, 0, 0, 0);

    return date;
}


function toLocalDateString(date) {

    return (
        date.getFullYear() +
        "-" +
        String(
            date.getMonth() + 1
        ).padStart(2, "0") +
        "-" +
        String(
            date.getDate()
        ).padStart(2, "0")
    );
}


function dateFromValue(value) {

    const parts =
        value.split("-");

    return new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2]),
        12,
        0,
        0
    );
}


function formatDate(value) {

    const date =
        dateFromValue(value);

    return (
        String(date.getDate())
            .padStart(2, "0") +
        "." +
        String(date.getMonth() + 1)
            .padStart(2, "0") +
        "." +
        date.getFullYear() +
        "."
    );
}


function formatPrettyDate(value) {

    const date =
        dateFromValue(value);

    return (
        FULL_DAY_NAMES[date.getDay()] +
        ", " +
        date.getDate() +
        ". " +
        FULL_MONTH_NAMES[date.getMonth()]
    );
}


/* ========================================
   ZABRANI PROŠLE DATUME
======================================== */

const today =
    startOfToday();

eventDate.min =
    toLocalDateString(today);


/* ========================================
   RESET POSLE PROMENE DATUMA
======================================== */

function resetSelection() {

    programResult
        .classList
        .add("hidden");

    reservationSection
        .classList
        .add("hidden");

    clubCards.forEach(card => {
        card.classList.remove("active");
    });

    selectedClub.value = "";
    selectedDate.value = "";

    const oldSelector =
        document.getElementById(
            "tableSelection"
        );

    if (oldSelector) {
        oldSelector.remove();
    }
}


/* ========================================
   POSTAVI DATUM
======================================== */

function selectDate(value) {

    const chosenDate =
        dateFromValue(value);

    const minimum =
        startOfToday();

    if (chosenDate < minimum) {

        alert(
            "Nije moguće izabrati datum koji je prošao."
        );

        return;
    }

    eventDate.value =
        value;

    selectedDateBadge.textContent =
        formatPrettyDate(value);

    document
        .querySelectorAll(
            ".main-date-button, .quick-date"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.date === value
            );

        });

    resetSelection();
}


/* ========================================
   DANAS I SUTRA
======================================== */

function renderMainDates() {

    const dates = [];

    for (let i = 0; i < 2; i++) {

        const date =
            new Date(today);

        date.setDate(
            today.getDate() + i
        );

        dates.push(date);
    }

    mainQuickDates.innerHTML =
        dates.map(
            (date, index) => {

                const value =
                    toLocalDateString(date);

                return `
                    <button
                        type="button"
                        class="main-date-button"
                        data-date="${value}"
                    >

                        <span class="main-date-title">
                            ${
                                index === 0
                                ? "DANAS"
                                : "SUTRA"
                            }
                        </span>

                        <span class="main-date-full">
                            ${FULL_DAY_NAMES[date.getDay()]},
                            ${date.getDate()}.
                            ${FULL_MONTH_NAMES[date.getMonth()]}
                        </span>

                    </button>
                `;
            }
        )
        .join("");

    document
        .querySelectorAll(
            ".main-date-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    selectDate(
                        button.dataset.date
                    );

                }
            );

        });
}


/* ========================================
   NAREDNIH 5 DATUMA
======================================== */

function renderQuickDates() {

    const dates = [];

    /*
        Krećemo od prekosutra jer su
        danas i sutra već iznad.
    */

    for (let i = 2; i < 7; i++) {

        const date =
            new Date(today);

        date.setDate(
            today.getDate() + i
        );

        dates.push(date);
    }

    quickDates.innerHTML =
        dates.map(date => {

            const value =
                toLocalDateString(date);

            return `
                <button
                    type="button"
                    class="quick-date"
                    data-date="${value}"
                >

                    <span class="quick-date-day">
                        ${DAY_NAMES[date.getDay()]}
                    </span>

                    <span class="quick-date-number">
                        ${date.getDate()}
                    </span>

                    <span class="quick-date-month">
                        ${MONTH_NAMES[date.getMonth()]}
                    </span>

                </button>
            `;

        }).join("");

    document
        .querySelectorAll(
            ".quick-date"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    selectDate(
                        button.dataset.date
                    );

                }
            );

        });
}


renderMainDates();
renderQuickDates();


/* ========================================
   DRUGI DATUM
======================================== */

otherDateButton.addEventListener(
    "click",
    () => {

        customDateWrapper
            .classList
            .toggle("hidden");

        if (
            !customDateWrapper
                .classList
                .contains("hidden")
        ) {

            setTimeout(() => {
                eventDate.focus();
            }, 100);
        }

    }
);


eventDate.addEventListener(
    "change",
    () => {

        if (!eventDate.value) {
            return;
        }

        selectDate(
            eventDate.value
        );

    }
);


/* ========================================
   ESCAPE HTML
======================================== */

function escapeHTML(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ========================================
   KLIK NA KLUB
======================================== */

clubCards.forEach(card => {

    card.addEventListener(
        "click",
        async () => {

            const date =
                eventDate.value;

            const club =
                card.dataset.club;


            if (!date) {

                alert(
                    "Prvo izaberi datum."
                );

                document
                    .getElementById("booking")
                    .scrollIntoView({
                        behavior: "smooth"
                    });

                return;
            }


            clubCards.forEach(
                button => {

                    button
                        .classList
                        .remove("active");

                }
            );

            card.classList.add("active");


            programResult
                .classList
                .remove("hidden");

            reservationSection
                .classList
                .add("hidden");


            programClub.textContent =
                card
                    .querySelector("strong")
                    .textContent
                    .trim();

            programDate.textContent =
                formatDate(date);


            programContent.innerHTML = `
                <div class="program-info">
                    <p>
                        Tražimo program...
                    </p>
                </div>
            `;


            programResult
                .scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });


            try {

                const response =
                    await fetch(
                        `/api/program?club=${encodeURIComponent(club)}&date=${encodeURIComponent(date)}`
                    );

                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        "Greška pri učitavanju."
                    );
                }


                if (!data.found) {

                    programContent.innerHTML = `
                        <div class="program-info">

                            <h3>
                                Program još nije objavljen
                            </h3>

                            <p>
                                Program za
                                ${escapeHTML(formatDate(date))}
                                trenutno nije dostupan.
                            </p>

                        </div>
                    `;

                    return;
                }


                programClub.textContent =
                    data.club;


                programContent.innerHTML = `
                    <div class="program-info">

                        <p class="program-label">
                            DOGAĐAJ
                        </p>

                        <h3>
                            ${escapeHTML(data.program)}
                        </h3>

                        <button
                            type="button"
                            id="openReservation"
                            class="submit-button"
                            style="margin-top:25px;"
                        >
                            REZERVIŠI STO
                        </button>

                    </div>
                `;


                selectedClub.value =
                    club;

                selectedDate.value =
                    date;


                createTableSelector(
                    club
                );


                document
                    .getElementById(
                        "openReservation"
                    )
                    .addEventListener(
                        "click",
                        () => {

                            reservationSection
                                .classList
                                .remove(
                                    "hidden"
                                );

                            reservationSection
                                .scrollIntoView({
                                    behavior:
                                        "smooth",
                                    block:
                                        "start"
                                });

                        }
                    );

            } catch (error) {

                console.error(error);

                programContent.innerHTML = `
                    <div class="program-info">

                        <h3>
                            Program trenutno nije dostupan
                        </h3>

                        <p>
                            Pokušaj ponovo za nekoliko trenutaka.
                        </p>

                    </div>
                `;

            }

        }
    );

});


/* ========================================
   TIP STOLA
======================================== */

function createTableSelector(club) {

    const existing =
        document.getElementById(
            "tableSelection"
        );

    if (existing) {
        existing.remove();
    }


    const tables =
        TABLES[club] || [];


    const wrapper =
        document.createElement("div");

    wrapper.id =
        "tableSelection";


    wrapper.innerHTML = `

        <div class="form-group">

            <label for="tableType">
                TIP STOLA
            </label>

            <select
                id="tableType"
                required
            >

                <option value="">
                    Izaberi tip stola
                </option>

                ${tables.map(
                    table => `
                        <option
                            value="${escapeHTML(table.name)}"
                            data-condition="${escapeHTML(table.condition)}"
                        >
                            ${escapeHTML(table.name)}
                        </option>
                    `
                ).join("")}

            </select>

        </div>


        <div
            id="conditionDisplay"
            class="form-group hidden"
        >

            <label>
                USLOV REZERVACIJE
            </label>

            <div
                id="conditionText"
                style="
                    padding:17px;
                    background:#151515;
                    border:1px solid #ffb800;
                    border-radius:13px;
                    color:#ffb800;
                    font-weight:800;
                "
            ></div>

        </div>


        <input
            type="hidden"
            id="reservationCondition"
        >
    `;


    const submitButton =
        reservationForm
            .querySelector(
                'button[type="submit"]'
            );


    reservationForm.insertBefore(
        wrapper,
        submitButton
    );


    const tableType =
        document.getElementById(
            "tableType"
        );

    const conditionDisplay =
        document.getElementById(
            "conditionDisplay"
        );

    const conditionText =
        document.getElementById(
            "conditionText"
        );

    const reservationCondition =
        document.getElementById(
            "reservationCondition"
        );


    tableType.addEventListener(
        "change",
        () => {

            const option =
                tableType.options[
                    tableType.selectedIndex
                ];

            const condition =
                option.dataset.condition || "";


            reservationCondition.value =
                condition;


            if (!condition) {

                conditionDisplay
                    .classList
                    .add("hidden");

                return;
            }


            conditionText.textContent =
                condition;

            conditionDisplay
                .classList
                .remove("hidden");

        }
    );

}


/* ========================================
   SLANJE REZERVACIJE
======================================== */

reservationForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const tableType =
            document.getElementById(
                "tableType"
            );

        const reservationCondition =
            document.getElementById(
                "reservationCondition"
            );


        if (
            !tableType ||
            !tableType.value
        ) {

            alert(
                "Izaberi tip stola."
            );

            return;
        }


        const reservation = {

            club:
                selectedClub.value,

            date:
                selectedDate.value,

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

            const response =
                await fetch(
                    "/api/reservations",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                reservation
                            )
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


            /*
                Ne koristimo kompletan reset forme
                jer želimo da zadržimo klub i datum.
            */

            document
                .getElementById("name")
                .value = "";

            document
                .getElementById("phone")
                .value = "";

            document
                .getElementById("instagram")
                .value = "";

            document
                .getElementById("guests")
                .value = "2";

            tableType.value = "";

            reservationCondition.value = "";

            const conditionDisplay =
                document.getElementById(
                    "conditionDisplay"
                );

            if (conditionDisplay) {
                conditionDisplay
                    .classList
                    .add("hidden");
            }


        } catch (error) {

            console.error(error);

            reservationMessage.textContent =
                "Greška pri slanju rezervacije.";

        }

    }
);
