import { collection, getDocs, doc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
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

        eventsSnapshot.forEach((eventDoc) => {
            const eventData = eventDoc.data();
            console.log("Event found:", eventData);

            const eventName = eventData.Name || "Unnamed Event";

            // Create and append event dynamically
            const listItem = document.createElement("li");
            listItem.innerHTML = `
                <a href="#" data-event-id="${eventDoc.id}">
                    <i class="bi bi-circle"></i> <span>${eventName}</span>
                </a>
            `;
            listItem.querySelector("a").addEventListener("click", async (e) => {
                e.preventDefault();
                await loadProducts(eventDoc.id);
            });

            eventList.appendChild(listItem);
        });

    } catch (error) {
        console.error("Error loading events:", error);
    }
}

async function loadProducts(eventId) {
    try {
        console.log(`Fetching products for event: ${eventId}`);

        const productsRef = collection(db, `Events/${eventId}/Products`);
        const productsSnapshot = await getDocs(productsRef);

        const tableBody = document.querySelector("#myTable tbody");
        tableBody.innerHTML = ""; // Clear existing products

        if (productsSnapshot.empty) {
            console.log("No products found for this event.");
            tableBody.innerHTML = "<tr><td colspan='3' style='text-align:center;'><i>No products available</i></td></tr>";
            return;
        }

        productsSnapshot.forEach((productDoc) => {
            const productData = productDoc.data();
            console.log("Product found:", productData);

            const description = productData.Description || "No description";
            const quantityRequired = productData.QuantityRequired || 0;

            // Create table row dynamically
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${description}</td>
                <td style="text-align: center;">${quantityRequired}</td>
                <td style="text-align: center;">
                    <button class="update-btn" data-product-id="${productDoc.id}" style="padding: 5px 20px; border-radius: 5px; border: 1px solid #010101; background-color: #070085; color: white; cursor: pointer;">
                        <i class="fas fa-edit"></i> Update
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading products:", error);
    }
}

// Attach event listener to fetch events when "Event Manage" is clicked
document.querySelector("[data-bs-target='#components-nav']").addEventListener("click", async () => {
    console.log("Event Manage clicked!");
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

