// ========================================
// ELEMENTI
// ========================================

const eventDate = document.getElementById("eventDate");
const mainQuickDates = document.getElementById("mainQuickDates");
const otherDateButton = document.getElementById("otherDateButton");
const customDateWrapper = document.getElementById("customDateWrapper");

const clubCards = document.querySelectorAll(".club-card");

const programResult = document.getElementById("programResult");
const programClub = document.getElementById("programClub");
const programDate = document.getElementById("programDate");
const programContent = document.getElementById("programContent");

const reservationSection = document.getElementById("reservationSection");
const reservationForm = document.getElementById("reservationForm");
const reservationMessage = document.getElementById("reservationMessage");

const selectedClub = document.getElementById("selectedClub");
const selectedDate = document.getElementById("selectedDate");


// ========================================
// USLOVI ZA STOLOVE
// ========================================

const TABLES = {

    // LASTA

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


    // FREESTYLER

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


    // REMIKS

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


    // TRANZIT

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
    ],


    // THE BANK

    bank: [
        {
            name: "Barski sto",
            condition: "8.000 RSD"
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
            name: "Centralni separe",
            condition: "3 premium flaše"
        }
    ],


    // LETO

    leto: [
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
            name: "Centralni separe",
            condition: "3 premium flaše"
        }
    ],


    // GRADSKA KAFANA

    gradska: [
        {
            name: "Barski sto — dalje od bine",
            condition: "8.000 RSD"
        },
        {
            name: "Barski sto — bliže bini",
            condition: "1 obična flaša"
        },
        {
            name: "Mali separe — dalje",
            condition: "1 obična flaša"
        },
        {
            name: "Mali separe — bliže",
            condition: "1 premium flaša"
        },
        {
            name: "Separe — dalje",
            condition: "2 obične flaše"
        },
        {
            name: "Separe — bliže",
            condition: "2 premium flaše"
        }
    ]

};


// ========================================
// DANI I MESECI
// ========================================

const DAY_NAMES = [
    "NED",
    "PON",
    "UTO",
    "SRE",
    "ČET",
    "PET",
    "SUB"
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


// ========================================
// DATUM FUNKCIJE
// ========================================

function startOfToday() {

    const date = new Date();

    date.setHours(
        12,
        0,
        0,
        0
    );

    return date;

}


function toLocalDateString(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${year}-${month}-${day}`;

}


function dateFromValue(value) {

    return new Date(
        value + "T12:00:00"
    );

}


function formatDate(value) {

    const date =
        dateFromValue(value);

    return date.toLocaleDateString(
        "sr-RS",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

}


// ========================================
// MINIMALNI DATUM
// ========================================

const today =
    startOfToday();

eventDate.min =
    toLocalDateString(
        today
    );


// ========================================
// RESET
// ========================================

function resetSelection() {

    programResult.classList.add(
        "hidden"
    );

    reservationSection.classList.add(
        "hidden"
    );

    clubCards.forEach(
        card =>
            card.classList.remove(
                "active"
            )
    );

    selectedClub.value = "";
    selectedDate.value = "";

    const oldSelector =
        document.getElementById(
            "tableSelection"
        );

    if (oldSelector) {
        oldSelector.remove();
    }

    reservationMessage.textContent = "";

}


// ========================================
// IZBOR DATUMA
// ========================================

function selectDate(value) {

    if (!value) {
        return;
    }


    const chosenDate =
        dateFromValue(value);

    const minimum =
        startOfToday();


    if (
        chosenDate <
        minimum
    ) {

        alert(
            "Nije moguće izabrati datum koji je prošao."
        );

        eventDate.value =
            toLocalDateString(
                minimum
            );

        return;

    }


    eventDate.value =
        value;


    document
        .querySelectorAll(
            ".main-date-button"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.date ===
                    value
                );

            }
        );


    resetSelection();

}


// ========================================
// TRI GLAVNA DATUMA
// ========================================

function renderMainDates() {

    const dates = [];


    for (
        let i = 0;
        i < 3;
        i++
    ) {

        const date =
            new Date(today);

        date.setDate(
            today.getDate() + i
        );

        dates.push(date);

    }


    mainQuickDates.innerHTML =
        dates
            .map(
                (date, index) => {

                    const value =
                        toLocalDateString(
                            date
                        );


                    let dayLabel;


                    if (index === 0) {

                        dayLabel =
                            "DANAS";

                    } else if (
                        index === 1
                    ) {

                        dayLabel =
                            "SUTRA";

                    } else {

                        dayLabel =
                            DAY_NAMES[
                                date.getDay()
                            ];

                    }


                    return `
                        <button
                            type="button"
                            class="main-date-button"
                            data-date="${value}"
                        >

                            <span class="main-date-day">
                                ${dayLabel}
                            </span>

                            <span class="main-date-number">
                                ${date.getDate()}
                            </span>

                            <span class="main-date-month">
                                ${MONTH_NAMES[date.getMonth()]}
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
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        selectDate(
                            button.dataset.date
                        );

                        customDateWrapper
                            .classList
                            .add(
                                "hidden"
                            );

                    }
                );

            }
        );

}


