(() => {
    "use strict";

    const $ = selector => document.querySelector(selector);
    const $$ = selector => [...document.querySelectorAll(selector)];

    const cards = $$(".club-card");
    const weekendResult = $("#weekendResult");
    const weekendClub = $("#weekendClub");
    const weekendDates = $("#weekendDates");
    const weekendEvents = $("#weekendEvents");
    const weekendCover = $("#weekendCover");
    const weekendCoverFallback = $("#weekendCoverFallback");
    const weekendSummaryText = $("#weekendSummaryText");
    const closeWeekend = $("#closeWeekend");

    const reservationSection = $("#reservationSection");
    const form = $("#reservationForm");
    const message = $("#reservationMessage");
    const selectedClub = $("#selectedClub");
    const selectedDate = $("#selectedDate");
    const selectedProgram = $("#selectedProgram");
    const selectedTableType = $("#selectedTableType");
    const selectedTableCondition = $("#selectedTableCondition");
    const tableSelection = $("#tableSelection");
    const tableOptions = $("#tableOptions");

    const reservationEventDay = $("#reservationEventDay");
    const reservationEventProgram = $("#reservationEventProgram");
    const reservationEventMeta = $("#reservationEventMeta");

    const names = {
        lasta: "LASTA",
        freestyler: "FREESTYLER",
        remiks: "REMIKS",
        tranzit: "TRANZIT",
        bank: "THE BANK",
        hype: "HYPE",
        gradska: "GRADSKA KAFANA"
    };

    const dayShort = ["NED", "PON", "UTO", "SRE", "ČET", "PET", "SUB"];

    const state = {
        club: "",
        date: "",
        program: "",
        weekendRequest: 0,
        controller: null,
        sending: false
    };

    let clubsConfig = null;

    function create(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function validDate(value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
        const date = new Date(`${value}T12:00:00Z`);
        return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }

    function dateObject(value) {
        return validDate(value) ? new Date(`${value}T12:00:00Z`) : null;
    }

    function formatDate(value, options = {}) {
        const date = dateObject(value);
        if (!date) return "";

        return new Intl.DateTimeFormat("sr-Latn-RS", {
            timeZone: "Europe/Belgrade",
            day: "2-digit",
            month: options.longMonth ? "long" : "2-digit",
            year: "numeric",
            ...(options.weekday ? { weekday: "long" } : {})
        }).format(date);
    }

    function shortDate(value) {
        const date = dateObject(value);
        if (!date) return "";
        const day = String(date.getUTCDate()).padStart(2, "0");
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        return `${day}.${month}.${date.getUTCFullYear()}.`;
    }

    function weekdayLabel(value) {
        const date = dateObject(value);
        return date ? dayShort[date.getUTCDay()] : "";
    }

    function scrollToNode(node, block = "start") {
        if (!node) return;
        const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        node.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block });
    }

    function setMessage(text = "", type = "") {
        if (!message) return;
        message.textContent = text;
        message.classList.remove("success", "error");
        if (type) message.classList.add(type);
    }

    async function requestJSON(url, options = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);
        const externalSignal = options.signal;
        const abortFromExternal = () => controller.abort();

        if (externalSignal?.aborted) {
            controller.abort();
        } else {
            externalSignal?.addEventListener("abort", abortFromExternal, { once: true });
        }

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
                throw new Error("Server nije vratio ispravan odgovor.");
            }

            if (!response.ok) {
                throw new Error(data?.error || "Zahtev trenutno nije moguće izvršiti.");
            }

            return data;
        } catch (error) {
            if (controller.signal.aborted && !externalSignal?.aborted) {
                throw new Error("Server trenutno ne odgovara. Pokušaj ponovo.");
            }
            throw error;
        } finally {
            clearTimeout(timeout);
            externalSignal?.removeEventListener("abort", abortFromExternal);
        }
    }

    function activateCard(club) {
        cards.forEach(card => {
            const active = card.dataset.club === club;
            card.classList.toggle("active", active);
            card.setAttribute("aria-pressed", String(active));
        });
    }

    function resetReservation() {
        reservationSection?.classList.add("hidden");
        state.date = "";
        state.program = "";

        if (selectedClub) selectedClub.value = "";
        if (selectedDate) selectedDate.value = "";
        if (selectedProgram) selectedProgram.value = "";
        if (selectedTableType) selectedTableType.value = "";
        if (selectedTableCondition) selectedTableCondition.value = "";

        tableOptions?.replaceChildren();
        tableSelection?.classList.add("hidden");
        setMessage();
    }

    function showCover(image, club) {
        if (!weekendCover || !weekendCoverFallback) return;

        weekendCover.classList.add("hidden");
        weekendCover.removeAttribute("src");
        weekendCover.alt = "";
        weekendCoverFallback.classList.remove("hidden");

        if (!image) return;

        weekendCover.onload = () => {
            weekendCoverFallback.classList.add("hidden");
            weekendCover.classList.remove("hidden");
        };

        weekendCover.onerror = () => {
            weekendCover.classList.add("hidden");
            weekendCover.removeAttribute("src");
            weekendCoverFallback.classList.remove("hidden");
        };

        weekendCover.alt = `${names[club] || club} — fotografija kluba`;
        weekendCover.src = image;
    }

    function renderLoading(club) {
        weekendResult?.classList.remove("hidden");
        weekendResult?.setAttribute("aria-busy", "true");
        if (weekendClub) weekendClub.textContent = names[club] || club.toUpperCase();
        if (weekendDates) weekendDates.textContent = "TRAŽIMO NAJBLIŽI VIKEND";
        if (weekendSummaryText) {
            weekendSummaryText.textContent = "Učitavamo aktuelni program direktno sa Beograd Noću.";
        }

        showCover("", club);

        const box = create("div", "weekend-loading");
        box.append(
            create("div", "weekend-loading-ring"),
            create("strong", "", "UČITAVAMO PROGRAM"),
            create("p", "", "Proveravamo petak, subotu i nedelju za izabrani klub.")
        );
        weekendEvents?.replaceChildren(box);
    }

    function renderEmpty(data, club) {
        const box = create("div", "weekend-empty");
        box.append(
            create("strong", "", "PROGRAM JOŠ NIJE OBJAVLJEN"),
            create(
                "p",
                "",
                "Za najbliži vikend trenutno nema objavljenog programa. Čim Beograd Noću objavi događaj, pojaviće se ovde."
            )
        );
        weekendEvents?.replaceChildren(box);

        if (weekendDates) {
            weekendDates.textContent = data?.windowLabel || "SLEDEĆI VIKEND";
        }
        if (weekendSummaryText) {
            weekendSummaryText.textContent = "Program za ovaj vikend još nije dostupan na izvoru.";
        }
        showCover(data?.clubImage || "", club);
    }

    function createEventArt(event, fallbackImage) {
        const imageUrl = event?.image || fallbackImage;
        if (!imageUrl) return null;

        const wrap = create("div", "event-art");
        const img = document.createElement("img");
        img.alt = "";
        img.loading = "lazy";
        img.decoding = "async";
        img.referrerPolicy = "no-referrer";
        img.src = imageUrl;
        img.addEventListener("error", () => wrap.remove(), { once: true });
        wrap.append(img);
        return wrap;
    }

    function renderEvents(data, club) {
        const events = Array.isArray(data?.events) ? data.events : [];

        if (weekendClub) weekendClub.textContent = data?.club || names[club] || club.toUpperCase();
        if (weekendDates) weekendDates.textContent = data?.windowLabel || "SLEDEĆI VIKEND";
        if (weekendSummaryText) {
            weekendSummaryText.textContent = events.length
                ? `${events.length} ${events.length === 1 ? "događaj" : "događaja"} za najbliži vikend. Izaberi žurku i nastavi na rezervaciju.`
                : "Program za ovaj vikend još nije dostupan na izvoru.";
        }

        const cover = data?.clubImage || events.find(event => event.image)?.image || "";
        showCover(cover, club);

        if (!events.length) {
            renderEmpty(data, club);
            return;
        }

        const fragment = document.createDocumentFragment();

        events.forEach((event, index) => {
            const card = create("article", "event-card");
            const art = createEventArt(event, cover);
            if (art) card.append(art);

            const dayRow = create("div", "event-day-row");
            const day = create("div", "event-day");
            day.append(
                create("strong", "", weekdayLabel(event.date)),
                create("span", "", shortDate(event.date))
            );
            dayRow.append(day, create("span", "event-index", String(index + 1).padStart(2, "0")));

            const title = document.createElement("h4");
            title.textContent = event.program || "Program";

            const footer = create("div", "event-card-footer");
            const button = create("button", "reserve-event-button");
            button.type = "button";
            button.append(
                create("span", "", "REZERVIŠI STO"),
                create("span", "", "↗")
            );
            button.addEventListener("click", () => openReservation(club, event));
            footer.append(button);

            card.append(dayRow, title, footer);
            fragment.append(card);
        });

        weekendEvents?.replaceChildren(fragment);
    }

    function renderError(error, club) {
        const box = create("div", "weekend-error");
        const retry = create("button", "retry-button", "POKUŠAJ PONOVO");
        retry.type = "button";
        retry.addEventListener("click", () => loadWeekend(club));

        box.append(
            create("strong", "", "PROGRAM TRENUTNO NIJE DOSTUPAN"),
            create("p", "", error?.message || "Pokušaj ponovo za nekoliko trenutaka."),
            retry
        );
        weekendEvents?.replaceChildren(box);
    }

    async function loadWeekend(club) {
        if (!Object.hasOwn(names, club) || state.sending) return;

        const request = ++state.weekendRequest;
        const controller = new AbortController();
        state.controller?.abort();
        state.controller = controller;
        state.club = club;

        resetReservation();
        state.club = club;
        activateCard(club);
        renderLoading(club);
        scrollToNode(weekendResult, "start");

        try {
            const data = await requestJSON(
                `/api/weekend?club=${encodeURIComponent(club)}`,
                { signal: controller.signal }
            );

            if (request !== state.weekendRequest) return;
            renderEvents(data, club);
        } catch (error) {
            if (request !== state.weekendRequest || controller.signal.aborted) return;
            renderError(error, club);
        } finally {
            if (request === state.weekendRequest) {
                weekendResult?.setAttribute("aria-busy", "false");
            }
        }
    }

    cards.forEach(card => {
        card.addEventListener("click", () => loadWeekend(card.dataset.club));
    });

    closeWeekend?.addEventListener("click", () => {
        state.controller?.abort();
        state.weekendRequest += 1;
        state.club = "";
        resetReservation();
        activateCard("");
        weekendResult?.classList.add("hidden");
        scrollToNode($("#clubs"), "start");
    });

    async function loadClubsConfig() {
        if (clubsConfig) return clubsConfig;
        clubsConfig = await requestJSON("/api/clubs");
        return clubsConfig;
    }

    function renderTables(tables) {
        if (!tableSelection || !tableOptions) return;

        tableOptions.replaceChildren();
        tableSelection.classList.remove("hidden");

        if (selectedTableType) selectedTableType.value = "";
        if (selectedTableCondition) selectedTableCondition.value = "";

        (Array.isArray(tables) ? tables : []).forEach(table => {
            const button = create("button", "table-option");
            button.type = "button";
            button.setAttribute("aria-pressed", "false");

            button.append(
                create("span", "table-option-name", table.type),
                create("span", "table-option-condition", table.condition)
            );

            button.addEventListener("click", () => {
                $$(".table-option").forEach(option => {
                    option.classList.remove("active");
                    option.setAttribute("aria-pressed", "false");
                });

                button.classList.add("active");
                button.setAttribute("aria-pressed", "true");
                if (selectedTableType) selectedTableType.value = table.type;
                if (selectedTableCondition) selectedTableCondition.value = table.condition;
                setMessage();
            });

            tableOptions.append(button);
        });
    }

    async function openReservation(club, event) {
        if (!Object.hasOwn(names, club) || !validDate(event?.date) || !event?.program) return;

        state.club = club;
        state.date = event.date;
        state.program = String(event.program);

        if (selectedClub) selectedClub.value = club;
        if (selectedDate) selectedDate.value = event.date;
        if (selectedProgram) selectedProgram.value = state.program;

        if (reservationEventDay) reservationEventDay.textContent = weekdayLabel(event.date);
        if (reservationEventProgram) reservationEventProgram.textContent = state.program;
        if (reservationEventMeta) {
            reservationEventMeta.textContent = `${names[club]} · ${formatDate(event.date, { weekday: true, longMonth: true })}`;
        }

        setMessage("Učitavamo uslove rezervacije...");
        reservationSection?.classList.remove("hidden");
        scrollToNode(reservationSection, "start");

        try {
            const config = await loadClubsConfig();
            const tables = config?.[club]?.tables;

            if (!Array.isArray(tables) || !tables.length) {
                throw new Error("Uslovi za ovaj klub trenutno nisu dostupni.");
            }

            renderTables(tables);
            setMessage();
        } catch (error) {
            tableSelection?.classList.add("hidden");
            setMessage(error.message, "error");
        }
    }

    form?.addEventListener("submit", async event => {
        event.preventDefault();
        if (state.sending) return;

        if (!state.club || !state.date || !state.program) {
            setMessage("Prvo izaberi klub i događaj.", "error");
            return;
        }

        if (!selectedTableType?.value) {
            setMessage("Izaberi tip stola.", "error");
            tableSelection?.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }

        const submit = form.querySelector('button[type="submit"]');
        const payload = Object.fromEntries(new FormData(form).entries());
        payload.guests = Number(payload.guests);

        state.sending = true;
        if (submit) submit.disabled = true;
        setMessage("Šaljemo zahtev...");

        try {
            await requestJSON("/api/reservations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            setMessage(
                "Rezervacija je poslata. NightBook tim će ti potvrditi sto čim obradi zahtev.",
                "success"
            );

            const keep = {
                club: state.club,
                date: state.date,
                program: state.program
            };

            form.reset();
            if ($("#guests")) $("#guests").value = "2";
            if (selectedClub) selectedClub.value = keep.club;
            if (selectedDate) selectedDate.value = keep.date;
            if (selectedProgram) selectedProgram.value = keep.program;
            if (selectedTableType) selectedTableType.value = "";
            if (selectedTableCondition) selectedTableCondition.value = "";
            $$(".table-option").forEach(option => {
                option.classList.remove("active");
                option.setAttribute("aria-pressed", "false");
            });
        } catch (error) {
            setMessage(error.message || "Rezervacija nije poslata. Pokušaj ponovo.", "error");
        } finally {
            state.sending = false;
            if (submit) submit.disabled = false;
        }
    });

    weekendCover?.addEventListener("error", () => {
        weekendCover.classList.add("hidden");
        weekendCoverFallback?.classList.remove("hidden");
    });

    const year = $("#year");
    if (year) year.textContent = String(new Date().getFullYear());
})();
