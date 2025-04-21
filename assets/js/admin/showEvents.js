import { collection, getDocs, Timestamp, setDoc, doc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { db } from "../firebase-config.js"; 

// Get modal and buttons
const addEventModal = document.getElementById("addEventModal");
const addEventBtn = document.getElementById("addEventBtn");
const closeModal = document.getElementById("closeModal");
const saveEvent = document.getElementById("saveEvent");

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("addProductBtn").style.display = "none";
});


async function populateEventTable() {
    try {
        console.log("Fetching events...");

        document.querySelector(".table-container").style.display = "block";
        const tableBody = document.querySelector("#myTable tbody");

        if (!tableBody) {
            console.error("Table not found in the DOM!");
            return;
        }

        tableBody.innerHTML = ""; 

        const eventsRef = collection(db, "Events");
        const eventsSnapshot = await getDocs(eventsRef);

        if (eventsSnapshot.empty) {
            console.log("No events found.");
            tableBody.innerHTML = "<tr><td colspan='4' style='text-align:center;'><i>No events available</i></td></tr>";
            return;
        }

        eventsSnapshot.forEach((eventDoc) => {
            const eventData = eventDoc.data();
            const eventName = eventData.Name || "Unnamed Event";
            const startTime = eventData.StartTime?.toDate().toISOString().slice(0, 16) || "";
            const endTime = eventData.EndTime?.toDate().toISOString().slice(0, 16) || "";

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${eventName}</td>
                <td style="text-align: center;">${new Date(startTime).toLocaleString()}</td>
                <td style="text-align: center;">${new Date(endTime).toLocaleString()}</td>
                <td style="text-align: center;">
                    <button class="edit-event-btn" data-event-id="${eventDoc.id}" 
                            data-event-name="${eventName}" data-start-time="${startTime}" 
                            data-end-time="${endTime}" 
                            style="padding: 5px 15px; border-radius: 5px; border: 1px solid #010101; 
                                   background-color: #007bff; color: white; cursor: pointer;">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </td>
            `;

            row.querySelector(".edit-event-btn").addEventListener("click", (e) => {
                openEditModal(e.target);
            });

            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading events:", error);
    }
}


// Call function to populate event table on page load
document.addEventListener("DOMContentLoaded", populateEventTable);

// Show modal when "+ Add Event" button is clicked
addEventBtn.addEventListener("click", () => {
    addEventModal.style.display = "flex";
});

// Close modal when "Close" button is clicked
closeModal.addEventListener("click", () => {
    addEventModal.style.display = "none";
});

// Save event to Firestore when "Save" button is clicked
saveEvent.addEventListener("click", async () => {
    const eventName = document.getElementById("eventName").value.trim();
    const startTime = document.getElementById("startTime").value;
    const endTime = document.getElementById("endTime").value;

    if (!eventName || !startTime || !endTime) {
        alert("Please fill in all fields.");
        return;
    }

    // Convert Event Name to a valid Firestore ID (replace spaces & special characters)
    const eventId = eventName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");

    try {
        // Convert input times to Firestore Timestamp
        const startTimestamp = Timestamp.fromDate(new Date(startTime));
        const endTimestamp = Timestamp.fromDate(new Date(endTime));

        // Set document with eventId as the document ID
        await setDoc(doc(db, "Events", eventId), {
            Name: eventName,
            StartTime: startTimestamp,
            EndTime: endTimestamp
        });

        const productsRef = collection(eventRef, "Products");

        alert(`Event "${eventName}" added successfully with ID "${eventId}"`);

        // Close modal & refresh event table
        addEventModal.style.display = "none";
        populateEventTable();

    } catch (error) {
        console.error("Error adding event:", error);
        alert("Failed to add event.");
    }
});

// Function to Open Edit Modal
function openEditModal(button) {
    const eventId = button.getAttribute("data-event-id");
    const eventName = button.getAttribute("data-event-name");
    const startTime = button.getAttribute("data-start-time");
    const endTime = button.getAttribute("data-end-time");

    document.getElementById("editEventName").value = eventName;
    document.getElementById("editStartTime").value = startTime;
    document.getElementById("editEndTime").value = endTime;

    document.getElementById("updateEvent").setAttribute("data-event-id", eventId);

    document.getElementById("editEventModal").style.display = "flex";
}

// Function to Update Event
document.getElementById("updateEvent").addEventListener("click", async () => {
    const eventId = document.getElementById("updateEvent").getAttribute("data-event-id");
    const updatedName = document.getElementById("editEventName").value.trim();
    const updatedStartTime = document.getElementById("editStartTime").value;
    const updatedEndTime = document.getElementById("editEndTime").value;

    if (!updatedName || !updatedStartTime || !updatedEndTime) {
        alert("Please fill in all fields.");
        return;
    }

    const updatedEventId = updatedName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");

    try {
        const eventRef = doc(db, "Events", eventId);
        const newEventRef = doc(db, "Events", updatedEventId);

        // Get existing event data
        const eventSnap = await getDoc(eventRef);
        if (!eventSnap.exists()) {
            alert("Event not found.");
            return;
        }

        const eventData = eventSnap.data();

        // Check if a document with the new name already exists
        const newEventSnap = await getDoc(newEventRef);
        if (newEventSnap.exists() && updatedEventId !== eventId) {
            alert("An event with this name already exists. Please choose a different name.");
            return;
        }

        // Create new document with updated ID
        await setDoc(newEventRef, {
            Name: updatedName,
            StartTime: Timestamp.fromDate(new Date(updatedStartTime)),
            EndTime: Timestamp.fromDate(new Date(updatedEndTime))
        });

        // Delete the old document if the name was changed
        if (eventId !== updatedEventId) {
            await deleteDoc(eventRef);
        }

        alert(`Event "${updatedName}" updated successfully!`);

        document.getElementById("editEventModal").style.display = "none";
        populateEventTable(); // Refresh table

    } catch (error) {
        console.error("Error updating event:", error);
        alert("Failed to update event.");
    }
});

// Close Edit Modal
document.getElementById("closeEditModal").addEventListener("click", () => {
    document.getElementById("editEventModal").style.display = "none";
});

let selectedEventIdToDelete = null;

document.getElementById("deleteEvent").addEventListener("click", () => {
    const eventId = document.getElementById("updateEvent").getAttribute("data-event-id");
    selectedEventIdToDelete = eventId;

    const modal = new bootstrap.Modal(document.getElementById("confirmDeleteProductModal"));
    modal.show();
});

document.getElementById("confirmDeleteProductBtn").addEventListener("click", async () => {
    if (!selectedEventIdToDelete) return;

    try {
        await deleteDoc(doc(db, "Events", selectedEventIdToDelete));
        
        selectedEventIdToDelete = null;
        const confirmModal = bootstrap.Modal.getInstance(document.getElementById("confirmDeleteProductModal"));
        confirmModal.hide();

        document.getElementById("editEventModal").style.display = "none";

        populateEventTable();
    } catch (error) {
        console.error("Error deleting event:", error);
        alert("Failed to delete event.");
    }
});