renderMainDates();


// ========================================
// DRUGI DATUM
// ========================================

otherDateButton.addEventListener(
    "click",
    () => {

        customDateWrapper
            .classList
            .toggle(
                "hidden"
            );


        if (
            !customDateWrapper
                .classList
                .contains(
                    "hidden"
                )
        ) {

            setTimeout(
                () => {

                    eventDate.focus();


                    if (
                        typeof eventDate.showPicker ===
                        "function"
                    ) {

                        try {

                            eventDate.showPicker();

                        } catch (error) {

                            // Safari može blokirati showPicker.
                            // Input će i dalje normalno raditi.

                        }

                    }

                },
                100
            );

        }

    }
);


// ========================================
// RUČNO IZABRAN DATUM
// ========================================

eventDate.addEventListener(
    "change",
    () => {

        if (
            !eventDate.value
        ) {
            return;
        }


        const chosen =
            dateFromValue(
                eventDate.value
            );


        if (
            chosen <
            startOfToday()
        ) {

            alert(
                "Nije moguće izabrati datum koji je prošao."
            );

            eventDate.value = "";

            return;

        }


        selectDate(
            eventDate.value
        );

    }
);


// ========================================
// IZBOR KLUBA
// ========================================

clubCards.forEach(
    card => {

        card.addEventListener(
            "click",
            async () => {

                const date =
                    eventDate.value;


                if (!date) {

                    alert(
                        "Prvo izaberi datum."
                    );

                    document
                        .getElementById(
                            "booking"
                        )
                        .scrollIntoView({
                            behavior: "smooth"
                        });

                    return;

                }


                clubCards.forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );


                card.classList.add(
                    "active"
                );


                const club =
                    card.dataset.club;


                await loadProgram(
                    club,
                    date
                );

            }
        );

    }
);


// ========================================
// UČITAVANJE PROGRAMA
// ========================================

async function loadProgram(
    club,
    date
) {

    programResult.classList.remove(
        "hidden"
    );

    reservationSection.classList.add(
        "hidden"
    );


    programClub.textContent =
        "Učitavanje...";

    programDate.textContent =
        formatDate(date);

    programContent.innerHTML =
        `
            <p>
                Proveravamo program...
            </p>
        `;


    const oldSelector =
        document.getElementById(
            "tableSelection"
        );

    if (oldSelector) {
        oldSelector.remove();
    }


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
                "Greška pri učitavanju programa."
            );

        }


        programClub.textContent =
            data.club;

        programDate.textContent =
            formatDate(date);


        // PROGRAM NIJE OBJAVLJEN

        if (!data.found) {

            programContent.innerHTML =
                `
                    <p style="
                        font-weight:900;
                        color:#ffffff;
                    ">
                        Program još nije objavljen
                    </p>

                    <p style="
                        margin-top:8px;
                        color:#888888;
                        font-size:14px;
                    ">
                        Program za ${formatDate(date)}
                        trenutno nije dostupan.
                    </p>
                `;

            return;

        }


        // PROGRAM POSTOJI

        programContent.innerHTML =
            `
                <div
                    style="
                        font-size:19px;
                        font-weight:900;
                        line-height:1.45;
                    "
                >
                    ${escapeHTML(data.program)}
                </div>

                <button
                    type="button"
                    id="openReservationButton"
                    class="reserve-table-button"
                >
                    REZERVIŠI STO
                </button>
            `;


        selectedClub.value =
            club;

        selectedDate.value =
            date;


        const openReservationButton =
            document.getElementById(
                "openReservationButton"
            );


        openReservationButton
            .addEventListener(
                "click",
                () => {

                    showReservation(
                        club
                    );

                }
            );


    } catch (error) {

        console.error(error);


        programClub.textContent =
            "Greška";


        programContent.innerHTML =
            `
                <p>
                    Trenutno nije moguće učitati program.
                    Pokušaj ponovo.
                </p>
            `;

    }

}


