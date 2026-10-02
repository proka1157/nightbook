/* =========================================================
   NIGHTBOOK
   FRONTEND APPLICATION
   ========================================================= */


/* =========================================================
   ELEMENTS
   ========================================================= */

const eventDate =
    document.getElementById("eventDate");

const mainQuickDates =
    document.getElementById("mainQuickDates");

const otherDateButton =
    document.getElementById("otherDateButton");

const customDateWrapper =
    document.getElementById("customDateWrapper");

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

const reservationMessage =
    document.getElementById("reservationMessage");

const selectedClub =
    document.getElementById("selectedClub");

const selectedDate =
    document.getElementById("selectedDate");

const bottomBar =
    document.querySelector(".mobile-bottom-bar");


/* =========================================================
   TABLE CONDITIONS
   ========================================================= */

const TABLES = {

    lasta: [
        {
            type: "Barski sto",
            condition: "1 obična flaša"
        },
        {
            type: "Visoko sedenje",
            condition: "1 premium flaša"
        },
        {
            type: "Separe",
            condition: "2 premium flaše"
        },
        {
            type: "Veliki separe",
            condition: "3 premium flaše"
        }
    ],

    freestyler: [
        {
            type: "Barski sto",
            condition: "1 obična flaša"
        },
        {
            type: "Mali separe",
            condition: "1 premium flaša"
        },
        {
            type: "Veliki separe",
            condition: "2 premium flaše"
        },
        {
            type: "Centralni separe",
            condition: "3 premium flaše"
        }
    ],

    remiks: [
        {
            type: "Barski sto",
            condition: "Bez uslova"
        },
        {
            type: "Visoko sedenje",
            condition: "1 obična flaša"
        },
        {
            type: "Separe",
            condition: "1 premium flaša"
        }
    ],

    tranzit: [
        {
            type: "Barski sto",
            condition: "50 €"
        },
        {
            type: "Visoko sedenje",
            condition: "100 € / 1 obična flaša"
        },
        {
            type: "Separe",
            condition: "1 premium flaša"
        }
    ],

    bank: [
        {
            type: "Barski sto",
            condition: "1 obična flaša"
        },
        {
            type: "Visoko sedenje",
            condition: "1 premium flaša"
        },
        {
            type: "Separe",
            condition: "2 premium flaše"
        },
        {
            type: "Centralni separe",
            condition: "3 premium flaše"
        }
    ],

    hype: [
        {
            type: "Barski sto",
            condition: "1 obična flaša"
        },
        {
            type: "Visoko sedenje",
            condition: "1 premium flaša"
        },
        {
            type: "Separe",
            condition: "2 premium flaše"
        },
        {
            type: "Centralni separe",
            condition: "3 premium flaše"
        }
    ],

    gradska: [
        {
            type: "Barski sto — dalje od bine",
            condition: "8.000 RSD"
        },
        {
            type: "Barski sto — bliže bini",
            condition: "1 obična flaša"
        },
        {
            type: "Nisko sedenje — dalje od bine",
            condition: "1 obična flaša"
        },
        {
            type: "Nisko sedenje — bliže bini",
            condition: "1 premium flaša"
        },
        {
            type: "Separe — dalje od bine",
            condition: "2 obične flaše"
        },
        {
            type: "Separe — bliže bini",
            condition: "2 premium flaše"
        }
    ]

};


/* =========================================================
   CLUB DISPLAY NAMES
   ========================================================= */

const CLUB_NAMES = {

    lasta: "LASTA",

    freestyler: "FREESTYLER",

    remiks: "REMIX",

    tranzit: "TRANZIT",

    bank: "BANK",

    hype: "HYPE",

    gradska: "GRADSKA KAFANA"

};


/* =========================================================
   DATE DATA
   ========================================================= */

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


/* =========================================================
   DATE HELPERS
   ========================================================= */

function startOfToday() {

    const now =
        new Date();

    now.setHours(
        12,
        0,
        0,
        0
    );

    return now;
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

    if (!value) {
        return null;
    }

    const parts =
        value.split("-");

    if (parts.length !== 3) {
        return null;
    }

    const year =
        Number(parts[0]);

    const month =
        Number(parts[1]);

    const day =
        Number(parts[2]);

    if (
        !year ||
        !month ||
        !day
    ) {
        return null;
    }

    const date =
        new Date(
            year,
            month - 1,
            day,
            12,
            0,
            0,
            0
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return null;
    }

    return date;
}


