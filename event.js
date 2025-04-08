import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { db } from "./assets/js/firebase-config.js"; 

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

const logoutBtnAdmin = document.getElementById('logoutBtnAdmin');
if (logoutBtnAdmin) {
  logoutBtnAdmin.addEventListener('click', function() {
    sessionStorage.clear();
    localStorage.removeItem('userType');
    window.location.href = "../index.html";
  });
}


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
                document.getElementById("addProductBtn").style.display = "block";
                e.preventDefault();
                await loadProducts(eventDoc.id, eventName);
                document.getElementById("addEventBtn").style.display = "none";
            });

            eventList.appendChild(listItem);
        });
    } catch (error) {
        console.error("Error loading events:", error);
    }
}

async function loadProducts(eventId, eventName) {
    try {
        console.log(`${eventId}`);

        selectedEventId = eventId; // Store the current eventId

        hideDashboardElements();

        const tableContainer = document.querySelector(".table-container");
        const pageTitle = document.querySelector(".pagetitle h1");

        if (!tableContainer || !pageTitle) {
            console.error("Table container or page title not found!");
            return;
        }

        // Remove any previous event header
        const existingEventHeader = document.querySelector(".event-header");
        if (existingEventHeader) {
            existingEventHeader.remove();
        }

        // Add Event Name Header at the top of the table
        const eventHeader = document.createElement("h3");
        eventHeader.classList.add("event-header");
        eventHeader.textContent = `${eventName}`;
        tableContainer.insertBefore(eventHeader, tableContainer.firstChild);

        const filterContainer = document.getElementById("filterContainer");
        if (filterContainer) {
            filterContainer.style.display = "none";
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
                    <button class="add-bid-btn" data-product-id="${productDoc.id}"
                            style="padding: 5px 20px; border-radius: 5px; border: 1px solid rgb(46, 209, 67); 
                                   background-color: green; color: white; cursor: pointer; margin-top: 5px;">
                        <i class="fas fa-plus"></i> Add Bid
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading products:", error);
    }
}

let selectedEventId = "";

document.getElementById("addProductBtn").addEventListener("click", function() {
    const addProductModal = new bootstrap.Modal(document.getElementById("addProductModal"));
    addProductModal.show();
});

document.getElementById("saveProductBtn").addEventListener("click", async function() {
    const description = document.getElementById("productDescriptionInput").value.trim();
    const quantityRequired = parseInt(document.getElementById("productQuantityInput").value.trim(), 10);

    if (!description || isNaN(quantityRequired) || quantityRequired <= 0) {
        alert("Please fill in both fields correctly.");
        return;
    }

    try {
        // Reference to the Products subcollection of the selected event
        const productsRef = collection(db, `Events/${selectedEventId}/Products`);
        
        // Add a new product to Firestore
        await addDoc(productsRef, {
            Description: description,
            QuantityRequired: quantityRequired
        });

        console.log("Product added successfully!");

        // Close the modal and reload the products
        const addProductModal = bootstrap.Modal.getInstance(document.getElementById("addProductModal"));
        addProductModal.hide();

        loadProducts(selectedEventId); // Reload the products for the event
    } catch (error) {
        console.error("Error adding product:", error);
        alert("Error adding product, please try again.");
    }
});
let selectedProductId = null;

// Event delegation for Update button
document.getElementById("myTable").addEventListener("click", function (e) {
    if (e.target.closest(".update-btn")) {
        const productId = e.target.closest(".update-btn").dataset.productId;
        showUpdateProductModal(productId);
    }
});

function showUpdateProductModal(productId) {
    selectedProductId = productId;

    const productRef = doc(db, `Events/${selectedEventId}/Products/${productId}`);
    getDoc(productRef).then((docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById("updateProductDescription").value = data.Description || "";
            document.getElementById("updateProductQuantity").value = data.QuantityRequired || 0;

            const updateModal = new bootstrap.Modal(document.getElementById("updateProductModal"));
            updateModal.show();
        }
    });
}

