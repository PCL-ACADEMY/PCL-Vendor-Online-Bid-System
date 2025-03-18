import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { db } from "./assets/js/firebase-config.js"; // Ensure Firebase is properly configured

async function loadEvents() {
    try {
        console.log("Fetching events from Firestore...");

        const eventsRef = collection(db, "Events");
        const eventsSnapshot = await getDocs(eventsRef);

        const eventList = document.getElementById("event-list");
        eventList.innerHTML = ""; // Clear existing events

        if (eventsSnapshot.empty) {
            console.log("No events found in Firestore.");
            eventList.innerHTML = "<li><i>No events available</i></li>";
            return;
        }

        eventsSnapshot.forEach((doc) => {
            const eventData = doc.data();
            console.log("Event found:", eventData);

            const eventName = eventData.Name || "Unnamed Event";

            // Create and append event dynamically
            const listItem = document.createElement("li");
            listItem.innerHTML = `
                <a href="events.html?eventId=${doc.id}">
                    <i class="bi bi-circle"></i> <span>${eventName}</span>
                </a>
            `;
            eventList.appendChild(listItem);
        });

    } catch (error) {
        console.error("Error loading events:", error);
    }
}


// Attach event listener to fetch events when "Event Manage" is clicked
document.querySelector("[data-bs-target='#components-nav']").addEventListener("click", async () => {
    console.log("Event Manage clicked!"); // Debugging: check if function is triggered
    await loadEvents();
});

async function loadBiddingRecords() {
    try {
        console.log("Fetching events for Bidding Records...");

        const eventsRef = collection(db, "Events");
        const eventsSnapshot = await getDocs(eventsRef);

        const biddingList = document.getElementById("bidding-records-list"); // Target `<ul>` where events will be displayed
        biddingList.innerHTML = ""; // Clear existing events

        if (eventsSnapshot.empty) {
            console.log("No events found in Firestore.");
            biddingList.innerHTML = "<li><i>No bidding records available</i></li>";
            return;
        }

        eventsSnapshot.forEach((doc) => {
            const eventData = doc.data();
            console.log("Event found:", eventData);

            const eventName = eventData.Name || "Unnamed Event";

            // Create and append event dynamically
            const listItem = document.createElement("li");
            listItem.innerHTML = `
                <a href="eventrecord.html?eventId=${doc.id}">
                    <i class="bi bi-circle"></i> <span>${eventName}</span>
                </a>
            `;
            biddingList.appendChild(listItem);
        });

    } catch (error) {
        console.error("Error loading bidding records:", error);
    }
}

// Attach event listener to fetch events when "Bidding Records" is clicked
document.querySelector("[data-bs-target='#forms-nav']").addEventListener("click", loadBiddingRecords);