function formatDate(value) {

    const date =
        dateFromValue(value);

    if (!date) {
        return "";
    }

    return date.toLocaleDateString(
        "sr-RS",
        {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );
}


function isPastDate(value) {

    const date =
        dateFromValue(value);

    if (!date) {
        return true;
    }

    return (
        date <
        startOfToday()
    );
}


/* =========================================================
   DATE INPUT MINIMUM
   ========================================================= */

if (eventDate) {

    eventDate.min =
        toLocalDateString(
            startOfToday()
        );

}


/* =========================================================
   RESET CURRENT SELECTION
   ========================================================= */

function resetSelection() {

    clubCards.forEach(
        (card) => {

            card.classList.remove(
                "active"
            );

        }
    );

    if (programResult) {

        programResult.classList.add(
            "hidden"
        );

    }

    if (reservationSection) {

        reservationSection.classList.add(
            "hidden"
        );

    }

    if (selectedClub) {

        selectedClub.value =
            "";

    }

    if (selectedDate) {

        selectedDate.value =
            "";

    }

    const oldTableSelection =
        document.getElementById(
            "tableSelection"
        );

    if (oldTableSelection) {

        oldTableSelection.remove();

    }

    const selectedTableType =
        document.getElementById(
            "selectedTableType"
        );

    const selectedTableCondition =
        document.getElementById(
            "selectedTableCondition"
        );

    if (selectedTableType) {

        selectedTableType.remove();

    }

    if (selectedTableCondition) {

        selectedTableCondition.remove();

    }

    if (reservationMessage) {

        reservationMessage.textContent =
            "";

    }

}


/* =========================================================
   SELECT DATE
   ========================================================= */

function selectDate(
    value,
    button = null
) {

    if (!value) {
        return;
    }

    if (isPastDate(value)) {

        alert(
            "Možeš izabrati samo današnji ili budući datum."
        );

        return;
    }

    if (eventDate) {

        eventDate.value =
            value;

    }

    document
        .querySelectorAll(
            ".main-date-button"
        )
        .forEach(
            (dateButton) => {

                dateButton
                    .classList
                    .remove(
                        "active"
                    );

            }
        );

    if (button) {

        button.classList.add(
            "active"
        );

    }

    resetSelection();

}


/* =========================================================
   CREATE QUICK DATES
   ========================================================= */

function renderMainDates() {

    if (!mainQuickDates) {
        return;
    }

    mainQuickDates.innerHTML =
        "";

    const today =
        startOfToday();

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

        const value =
            toLocalDateString(
                date
            );

        const button =
            document.createElement(
                "button"
            );

        button.type =
            "button";

        button.className =
            "main-date-button";

        button.dataset.date =
            value;

        let dayLabel =
            DAY_NAMES[
                date.getDay()
            ];

        if (i === 0) {

            dayLabel =
                "DANAS";

        }

        if (i === 1) {

            dayLabel =
                "SUTRA";

        }

        button.innerHTML = `
            <span class="main-date-day">
                ${dayLabel}
            </span>

            <span class="main-date-number">
                ${String(
                    date.getDate()
                ).padStart(
                    2,
                    "0"
                )}
            </span>

            <span class="main-date-month">
                ${
                    MONTH_NAMES[
                        date.getMonth()
                    ]
                }
            </span>
        `;

        button.addEventListener(
            "click",
            () => {

                selectDate(
                    value,
                    button
                );

                scrollToClubs();

            }
        );

        mainQuickDates.appendChild(
            button
        );

    }

}


/* =========================================================
   OTHER DATE BUTTON
   ========================================================= */

if (otherDateButton) {

    otherDateButton.addEventListener(
        "click",
        () => {

            if (!customDateWrapper) {
                return;
            }

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

                        if (
                            eventDate &&
                            typeof eventDate.showPicker ===
                            "function"
                        ) {

                            try {

                                eventDate
                                    .showPicker();

                            } catch (
                                error
                            ) {

                                // Browser ne podržava
                                // automatsko otvaranje.

                            }

                        }

                    },
                    120
                );

            }

        }
    );

}


/* =========================================================
   CUSTOM DATE CHANGE
   ========================================================= */

if (eventDate) {

    eventDate.addEventListener(
        "change",
        () => {

            const value =
                eventDate.value;

            if (!value) {
                return;
            }

            if (isPastDate(value)) {

                eventDate.value =
                    "";

                alert(
                    "Nije moguće izabrati datum koji je prošao."
                );

                return;
            }

            let matchingButton =
                null;

            document
                .querySelectorAll(
                    ".main-date-button"
                )
                .forEach(
                    (button) => {

                        if (
                            button.dataset.date ===
                            value
                        ) {

                            matchingButton =
                                button;

                        }

                    }
                );

            selectDate(
                value,
                matchingButton
            );

            scrollToClubs();

        }
    );

}


