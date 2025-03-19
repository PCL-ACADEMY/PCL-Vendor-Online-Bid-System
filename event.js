import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { db } from "./assets/js/firebase-config.js"; // Ensure Firebase is properly configured

document.addEventListener("DOMContentLoaded", () => {
    const eventManageBtn = document.querySelector("[data-bs-target='#components-nav']");
    const eventList = document.getElementById("event-list");

    if (!eventManageBtn || !eventList) {
        console.error("Event Manage button or event list not found!");
        return;
    }

    // When "Event Manage" is clicked, load events
    eventManageBtn.addEventListener("click", async () => {
        console.log("Event Manage clicked! Fetching events...");
        await loadEvents();
    });
});

function hideDashboardElements() {
    const elementsToHide = [
        document.querySelector(".pagetitle"), // Dashboard Page Title
        document.querySelector(".dashboard"), // Dashboard Section
        document.getElementById("adminTableContainer"), // Admin Table
        document.querySelector(".pagetitle + nav"), // Vendor Page Title & Breadcrumb
        document.getElementById("vendorTableContainer") // Vendor Table Container
    ];

    elementsToHide.forEach(element => {
        if (element) element.style.display = "none";
    });
}


async function loadEvents() {
    try {
        const eventsRef = collection(db, "Events");
        const eventsSnapshot = await getDocs(eventsRef);
        const eventList = document.getElementById("event-list");

        eventList.innerHTML = ""; // Clear existing events

        if (eventsSnapshot.empty) {
            eventList.innerHTML = "<li><i>No events available</i></li>";
            return;
        }

        eventsSnapshot.forEach((eventDoc) => {
            const eventData = eventDoc.data();
            const eventName = eventData.Name || "Unnamed Event";

            // Create event list item
            const listItem = document.createElement("li");
            listItem.innerHTML = `
                <a href="#" data-event-id="${eventDoc.id}" data-event-name="${eventName}">
                    <i class="bi bi-circle"></i> <span>${eventName}</span>
                </a>
            `;

            // When event is clicked, load its products & update the title
            listItem.querySelector("a").addEventListener("click", async (e) => {
                e.preventDefault();
                await loadProducts(eventDoc.id, eventName);
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

        hideDashboardElements(); // Hide elements before displaying products

        const tableContainer = document.querySelector(".table-container");
        const pageTitle = document.querySelector(".pagetitle h1");
        if (!tableContainer || !pageTitle) {
            console.error("Table container or page title not found!");
            return;
        }

        tableContainer.style.display = "block";
        pageTitle.textContent = "Event Products";

        const table = document.getElementById("myTable");
        const tableHead = table.querySelector("thead");
        const tableBody = table.querySelector("tbody");

        tableHead.innerHTML = `
            <tr>
                <th style="width: 20%;">Description</th>
                <th style="width: 10%; text-align: center;">Quantity Req.</th>
                <th style="width: 10%; text-align: center;">Actions</th>
            </tr>
        `;

        tableBody.innerHTML = "";

        const productsRef = collection(db, `Events/${eventId}/Products`);
        const productsSnapshot = await getDocs(productsRef);

        if (productsSnapshot.empty) {
            tableBody.innerHTML = "<tr><td colspan='3' style='text-align:center;'><i>No products available</i></td></tr>";
            return;
        }

        productsSnapshot.forEach((productDoc) => {
            const productData = productDoc.data();
            const description = productData.Description || "No description";
            const quantityRequired = productData.QuantityRequired || 0;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${description}</td>
                <td style="text-align: center;">${quantityRequired}</td>
                <td style="text-align: center;">
                    <button class="update-btn" data-product-id="${productDoc.id}" 
                            style="padding: 5px 20px; border-radius: 5px; border: 1px solid #010101; 
                                   background-color: #070085; color: white; cursor: pointer;">
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


document.addEventListener("DOMContentLoaded", () => {
    const biddingRecordsBtn = document.querySelector("[data-bs-target='#forms-nav']");
    const biddingList = document.getElementById("bidding-records-list");

    if (!biddingRecordsBtn || !biddingList) {
        console.error("Bidding Records button or list not found!");
        return;
    }

    biddingRecordsBtn.addEventListener("click", async () => {
        console.log("Bidding Records clicked! Fetching events...");
        await loadBiddingRecords();
    });
});

async function loadBiddingRecords() {
    try {
        const eventsRef = collection(db, "Events");
        const eventsSnapshot = await getDocs(eventsRef);
        const biddingList = document.getElementById("bidding-records-list");

        biddingList.innerHTML = ""; // Clear existing list

        if (eventsSnapshot.empty) {
            biddingList.innerHTML = "<li><i>No bidding records available</i></li>";
            return;
        }

        eventsSnapshot.forEach((eventDoc) => {
            const eventData = eventDoc.data();
            const eventName = eventData.Name || "Unnamed Event";

            const listItem = document.createElement("li");
            listItem.innerHTML = `
                <a href="#" data-event-id="${eventDoc.id}" data-event-name="${eventName}">
                    <i class="bi bi-circle"></i> <span>${eventName}</span>
                </a>
            `;

            listItem.querySelector("a").addEventListener("click", async (e) => {
                e.preventDefault();
                await loadEventBids(eventDoc.id, eventName);
            });

            biddingList.appendChild(listItem);
        });
    } catch (error) {
        console.error("Error loading bidding records:", error);
    }
}

async function loadEventBids(eventId, eventName) {
    try {
        console.log(`Fetching bidding records for event: ${eventId}`);

        hideDashboardElements(); // Hide elements before displaying bid reports

        const tableContainer = document.querySelector(".table-container");
        const pageTitle = document.querySelector(".pagetitle h1");
        const table = document.getElementById("myTable");

        if (!tableContainer || !pageTitle || !table) {
            throw new Error("One or more required elements not found in the DOM.");
        }

        tableContainer.style.display = "block";
        pageTitle.textContent = `Bidding Records - ${eventName}`;

        const tableHead = table.querySelector("thead");
        const tableBody = table.querySelector("tbody");

        tableHead.innerHTML = `
            <tr>
                <th style="width: 20%;">Description</th>
                <th style="width: 4%; text-align: center;">Quantity Req.</th>
                <th style="width: 8%; text-align: center;">Quantity Offered</th>
                <th style="width: 4%; text-align: center;">Bid Amount</th>
                <th style="width: 15%; text-align: center;">Company Name</th>
                <th style="width: 1%; text-align: center;">Rank</th>
            </tr>
        `;

        tableBody.innerHTML = "";

        const productsRef = collection(db, `Events/${eventId}/Products`);
        const productsSnapshot = await getDocs(productsRef);

        if (productsSnapshot.empty) {
            tableBody.innerHTML = "<tr><td colspan='6' style='text-align:center;'><i>No bidding records available</i></td></tr>";
            return;
        }

        for (const productDoc of productsSnapshot.docs) {
            const productData = productDoc.data();
            const description = productData.Description || "No description";
            const quantityRequired = productData.QuantityRequired || 0;

            const bidsRef = collection(db, `Events/${eventId}/Products/${productDoc.id}/Bids`);
            const bidsSnapshot = await getDocs(bidsRef);

            if (bidsSnapshot.empty) {
                console.log(`No bids found for product: ${description}`);
                continue;
            }

            bidsSnapshot.forEach((bidDoc) => {
                const bidData = bidDoc.data();
                const company = bidData.Company || "Unknown Company";
                const quantityOffered = bidData.QuantityOffered || 0;
                const bidAmount = bidData.BidAmount || 0;
                const rank = bidData.Rank || "N/A";

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${description}</td>
                    <td style="text-align: center;">${quantityRequired}</td>
                    <td style="text-align: center;">${quantityOffered}</td>
                    <td style="text-align: center;">₱ ${bidAmount}</td>
                    <td style="text-align: center;">${company}</td>
                    <td style="text-align: center;">${rank}</td>
                `;

                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error("Error loading event bids:", error);
    }
}
