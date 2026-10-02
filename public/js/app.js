
(() => {
    "use strict";

    function initialize() {
        const byId = id => document.getElementById(id);

        const eventDate = byId("eventDate");
        const quickDates = byId("mainQuickDates");
        const otherDate = byId("otherDateButton");
        const customDate = byId("customDateWrapper");
        const cards = [...document.querySelectorAll(".club-card")];

        const programResult = byId("programResult");
        const programClub = byId("programClub");
        const programDate = byId("programDate");
        const programContent = byId("programContent");

        const reservationSection = byId("reservationSection");
        const form = byId("reservationForm");
        const message = byId("reservationMessage");
        const selectedClub = byId("selectedClub");
        const selectedDate = byId("selectedDate");

        const names = {
            lasta: "LASTA",
            freestyler: "FREESTYLER",
            remiks: "REMIKS",
            tranzit: "TRANZIT",
            bank: "THE BANK",
            hype: "HYPE",
            gradska: "GRADSKA KAFANA"
        };

        const days = [
            "NED", "PON", "UTO", "SRE", "ČET", "PET", "SUB"
        ];

        const months = [
            "JAN", "FEB", "MAR", "APR", "MAJ", "JUN",
            "JUL", "AVG", "SEP", "OKT", "NOV", "DEC"
        ];

        const state = {
            date: "",
            club: "",
            found: false,
            request: 0,
            controller: null,
            sending: false
        };

        let clubsConfig = null;

        // POMOĆNE FUNKCIJE

        function element(tag, className, text) {
            const node = document.createElement(tag);

            if (className) node.className = className;
            if (text !== undefined) node.textContent = text;

            return node;
        }

        function today() {
            const parts = new Intl.DateTimeFormat("en", {
                timeZone: "Europe/Belgrade",
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }).formatToParts(new Date());

            const get = type => parts.find(
                part => part.type === type
            ).value;

            return `${get("year")}-${get("month")}-${get("day")}`;
        }

        function validDate(value) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

            const date = new Date(`${value}T12:00:00Z`);

            return (
                Number.isFinite(date.getTime()) &&
                date.toISOString().slice(0, 10) === value
            );
        }

        function formatDate(value) {
            if (!validDate(value)) return "";

            return new Intl.DateTimeFormat("sr-Latn-RS", {
                timeZone: "Europe/Belgrade",
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric"
            }).format(new Date(`${value}T12:00:00Z`));
        }

        function scrollTo(node, block = "start") {
            if (!node) return;

            const reduced = window.matchMedia?.(
                "(prefers-reduced-motion: reduce)"
            ).matches;

            node.scrollIntoView({
                behavior: reduced ? "auto" : "smooth",
                block
            });
        }

        function setMessage(text) {
            if (message) message.textContent = text;
        }

        // API ZAHTEVI

        async function requestJSON(url, options = {}) {
            const controller = new AbortController();
            const abort = () => controller.abort();

            if (options.signal?.aborted) {
                controller.abort();
            } else {
                options.signal?.addEventListener(
                    "abort",
                    abort,
                    { once: true }
                );
            }

            const timeout = setTimeout(abort, 25000);

            try {
                const response = await fetch(url, {
                    ...options,

                    signal: controller.signal,

                    headers: {
                        Accept: "application/json",
                        ...options.headers
                    }
                });

                let data;

                try {
                    data = await response.json();
                } catch {
                    throw new Error(
                        "Server nije vratio ispravan odgovor. Pokušaj ponovo."
                    );
                }

                if (!response.ok) {
                    throw new Error(
                        data?.error ||
                        "Zahtev trenutno nije moguće izvršiti."
                    );
                }

                return data;
            } catch (error) {
                if (
                    controller.signal.aborted &&
                    !options.signal?.aborted
                ) {
                    throw new Error(
                        "Server trenutno ne odgovara. Pokušaj ponovo kasnije."
                    );
                }

                throw error;
            } finally {
                clearTimeout(timeout);

                options.signal?.removeEventListener(
                    "abort",
                    abort
                );
            }
        }

        // RESET IZBORA KLUBA I STOLA

        function removeTables() {
            [
                "tableSelection",
                "selectedTableType",
                "selectedTableCondition"
            ].forEach(id => byId(id)?.remove());
        }

        function clearClub() {
            state.controller?.abort();
            state.request += 1;
            state.club = "";
            state.found = false;

            cards.forEach(card => {
                card.classList.remove("active");
                card.setAttribute("aria-pressed", "false");
            });

            programResult?.classList.add("hidden");
            reservationSection?.classList.add("hidden");

            if (selectedClub) selectedClub.value = "";
            if (selectedDate) selectedDate.value = "";

            removeTables();
            setMessage("");
        }

        // IZBOR DATUMA

        function selectDate(value) {
            if (state.sending) return;

            if (!validDate(value) || value < today()) {
                alert(
                    "Možeš izabrati samo današnji ili budući datum."
                );

                if (eventDate) eventDate.value = state.date;
                return;
            }

            clearClub();
            state.date = value;

            if (eventDate) eventDate.value = value;

            document.querySelectorAll(
                ".main-date-button"
            ).forEach(button => {
                const active = button.dataset.date === value;

                button.classList.toggle("active", active);
                button.setAttribute(
                    "aria-pressed",
                    String(active)
                );
            });

            scrollTo(document.querySelector(".clubs-section"));
        }

        function renderDates() {
            if (eventDate) eventDate.min = today();
            if (!quickDates) return;

            quickDates.replaceChildren();

            const start = new Date(`${today()}T12:00:00Z`);

            for (let index = 0; index < 3; index += 1) {
                const date = new Date(start);
                date.setUTCDate(start.getUTCDate() + index);

                const value = date.toISOString().slice(0, 10);
                const button = element(
                    "button",
                    "main-date-button"
                );

                button.type = "button";
                button.dataset.date = value;

                button.setAttribute(
                    "aria-label",
                    formatDate(value)
                );

                button.setAttribute(
                    "aria-pressed",
                    String(value === state.date)
                );

                button.classList.toggle(
                    "active",
                    value === state.date
                );

                const dayLabel =
                    index === 0
                        ? "DANAS"
                        : index === 1
                            ? "SUTRA"
                            : days[date.getUTCDay()];

                button.append(
                    element(
                        "span",
                        "main-date-day",
                        dayLabel
                    ),

                    element(
                        "span",
                        "main-date-number",
                        String(date.getUTCDate()).padStart(2, "0")
                    ),

                    element(
                        "span",
                        "main-date-month",
                        months[date.getUTCMonth()]
                    )
                );

                button.addEventListener(
                    "click",
                    () => selectDate(value)
                );

                quickDates.append(button);
            }
        }

        otherDate?.addEventListener("click", () => {
            if (!customDate || state.sending) return;

            const open = customDate.classList.contains("hidden");

            customDate.classList.toggle("hidden", !open);
            otherDate.setAttribute("aria-expanded", String(open));

            if (open && eventDate) {
                eventDate.focus();

                try {
                    eventDate.showPicker?.();
                } catch {
                    // Ručni izbor datuma ostaje dostupan.
                }
            }
        });

        eventDate?.addEventListener("change", () => {
            if (eventDate.value) selectDate(eventDate.value);
        });

        // PRIKAZ PROGRAMA

        function programNotice(className, title, description) {
            const box = element("div", className);

            box.append(
                element("strong", "", title),
                element("p", "", description)
            );

            programContent.replaceChildren(box);
        }

        async function loadProgram(club, date) {
            if (
                !programResult ||
                !programContent ||
                !programClub ||
                !programDate
            ) {
                return;
            }

            const request = ++state.request;
            const controller = new AbortController();

            state.controller?.abort();
            state.controller = controller;

            programResult.classList.remove("hidden");
            programClub.textContent = names[club] || club.toUpperCase();
            programDate.textContent = formatDate(date);

            programContent.replaceChildren(
                element(
                    "div",
                    "program-loading",
                    "UČITAVANJE PROGRAMA..."
                )
            );

            programContent.setAttribute("aria-busy", "true");
            scrollTo(programResult, "center");

            try {
                const data = await requestJSON(
                    `/api/program?club=${encodeURIComponent(club)}&date=${encodeURIComponent(date)}`,
                    { signal: controller.signal }
                );

                if (request !== state.request) return;

                if (!data?.found || !data.program) {
                    programNotice(
                        "program-empty",
                        "PROGRAM JOŠ NIJE OBJAVLJEN",
                        "Program za ovaj datum još uvek nije dostupan. Proveri ponovo uskoro."
                    );

                    return;
                }

                state.found = true;

                if (selectedClub) selectedClub.value = club;
                if (selectedDate) selectedDate.value = date;

                const event = element("div", "program-event");

                const button = element(
                    "button",
                    "reserve-table-button",
                    "REZERVIŠI STO"
                );

                button.type = "button";
                button.id = "openReservationButton";

                button.addEventListener("click", async () => {
                    button.disabled = true;

                    try {
                        await showReservation(club, date);
                    } finally {
                        button.disabled = false;
                    }
                });

                event.append(
                    element(
                        "div",
                        "program-event-copy",
                        String(data.program)
                    ),
                    button
                );

                programContent.replaceChildren(event);
            } catch (error) {
                if (
                    request !== state.request ||
                    controller.signal.aborted
                ) {
                    return;
                }

                programNotice(
                    "program-error",
                    "PROGRAM TRENUTNO NIJE DOSTUPAN",
                    error.message
                );

                const retry = element(
                    "button",
                    "reserve-table-button",
                    "POKUŠAJ PONOVO"
                );

                retry.type = "button";

                retry.addEventListener(
                    "click",
                    () => loadProgram(club, date)
                );

                programContent.append(retry);
            } finally {
                if (request === state.request) {
                    programContent.setAttribute(
                        "aria-busy",
                        "false"
                    );
                }
            }
        }

        // IZBOR KLUBA

        cards.forEach(card => {
            card.setAttribute("aria-pressed", "false");

            card.addEventListener("click", () => {
                if (state.sending) return;

                const date = eventDate?.value || state.date;

                if (!validDate(date) || date < today()) {
                    alert("Prvo izaberi datum izlaska.");
                    scrollTo(document.querySelector(".date-section"));
                    return;
                }

                const club = card.dataset.club;

                if (!Object.hasOwn(names, club)) return;

                clearClub();

                state.date = date;
                state.club = club;

                card.classList.add("active");
                card.setAttribute("aria-pressed", "true");

                loadProgram(club, date);
            });
        });

        // IZBOR STOLA

        function createTables(tables) {
            removeTables();

            const group = byId("guests")?.closest(".form-group");

            if (!form || !group) return;

            const wrapper = element("div", "");
            wrapper.id = "tableSelection";

            const options = element("div", "table-options");
            options.id = "tableOptions";
            options.setAttribute("role", "group");
            options.setAttribute("aria-label", "Izaberi tip stola");

            wrapper.append(
                element(
                    "div",
                    "table-selection-title",
                    "IZABERI TIP STOLA"
                ),
                options
            );

            group.insertAdjacentElement("afterend", wrapper);

            const typeInput = element("input", "");
            typeInput.type = "hidden";
            typeInput.id = "selectedTableType";
            typeInput.name = "tableType";

            const conditionInput = element("input", "");
            conditionInput.type = "hidden";
            conditionInput.id = "selectedTableCondition";
            conditionInput.name = "tableCondition";

            form.append(typeInput, conditionInput);

            tables.forEach(table => {
                const button = element("button", "table-option");

                button.type = "button";
                button.setAttribute("aria-pressed", "false");

                button.append(
                    element(
                        "span",
                        "table-option-name",
                        table.type
                    ),

                    element(
                        "span",
                        "table-option-condition",
                        table.condition
                    )
                );

                button.addEventListener("click", () => {
                    options.querySelectorAll(
                        "button"
                    ).forEach(option => {
                        option.classList.remove("active");
                        option.setAttribute(
                            "aria-pressed",
                            "false"
                        );
                    });

                    button.classList.add("active");
                    button.setAttribute("aria-pressed", "true");

                    typeInput.value = table.type;
                    conditionInput.value = table.condition;
                });

                options.append(button);
            });
        }

        // OTVARANJE FORME

        async function showReservation(club, date) {
            if (!reservationSection || !form) return;

            const request = state.request;

            const current = () => (
                state.request === request &&
                state.club === club &&
                state.date === date &&
                state.found
            );

            if (!current()) return;

            try {
                if (!clubsConfig) {
                    clubsConfig = await requestJSON("/api/clubs");
                }

                if (!current()) return;

                const tables = clubsConfig?.[club]?.tables;

                if (!Array.isArray(tables) || !tables.length) {
                    throw new Error(
                        "Uslovi za rezervaciju trenutno nisu dostupni."
                    );
                }

                selectedClub.value = club;
                selectedDate.value = date;

                createTables(tables);
                setMessage("");

                reservationSection.classList.remove("hidden");
                scrollTo(reservationSection);
            } catch (error) {
                if (!current()) return;

                clubsConfig = null;
                reservationSection.classList.remove("hidden");

                setMessage(error.message);
                scrollTo(reservationSection);
            }
        }

        // SPREČAVANJE DVOSTRUKOG SLANJA

        function setSending(value) {
            state.sending = value;

            const controls = [
                ...cards,

                ...document.querySelectorAll(
                    ".main-date-button"
                ),

                otherDate,
                eventDate,

                ...form.querySelectorAll(
                    "input:not([type='hidden']), button"
                )
            ];

            controls.filter(Boolean).forEach(control => {
                control.disabled = value;
            });

            form.setAttribute("aria-busy", String(value));
        }

        // SLANJE REZERVACIJE

        form?.addEventListener("submit", async event => {
            event.preventDefault();

            if (state.sending) return;

            setMessage("");

            if (!form.reportValidity()) return;

            const club = selectedClub?.value;
            const date = selectedDate?.value;

            if (
                !state.found ||
                club !== state.club ||
                date !== state.date ||
                !validDate(date) ||
                date < today()
            ) {
                setMessage(
                    "Izaberi datum i klub pre rezervacije."
                );
                return;
            }

            const tableType = byId("selectedTableType")?.value;

            const table = clubsConfig?.[club]?.tables?.find(
                item => item.type === tableType
            );

            if (!table) {
                setMessage("Izaberi tip stola.");
                scrollTo(byId("tableSelection"), "center");
                return;
            }

            const data = new FormData(form);

            const payload = {
                club,
                date,

                name: String(
                    data.get("name") || ""
                ).trim(),

                phone: String(
                    data.get("phone") || ""
                ).trim(),

                instagram: String(
                    data.get("instagram") || ""
                ).trim(),

                guests: Number(data.get("guests")),

                tableType: table.type,
                tableCondition: table.condition
            };

            if (
                payload.name.length < 2 ||
                !payload.phone
            ) {
                setMessage("Popuni ime i broj telefona.");
                return;
            }

            if (
                !Number.isInteger(payload.guests) ||
                payload.guests < 1 ||
                payload.guests > 30
            ) {
                setMessage(
                    "Broj osoba mora biti između 1 i 30."
                );
                return;
            }

            const submit = form.querySelector(".submit-button");

            const originalText =
                submit?.textContent.trim() ||
                "POŠALJI REZERVACIJU";

            setSending(true);

            if (submit) {
                submit.textContent = "ŠALJEMO REZERVACIJU...";
            }

            setMessage("Rezervacija se šalje...");

            try {
                const result = await requestJSON(
                    "/api/reservations",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify(payload)
                    }
                );

                if (!result?.success) {
                    throw new Error(
                        "Rezervacija nije potvrđena kao sačuvana."
                    );
                }

                form.reset();

                selectedClub.value = club;
                selectedDate.value = date;

                if (eventDate) eventDate.value = date;

                createTables(clubsConfig[club].tables);

                setMessage(
                    "Rezervacija je uspešno poslata. Kontaktiraćemo te radi potvrde."
                );
            } catch (error) {
                setMessage(
                    error.message ||
                    "Došlo je do greške. Pokušaj ponovo."
                );
            } finally {
                setSending(false);

                if (submit) {
                    submit.textContent = originalText;
                }
            }
        });

        // IZDVOJENI DOGAĐAJI — WHATSAPP

        const specialEvents = {
            brucosijada: {
                name: "Fonomenalna Brucošijada",
                club: "Lasta",
                date: "04.10.2026"
            },

            makeitrain: {
                name: "Make It Rain",
                club: "XO Premium Nightclub",
                date: "10.10.2026"
            }
        };

        document.querySelectorAll(
            "[data-special-event]"
        ).forEach(link => {
            const event = specialEvents[
                link.dataset.specialEvent
            ];

            if (!event) return;

            const text =
                `Zdravo, želim rezervaciju za ${event.name} — ` +
                `${event.club}, ${event.date}.`;

            link.href =
                `https://wa.me/381641418710?text=` +
                encodeURIComponent(text);

            link.target = "_blank";
            link.rel = "noopener noreferrer";
        });

        // DONJA KONTAKT TRAKA OSTAJE VIDLJIVA

        const bottomBar = document.querySelector(
            ".mobile-bottom-bar"
        );

        bottomBar?.classList.remove(
            "bottom-bar-hidden",
            "bottom-bar-soft"
        );

        otherDate?.setAttribute(
            "aria-expanded",
            String(
                customDate
                    ? !customDate.classList.contains("hidden")
                    : false
            )
        );

        // INICIJALIZACIJA DATUMA

        renderDates();

        window.addEventListener("focus", () => {
            if (state.sending) return;

            if (state.date && state.date < today()) {
                clearClub();
                state.date = "";

                if (eventDate) eventDate.value = "";
            }

            renderDates();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            { once: true }
        );
    } else {
        initialize();
    }
})();