/* =========================================================
   SCROLL TO CLUBS
   ========================================================= */

function scrollToClubs() {

    const clubsSection =
        document.querySelector(
            ".clubs-section"
        );

    if (!clubsSection) {
        return;
    }

    setTimeout(
        () => {

            clubsSection.scrollIntoView(
                {
                    behavior: "smooth",
                    block: "start"
                }
            );

        },
        180
    );

}


/* =========================================================
   CLUB SELECTION
   ========================================================= */

clubCards.forEach(
    (card) => {

        card.addEventListener(
            "click",
            () => {

                if (
                    !eventDate ||
                    !eventDate.value
                ) {

                    alert(
                        "Prvo izaberi datum izlaska."
                    );

                    const dateSection =
                        document.querySelector(
                            ".date-section"
                        );

                    if (dateSection) {

                        dateSection
                            .scrollIntoView(
                                {
                                    behavior:
                                        "smooth",

                                    block:
                                        "center"
                                }
                            );

                    }

                    return;
                }

                const club =
                    card.dataset.club;

                if (!club) {
                    return;
                }

                clubCards.forEach(
                    (otherCard) => {

                        otherCard
                            .classList
                            .remove(
                                "active"
                            );

                    }
                );

                card.classList.add(
                    "active"
                );

                if (reservationSection) {

                    reservationSection
                        .classList
                        .add(
                            "hidden"
                        );

                }

                loadProgram(
                    club,
                    eventDate.value
                );

            }
        );

    }
);


/* =========================================================
   LOAD PROGRAM
   ========================================================= */

async function loadProgram(
    club,
    date
) {

    if (
        !programResult ||
        !programClub ||
        !programDate ||
        !programContent
    ) {
        return;
    }

    programResult.classList.remove(
        "hidden"
    );

    programClub.textContent =
        CLUB_NAMES[club] ||
        club.toUpperCase();

    programDate.textContent =
        formatDate(date);

    programContent.innerHTML = `
        <div class="program-loading">
            UČITAVANJE PROGRAMA...
        </div>
    `;

    programResult.scrollIntoView(
        {
            behavior:
                "smooth",

            block:
                "center"
        }
    );

    try {

        const response =
            await fetch(
                `/api/program?club=${
                    encodeURIComponent(
                        club
                    )
                }&date=${
                    encodeURIComponent(
                        date
                    )
                }`
            );

        if (!response.ok) {

            throw new Error(
                "Program trenutno nije dostupan."
            );

        }

        const data =
            await response.json();

        if (!data.found) {

            programContent.innerHTML = `
                <div class="program-empty">
                    <strong>
                        PROGRAM JOŠ NIJE OBJAVLJEN
                    </strong>

                    <p>
                        Program za ovaj datum još uvek
                        nije dostupan.
                        Proveri ponovo uskoro.
                    </p>
                </div>
            `;

            return;
        }

        const safeProgram =
            escapeHTML(
                data.program ||
                "Program je objavljen."
            );

        programContent.innerHTML = `
            <div class="program-event">
                <div class="program-event-copy">
                    ${safeProgram}
                </div>

                <button
                    type="button"
                    class="reserve-table-button"
                    id="openReservationButton"
                >
                    REZERVIŠI STO →
                </button>
            </div>
        `;

        if (selectedClub) {

            selectedClub.value =
                club;

        }

        if (selectedDate) {

            selectedDate.value =
                date;

        }

        const openReservationButton =
            document.getElementById(
                "openReservationButton"
            );

        if (openReservationButton) {

            openReservationButton
                .addEventListener(
                    "click",
                    () => {

                        showReservation(
                            club,
                            date
                        );

                    }
                );

        }

    } catch (error) {

        console.error(
            "Greška pri učitavanju programa:",
            error
        );

        programContent.innerHTML = `
            <div class="program-error">
                <strong>
                    PROGRAM TRENUTNO NIJE DOSTUPAN
                </strong>

                <p>
                    Pokušaj ponovo za nekoliko trenutaka.
                </p>
            </div>
        `;

    }

}


/* =========================================================
   SHOW RESERVATION
   ========================================================= */

function showReservation(
    club,
    date
) {

    if (!reservationSection) {
        return;
    }

    if (selectedClub) {

        selectedClub.value =
            club;

    }

    if (selectedDate) {

        selectedDate.value =
            date;

    }

    reservationSection
        .classList
        .remove(
            "hidden"
        );

    createTableSelection(
        club
    );

    setTimeout(
        () => {

            reservationSection
                .scrollIntoView(
                    {
                        behavior:
                            "smooth",

                        block:
                            "start"
                    }
                );

        },
        100
    );

}


