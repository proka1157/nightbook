let events = [];

const eventForm = document.getElementById("eventForm");
const adminEvents = document.getElementById("adminEvents");
const reservationsBody = document.getElementById("reservationsBody");

const editId = document.getElementById("editId");
const formTitle = document.getElementById("formTitle");
const cancelEdit = document.getElementById("cancelEdit");

async function loadAll() {
    await loadEvents();
    await loadReservations();
}

// =========================
// DOGAĐAJI
// =========================

async function loadEvents() {
    try {
        const response = await fetch("/api/events");

        if (!response.ok) {
            throw new Error("Greška pri učitavanju događaja.");
        }

        events = await response.json();

        renderEvents();
    } catch (error) {
        console.error(error);

        adminEvents.innerHTML = `
            <p style="color:#777;">
                Greška pri učitavanju događaja.
            </p>
        `;
    }
}

function renderEvents() {
    if (!events.length) {
        adminEvents.innerHTML = `
            <p style="color:#777;">
                Trenutno nema događaja.
            </p>
        `;
        return;
    }

    adminEvents.innerHTML = events.map((event) => {
        return `
            <div class="admin-event">

                <div>
                    <strong style="color:#ffb800;">
                        ${escapeHTML(event.club)}
                    </strong>

                    <h3>
                        ${escapeHTML(event.title)}
                    </h3>

                    <p>
                        ${formatDate(event.date)}
                        • ${escapeHTML(event.time || "-")}
                        • ${escapeHTML(event.dj || "-")}
                    </p>
                </div>

                <div class="event-actions">

                    <button
                        type="button"
                        class="edit-btn"
                        onclick="editEvent(${event.id})"
                    >
                        IZMENI
                    </button>

                    <button
                        type="button"
                        class="delete-btn"
                        onclick="deleteEvent(${event.id})"
                    >
                        OBRIŠI
                    </button>

                </div>

            </div>
        `;
    }).join("");
}

// =========================
// DODAJ / IZMENI DOGAĐAJ
// =========================

eventForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const currentEditId = editId.value;

    const data = {
        club: document.getElementById("club").value,
        date: document.getElementById("date").value,
        title: document.getElementById("title").value.trim(),
        dj: document.getElementById("dj").value.trim(),
        time: document.getElementById("time").value.trim(),
        price: document.getElementById("price").value.trim(),
        description:
            document.getElementById("description").value.trim(),
        image:
            document.getElementById("image").value.trim()
    };

    const url = currentEditId
        ? `/api/events/${currentEditId}`
        : "/api/events";

    const method = currentEditId
        ? "PUT"
        : "POST";

    try {
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "Greška pri čuvanju događaja."
            );
        }

        alert(
            currentEditId
                ? "Događaj je uspešno izmenjen."
                : "Događaj je uspešno dodat."
        );

        resetForm();

        await loadEvents();

    } catch (error) {
        console.error(error);

        alert("Došlo je do greške.");
    }
});

// =========================
// IZMENI
// =========================

function editEvent(id) {
    const event = events.find(
        (item) => item.id === id
    );

    if (!event) {
        return;
    }

    editId.value = event.id;

    document.getElementById("club").value =
        event.club || "";

    document.getElementById("date").value =
        event.date || "";

    document.getElementById("title").value =
        event.title || "";

    document.getElementById("dj").value =
        event.dj || "";

    document.getElementById("time").value =
        event.time || "";

    document.getElementById("price").value =
        event.price || "";

    document.getElementById("description").value =
        event.description || "";

    document.getElementById("image").value =
        event.image || "";

    formTitle.textContent = "Izmeni događaj";

    cancelEdit.style.display = "block";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// =========================
// OBRIŠI DOGAĐAJ
// =========================

async function deleteEvent(id) {
    const shouldDelete = confirm(
        "Da li sigurno želiš da obrišeš ovaj događaj?"
    );

    if (!shouldDelete) {
        return;
    }

    try {
        const response = await fetch(
            `/api/events/${id}`,
            {
                method: "DELETE"
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error("Brisanje nije uspelo.");
        }

        await loadEvents();

    } catch (error) {
        console.error(error);

        alert("Došlo je do greške pri brisanju.");
    }
}

// =========================
// RESET FORME
// =========================

function resetForm() {
    eventForm.reset();

    editId.value = "";

    formTitle.textContent =
        "Dodaj događaj";

    cancelEdit.style.display =
        "none";
}

cancelEdit.addEventListener(
    "click",
    resetForm
);

// =========================
// REZERVACIJE
// =========================

async function loadReservations() {
    try {
        const response = await fetch(
            "/api/reservations"
        );

        if (!response.ok) {
            throw new Error(
                "Greška pri učitavanju rezervacija."
            );
        }

        const reservations =
            await response.json();

        renderReservations(reservations);

    } catch (error) {
        console.error(error);

        reservationsBody.innerHTML = `
            <tr>
                <td colspan="9">
                    Greška pri učitavanju rezervacija.
                </td>
            </tr>
        `;
    }
}

function renderReservations(reservations) {
    if (!reservations.length) {
        reservationsBody.innerHTML = `
            <tr>
                <td colspan="9">
                    Trenutno nema rezervacija.
                </td>
            </tr>
        `;

        return;
    }

    reservationsBody.innerHTML =
        reservations.map((reservation) => {
            return `
                <tr>

                    <td>
                        ${escapeHTML(reservation.name)}
                    </td>

                    <td>
                        ${escapeHTML(reservation.club)}
                    </td>

                    <td>
                        ${formatDate(reservation.date)}
                    </td>

                    <td>
                        ${reservation.people}
                    </td>

                    <td>
                        ${escapeHTML(reservation.phone)}
                    </td>

                    <td>
                        ${escapeHTML(
                            reservation.instagram || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            reservation.note || "-"
                        )}
                    </td>

                    <td>
                        <span class="status">
                            ${escapeHTML(
                                reservation.status || "Nova"
                            )}
                        </span>
                    </td>

                    <td>
                        <button
                            type="button"
                            class="delete-btn"
                            onclick="deleteReservation(${reservation.id})"
                        >
                            OBRIŠI
                        </button>
                    </td>

                </tr>
            `;
        }).join("");
}

// =========================
// OBRIŠI REZERVACIJU
// =========================

async function deleteReservation(id) {
    const shouldDelete = confirm(
        "Da li želiš da obrišeš ovu rezervaciju?"
    );

    if (!shouldDelete) {
        return;
    }

    try {
        const response = await fetch(
            `/api/reservations/${id}`,
            {
                method: "DELETE"
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                "Brisanje rezervacije nije uspelo."
            );
        }

        await loadReservations();

    } catch (error) {
        console.error(error);

        alert(
            "Došlo je do greške pri brisanju."
        );
    }
}

// =========================
// POMOĆNE FUNKCIJE
// =========================

function formatDate(dateString) {
    if (!dateString) {
        return "-";
    }

    const date = new Date(
        `${dateString}T00:00:00`
    );

    return new Intl.DateTimeFormat(
        "sr-RS",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    ).format(date);
}

function escapeHTML(value) {
    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
}

// =========================
// START
// =========================

loadAll();