// ========================================
// PRIKAŽI REZERVACIJU
// ========================================

function showReservation(club) {

    reservationSection
        .classList
        .remove(
            "hidden"
        );


    createTableSelection(
        club
    );


    reservationSection
        .scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

}


// ========================================
// KREIRANJE IZBORA STOLOVA
// ========================================

function createTableSelection(
    club
) {

    const oldSelector =
        document.getElementById(
            "tableSelection"
        );


    if (oldSelector) {
        oldSelector.remove();
    }


    const tables =
        TABLES[club] || [];


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.id =
        "tableSelection";


    wrapper.innerHTML =
        `
            <p class="table-selection-title">
                IZABERI TIP STOLA
            </p>

            <div class="table-options">

                ${tables
                    .map(
                        (table, index) => `
                            <button
                                type="button"
                                class="table-option"
                                data-index="${index}"
                                data-name="${escapeAttribute(table.name)}"
                                data-condition="${escapeAttribute(table.condition)}"
                            >

                                <span class="table-option-name">
                                    ${escapeHTML(table.name)}
                                </span>

                                <span class="table-option-condition">
                                    ${escapeHTML(table.condition)}
                                </span>

                            </button>
                        `
                    )
                    .join("")}

            </div>

            <input
                type="hidden"
                id="selectedTableType"
            >

            <input
                type="hidden"
                id="selectedTableCondition"
            >
        `;


    const guestsGroup =
        document
            .getElementById(
                "guests"
            )
            .closest(
                ".form-group"
            );


    guestsGroup.insertAdjacentElement(
        "afterend",
        wrapper
    );


    const tableButtons =
        wrapper.querySelectorAll(
            ".table-option"
        );


    tableButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    tableButtons.forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                    button.classList.add(
                        "active"
                    );


                    document
                        .getElementById(
                            "selectedTableType"
                        )
                        .value =
                        button.dataset.name;


                    document
                        .getElementById(
                            "selectedTableCondition"
                        )
                        .value =
                        button.dataset.condition;

                }
            );

        }
    );

}


// ========================================
// SLANJE REZERVACIJE
// ========================================

reservationForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        reservationMessage.textContent =
            "";


        const tableTypeElement =
            document.getElementById(
                "selectedTableType"
            );


        const tableConditionElement =
            document.getElementById(
                "selectedTableCondition"
            );


        if (
            !tableTypeElement ||
            !tableTypeElement.value
        ) {

            alert(
                "Izaberi tip stola."
            );

            return;

        }


        const payload = {

            club:
                selectedClub.value,

            date:
                selectedDate.value,

            name:
                document
                    .getElementById(
                        "name"
                    )
                    .value
                    .trim(),

            phone:
                document
                    .getElementById(
                        "phone"
                    )
                    .value
                    .trim(),

            instagram:
                document
                    .getElementById(
                        "instagram"
                    )
                    .value
                    .trim(),

            guests:
                Number(
                    document
                        .getElementById(
                            "guests"
                        )
                        .value
                ),

            tableType:
                tableTypeElement.value,

            condition:
                tableConditionElement
                    ? tableConditionElement.value
                    : ""

        };


        try {

            const submitButton =
                reservationForm.querySelector(
                    ".submit-button"
                );


            submitButton.disabled =
                true;

            submitButton.textContent =
                "SLANJE...";


            const response =
                await fetch(
                    "/api/reservations",
                    {

                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                payload
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
                "Rezervacija je uspešno poslata!";


            reservationForm.reset();


            eventDate.value =
                selectedDate.value;


            document
                .querySelectorAll(
                    ".table-option"
                )
                .forEach(
                    button =>
                        button.classList.remove(
                            "active"
                        )
                );


            if (tableTypeElement) {
                tableTypeElement.value = "";
            }


            if (tableConditionElement) {
                tableConditionElement.value = "";
            }


        } catch (error) {

            console.error(error);


            reservationMessage.textContent =
                error.message;

        } finally {

            const submitButton =
                reservationForm.querySelector(
                    ".submit-button"
                );


            submitButton.disabled =
                false;

            submitButton.textContent =
                "POŠALJI REZERVACIJU";

        }

    }
);


// ========================================
// ZAŠTITA TEKSTA
// ========================================

function escapeHTML(value) {

    return String(value)

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


function escapeAttribute(value) {

    return escapeHTML(value);

}