/* =========================================================
   CREATE TABLE SELECTION
   ========================================================= */

function createTableSelection(
    club
) {

    const existing =
        document.getElementById(
            "tableSelection"
        );

    if (existing) {

        existing.remove();

    }

    const oldType =
        document.getElementById(
            "selectedTableType"
        );

    const oldCondition =
        document.getElementById(
            "selectedTableCondition"
        );

    if (oldType) {

        oldType.remove();

    }

    if (oldCondition) {

        oldCondition.remove();

    }

    const tables =
        TABLES[club];

    if (
        !tables ||
        !reservationForm
    ) {
        return;
    }

    const guestsInput =
        document.getElementById(
            "guests"
        );

    if (!guestsInput) {
        return;
    }

    const guestsGroup =
        guestsInput.closest(
            ".form-group"
        );

    if (!guestsGroup) {
        return;
    }

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.id =
        "tableSelection";

    wrapper.innerHTML = `
        <div class="table-selection-title">
            IZABERI TIP STOLA
        </div>

        <div
            class="table-options"
            id="tableOptions"
        ></div>
    `;

    guestsGroup.insertAdjacentElement(
        "afterend",
        wrapper
    );

    const tableOptions =
        wrapper.querySelector(
            "#tableOptions"
        );

    const hiddenType =
        document.createElement(
            "input"
        );

    hiddenType.type =
        "hidden";

    hiddenType.name =
        "tableType";

    hiddenType.id =
        "selectedTableType";

    hiddenType.required =
        true;

    const hiddenCondition =
        document.createElement(
            "input"
        );

    hiddenCondition.type =
        "hidden";

    hiddenCondition.name =
        "tableCondition";

    hiddenCondition.id =
        "selectedTableCondition";

    reservationForm.appendChild(
        hiddenType
    );

    reservationForm.appendChild(
        hiddenCondition
    );

    tables.forEach(
        (table) => {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.className =
                "table-option";

            button.innerHTML = `
                <span class="table-option-name">
                    ${escapeHTML(
                        table.type
                    )}
                </span>

                <span class="table-option-condition">
                    ${escapeHTML(
                        table.condition
                    )}
                </span>
            `;

            button.addEventListener(
                "click",
                () => {

                    tableOptions
                        .querySelectorAll(
                            ".table-option"
                        )
                        .forEach(
                            (
                                option
                            ) => {

                                option
                                    .classList
                                    .remove(
                                        "active"
                                    );

                            }
                        );

                    button
                        .classList
                        .add(
                            "active"
                        );

                    hiddenType.value =
                        table.type;

                    hiddenCondition.value =
                        table.condition;

                }
            );

            tableOptions.appendChild(
                button
            );

        }
    );

}


/* =========================================================
   RESERVATION FORM
   ========================================================= */