// Save changes
document.getElementById("saveProductChangesBtn").addEventListener("click", async () => {
    const updatedDescription = document.getElementById("updateProductDescription").value;
    const updatedQuantity = parseInt(document.getElementById("updateProductQuantity").value);

    await updateDoc(doc(db, `Events/${selectedEventId}/Products/${selectedProductId}`), {
        Description: updatedDescription,
        QuantityRequired: updatedQuantity
    });

    bootstrap.Modal.getInstance(document.getElementById("updateProductModal")).hide();
    loadProducts(selectedEventId);
});

// Delete logic
document.getElementById("deleteProductBtn").addEventListener("click", () => {
    bootstrap.Modal.getInstance(document.getElementById("updateProductModal")).hide();
    const confirmModal = new bootstrap.Modal(document.getElementById("confirmDeleteProductModal"));
    confirmModal.show();
});

document.getElementById("confirmDeleteProductBtn").addEventListener("click", async () => {
    await deleteDoc(doc(db, `Events/${selectedEventId}/Products/${selectedProductId}`));
    bootstrap.Modal.getInstance(document.getElementById("confirmDeleteProductModal")).hide();
    loadProducts(selectedEventId);
});

let selectedProductIdForBid = null;

document.addEventListener("click", async function (e) {
    if (e.target.closest(".add-bid-btn")) {
        const productId = e.target.closest(".add-bid-btn").getAttribute("data-product-id");
        selectedProductIdForBid = productId;

        const companySelect = document.getElementById("companySelect");
        companySelect.innerHTML = "<option disabled selected>Loading...</option>";

        const companiesQuery = query(collection(db, "CompanyAccounts"), where("Event", "==", selectedEventId), where("Status", "==", "Active"));
        const querySnapshot = await getDocs(companiesQuery);

        companySelect.innerHTML = "";

        if (querySnapshot.empty) {
            companySelect.innerHTML = "<option disabled>No active companies available</option>";
        } else {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const option = document.createElement("option");
                option.value = doc.id;
                option.textContent = doc.id;
                companySelect.appendChild(option);
            });
        }

        const bidModal = new bootstrap.Modal(document.getElementById("addBidModal"));
        bidModal.show();
    }
});

document.getElementById("submitBidBtn").addEventListener("click", async () => {
    const companyId = document.getElementById("companySelect").value;
    const bidAmount = parseFloat(document.getElementById("bidAmountInput").value);
    const quantityOffered = parseInt(document.getElementById("quantityOfferedInput").value);

    if (!companyId || isNaN(bidAmount) || isNaN(quantityOffered)) {
        alert("Please fill in all fields correctly.");
        return;
    }

    try {
        const bidsRef = collection(db, `Events/${selectedEventId}/Products/${selectedProductIdForBid}/Bids`);

        await addDoc(bidsRef, {
            Company: companyId,
            BidAmount: bidAmount,
            QuantityOffered: quantityOffered,
            Rank: 0 
        });

        const updatedBidsSnapshot = await getDocs(bidsRef);
        const updatedBids = updatedBidsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).sort((a, b) => a.BidAmount - b.BidAmount);

        const updatePromises = updatedBids.map((bid, index) => {
            const bidDocRef = doc(db, `Events/${selectedEventId}/Products/${selectedProductIdForBid}/Bids`, bid.id);
            return updateDoc(bidDocRef, { Rank: index + 1 });
        });

        await Promise.all(updatePromises);

        bootstrap.Modal.getInstance(document.getElementById("addBidModal")).hide();
        alert("Bid submitted and ranks updated!");

    } catch (error) {
        console.error("Error adding or ranking bid:", error);
        alert("An error occurred while submitting the bid.");
    }
});