if (reservationForm) {

    reservationForm.addEventListener(
        "submit",
        async (
            event
        ) => {

            event.preventDefault();

            if (reservationMessage) {

                reservationMessage.textContent =
                    "";

            }

            const tableTypeInput =
                document.getElementById(
                    "selectedTableType"
                );

            const tableConditionInput =
                document.getElementById(
                    "selectedTableCondition"
                );

            if (
                !tableTypeInput ||
                !tableTypeInput.value
            ) {

                if (reservationMessage) {

                    reservationMessage.textContent =
                        "Izaberi tip stola.";

                }

                const tableSelection =
                    document.getElementById(
                        "tableSelection"
                    );

                if (tableSelection) {

                    tableSelection
                        .scrollIntoView(
                            {
                                behavior:
                                    "smooth",

                                block:
                                    "center"
                            }
                        );

                }

                return;
            }

            const currentClub =
                selectedClub
                    ? selectedClub.value
                    : "";

            const currentDate =
                selectedDate
                    ? selectedDate.value
                    : "";

            if (
                !currentClub ||
                !currentDate
            ) {

                if (reservationMessage) {

                    reservationMessage.textContent =
                        "Izaberi datum i klub pre rezervacije.";

                }

                return;
            }

            const submitButton =
                reservationForm.querySelector(
                    ".submit-button"
                );

            const originalButtonHTML =
                submitButton
                    ? submitButton.innerHTML
                    : "";

            const formData =
                new FormData(
                    reservationForm
                );

            const payload = {

                club:
                    currentClub,

                date:
                    currentDate,

                name:
                    String(
                        formData.get(
                            "name"
                        ) || ""
                    ).trim(),

                phone:
                    String(
                        formData.get(
                            "phone"
                        ) || ""
                    ).trim(),

                instagram:
                    String(
                        formData.get(
                            "instagram"
                        ) || ""
                    ).trim(),

                guests:
                    Number(
                        formData.get(
                            "guests"
                        )
                    ),

                tableType:
                    tableTypeInput.value,

                tableCondition:
                    tableConditionInput
                        ? tableConditionInput.value
                        : ""

            };

            if (
                !payload.name ||
                !payload.phone ||
                !payload.guests
            ) {

                if (reservationMessage) {

                    reservationMessage.textContent =
                        "Popuni sva obavezna polja.";

                }

                return;
            }

            if (
                payload.guests < 1 ||
                payload.guests > 30
            ) {

                if (reservationMessage) {

                    reservationMessage.textContent =
                        "Broj osoba mora biti između 1 i 30.";

                }

                return;
            }

            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.innerHTML = `
                    <span>
                        ŠALJEMO REZERVACIJU...
                    </span>

                    <span>
                        ···
                    </span>
                `;

            }

            if (reservationMessage) {

                reservationMessage.textContent =
                    "Rezervacija se šalje...";

            }

            try {

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

                if (reservationMessage) {

                    reservationMessage.textContent =
                        "Rezervacija je uspešno poslata. Kontaktiraćemo te radi potvrde.";

                }

                reservationForm.reset();

                if (selectedClub) {

                    selectedClub.value =
                        currentClub;

                }

                if (selectedDate) {

                    selectedDate.value =
                        currentDate;

                }

                if (eventDate) {

                    eventDate.value =
                        currentDate;

                }

                createTableSelection(
                    currentClub
                );

            } catch (error) {

                console.error(
                    "Greška pri rezervaciji:",
                    error
                );

                if (reservationMessage) {

                    reservationMessage.textContent =
                        error.message ||
                        "Došlo je do greške. Pokušaj ponovo.";

                }

            } finally {

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.innerHTML =
                        originalButtonHTML;

                }

            }

        }
    );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
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


/* =========================================================
   SPECIAL EVENTS
   ========================================================= */

const SPECIAL_EVENTS = {

    brucosijada: {

        name:
            "Fonomenalna Brucošijada",

        club:
            "Lasta",

        date:
            "04.10.2026"

    },

    makeitrain: {

        name:
            "Make It Rain",

        club:
            "XO Premium Nightclub",

        date:
            "10.10.2026"

    }

};


/* =========================================================
   SPECIAL EVENT WHATSAPP
   ========================================================= */

document
    .querySelectorAll(
        "[data-special-event]"
    )
    .forEach(
        (button) => {

            button.addEventListener(
                "click",
                (
                    event
                ) => {

                    const eventKey =
                        button.dataset
                            .specialEvent;

                    const specialEvent =
                        SPECIAL_EVENTS[
                            eventKey
                        ];

                    if (!specialEvent) {
                        return;
                    }

                    event.preventDefault();

                    const message =
                        `Zdravo, želim rezervaciju za ${specialEvent.name} — ${specialEvent.club}, ${specialEvent.date}.`;

                    const whatsappURL =
                        `https://wa.me/381641418710?text=${
                            encodeURIComponent(
                                message
                            )
                        }`;

                    window.open(
                        whatsappURL,
                        "_blank",
                        "noopener,noreferrer"
                    );

                }
            );

        }
    );


/* =========================================================
   BOTTOM BAR SCROLL BEHAVIOUR
   ========================================================= */

let lastScrollY =
    window.scrollY;

let scrollTimer =
    null;

if (bottomBar) {

    window.addEventListener(
        "scroll",
        () => {

            const currentScrollY =
                window.scrollY;

            const difference =
                currentScrollY -
                lastScrollY;

            if (
                currentScrollY <
                120
            ) {

                bottomBar
                    .classList
                    .remove(
                        "bottom-bar-hidden",
                        "bottom-bar-soft"
                    );

            } else if (
                difference > 8
            ) {

                bottomBar
                    .classList
                    .add(
                        "bottom-bar-soft"
                    );

            } else if (
                difference < -8
            ) {

                bottomBar
                    .classList
                    .remove(
                        "bottom-bar-hidden",
                        "bottom-bar-soft"
                    );

            }

            clearTimeout(
                scrollTimer
            );

            scrollTimer =
                setTimeout(
                    () => {

                        bottomBar
                            .classList
                            .remove(
                                "bottom-bar-soft"
                            );

                    },
                    650
                );

            lastScrollY =
                currentScrollY;

        },
        {
            passive:
                true
        }
    );

}


/* =========================================================
   INITIALIZE
   ========================================================= */

renderMainDates();