document.getElementById("submitBidBtn").addEventListener("click", async () => {
    const companyId = document.getElementById("companySelect").value;
    const bidAmount = parseFloat(document.getElementById("bidAmountInput").value);
    const quantityOffered = parseInt(document.getElementById("quantityOfferedInput").value);

    if (!companyId || isNaN(bidAmount) || isNaN(quantityOffered)) {
        alert("Please fill in all fields correctly.");
        return;
    }

    try {
        const bidsRef = collection(db, `Events/${selectedEventId}/Products/${selectedProductIdForBid}/Bids`);
        await addDoc(bidsRef, {
            Company: companyId,
            BidAmount: bidAmount,
            QuantityOffered: quantityOffered,
            Rank: 0 // default rank, can be calculated later
        });

        bootstrap.Modal.getInstance(document.getElementById("addBidModal")).hide();
        alert("Bid successfully submitted!");
    } catch (error) {
        console.error("Error adding bid:", error);
        alert("An error occurred while submitting the bid.");
    }
});


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

        biddingList.innerHTML = "";

        document.getElementById("addEventBtn").style.display = "none";

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
                    <i class="i bi-circle"></i> <span>${eventName}</span>
                </a>
            `;

            listItem.querySelector("a").addEventListener("click", async (e) => {
                e.preventDefault();
            
                document.getElementById("addProductBtn").style.display = "none";
            
                const existingEventHeader = document.querySelector(".event-header");
                if (existingEventHeader) {
                    existingEventHeader.remove();
                }
            
                await loadEventBids(eventDoc.id, eventName);
            
                const tableContainer = document.querySelector(".table-container");
                if (tableContainer) {
                    const eventHeader = document.createElement("h3");
                    eventHeader.classList.add("event-header");
                    eventHeader.textContent = `${eventName}`;
                    tableContainer.insertBefore(eventHeader, tableContainer.firstChild);
                }
            
                const filterContainer = document.getElementById("filterContainer");
                if (filterContainer) {
                    filterContainer.style.display = "block";
                }
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

        hideDashboardElements();

        const existingEventHeader = document.querySelector(".event-header");
        if (existingEventHeader) {
            existingEventHeader.remove();
        }

        const tableContainer = document.querySelector(".table-container");
        const pageTitle = document.querySelector(".pagetitle h1");
        const table = document.getElementById("myTable");
        const filterContainer = document.getElementById("filterContainer");

        if (!tableContainer || !pageTitle || !table || !filterContainer) {
            console.error("One or more required elements not found in the DOM.");
            return;
        }

        tableContainer.style.display = "block";
        pageTitle.textContent = `Bidding Records - ${eventName}`;

        const tableHead = table.querySelector("thead");
        const tableBody = table.querySelector("tbody");

        if (!tableHead || !tableBody) {
            console.error("Table head or body not found!");
            return;
        }

        // Filters
        filterContainer.innerHTML = `
            <label for="descriptionFilter">Description:</label>
            <select id="descriptionFilter"><option value="">All</option></select>
            <label for="companyFilter">Company:</label>
            <select id="companyFilter"><option value="">All</option></select>
            <label for="sortFilter">Sort by Rank:</label>
            <select id="sortFilter">
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
            </select>
        `;

        const descriptionFilter = document.getElementById("descriptionFilter");
        const companyFilter = document.getElementById("companyFilter");
        const sortFilter = document.getElementById("sortFilter");

        tableHead.innerHTML = `
            <tr>
                <th>Description</th>
                <th style="text-align: center;">Qty Req.</th>
                <th style="text-align: center;">Qty Offered</th>
                <th style="text-align: center;">Bid Amount</th>
                <th style="text-align: center;">Company ID</th>
                <th style="text-align: center;">Rank</th>
                <th style="text-align: center;">Action</th>
            </tr>
        `;

        tableBody.innerHTML = "";

        const productsRef = collection(db, `Events/${eventId}/Products`);
        const productsSnapshot = await getDocs(productsRef);

        if (productsSnapshot.empty) {
            tableBody.innerHTML = "<tr><td colspan='7' style='text-align:center;'><i>No bidding records available</i></td></tr>";
            return;
        }

        let bidsData = [];

        for (const productDoc of productsSnapshot.docs) {
            const productId = productDoc.id;
            const productData = productDoc.data();
            const description = productData.Description || "No description";
            const quantityRequired = productData.QuantityRequired || 0;

            const bidsRef = collection(db, `Events/${eventId}/Products/${productId}/Bids`);
            const bidsSnapshot = await getDocs(bidsRef);

            if (bidsSnapshot.empty) continue;

            bidsSnapshot.forEach((bidDoc) => {
                const bidData = bidDoc.data();
                bidsData.push({
                    bidId: bidDoc.id,
                    productId,
                    description,
                    quantityRequired,
                    company: bidData.Company || "Unknown",
                    quantityOffered: bidData.QuantityOffered || 0,
                    bidAmount: bidData.BidAmount || 0,
                    rank: bidData.Rank || "N/A"
                });
            });

            if (![...descriptionFilter.options].some(o => o.value === description)) {
                descriptionFilter.innerHTML += `<option value="${description}">${description}</option>`;
            }
        }

        // Populate unique company IDs
        const uniqueCompanies = [...new Set(bidsData.map(b => b.company))];
        uniqueCompanies.forEach(company => {
            companyFilter.innerHTML += `<option value="${company}">${company}</option>`;
        });

        // Render Table Function
        function renderTable() {
            tableBody.innerHTML = "";

            let filteredBids = [...bidsData];

            if (descriptionFilter.value) {
                filteredBids = filteredBids.filter(b => b.description === descriptionFilter.value);
            }
            if (companyFilter.value) {
                filteredBids = filteredBids.filter(b => b.company === companyFilter.value);
            }
            if (sortFilter.value === "asc") {
                filteredBids.sort((a, b) => a.rank - b.rank);
            } else {
                filteredBids.sort((a, b) => b.rank - a.rank);
            }

            filteredBids.forEach(bid => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${bid.description}</td>
                    <td style="text-align: center;">${bid.quantityRequired}</td>
                    <td style="text-align: center;">${bid.quantityOffered}</td>
                    <td style="text-align: center;">₱ ${bid.bidAmount}</td>
                    <td style="text-align: center;">${bid.company}</td>
                    <td style="text-align: center;">${bid.rank}</td>
                    <td style="text-align: center;">
                        <button class="btn btn-danger btn-sm delete-bid-btn" 
                                data-product-id="${bid.productId}" 
                                data-bid-id="${bid.bidId}">
                            Delete
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }

        // Event Listeners for filters
        descriptionFilter.addEventListener("change", renderTable);
        companyFilter.addEventListener("change", renderTable);
        sortFilter.addEventListener("change", renderTable);

        // Delete Button Handler (with Modal)
        let selectedBidId = null;
        let selectedProductId = null;

        tableBody.addEventListener("click", function (e) {
            if (e.target.classList.contains("delete-bid-btn")) {
                selectedBidId = e.target.getAttribute("data-bid-id");
                selectedProductId = e.target.getAttribute("data-product-id");

                // Show the modal
                const confirmDeleteBidModal = new bootstrap.Modal(document.getElementById("confirmDeleteBidModal"));
                confirmDeleteBidModal.show();
            }
        });

        // Confirm Deletion in Modal
        document.getElementById("confirmDeleteBidBtn").addEventListener("click", async function () {
            const bidDocRef = doc(db, `Events/${eventId}/Products/${selectedProductId}/Bids/${selectedBidId}`);
            await deleteDoc(bidDocRef);

            // Remove from local data
            bidsData = bidsData.filter(bid => !(bid.bidId === selectedBidId && bid.productId === selectedProductId));

            // Hide modal and re-render the table
            const confirmDeleteBidModal = bootstrap.Modal.getInstance(document.getElementById("confirmDeleteBidModal"));
            confirmDeleteBidModal.hide();

            renderTable();
        });

        renderTable();

    } catch (error) {
        console.error("Error loading event bids:", error);
    }
}
