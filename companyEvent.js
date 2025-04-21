import { db } from "./assets/js/firebase-config.js";
import { collection, getDocs, getDoc, query, where, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

window.addEventListener("pageshow", async function (event) {
    const navType = window.performance.getEntriesByType("navigation")[0]?.type;

    if (event.persisted || navType === "back_forward") {
        const userType = localStorage.getItem("userType");
        const userDocId = localStorage.getItem("userDocId");

        if (userType === "vendor" && userDocId) {
            const companyRef = doc(db, "CompanyAccounts", userDocId);

            try {
                await updateDoc(companyRef, {
                    Activity: "Offline"
                });
                console.log("Activity updated to Offline");
            } catch (error) {
                console.error("Failed to update activity status:", error);
            }
        }

        localStorage.clear();
        window.location.href = "../index.html"; // optional redirect to login
    }
});

const submitButton = document.querySelector("button");
const timerDisplay = document.getElementById("timer");
const quantityInput = document.querySelector("input[placeholder='Quantity']");
const amountInput = document.querySelector("input[placeholder='Amount']");
const productRadios = document.querySelectorAll("input[name='selectedProduct']");
const overlay = document.getElementById("overlay");
const overlayTableBody = document.getElementById("overlay-table-body");
const returnButton = document.getElementById("return-button");
const modal = document.getElementById("confirmationModal");
const confirmBtn = document.getElementById("confirmBid");
const cancelBtn = document.getElementById("cancelBid");

returnButton.addEventListener("click", async () => {
    const companyId = localStorage.getItem('userDocId');
    if (companyId) {
        const companyDocRef = doc(db, "CompanyAccounts", companyId);
        await updateDoc(companyDocRef, { Status: "Inactive" });
    }
    window.location.href = "../index.html";
});

async function fetchEventData() {
    try {
        submitButton.disabled = true;

        const companyId = localStorage.getItem('userDocId');
        if (!companyId) {
            console.error("No logged-in company found.");
            alert("You are not logged in!");
            window.location.href = "index.html";
            return;
        }

        // Fetch the event linked to the logged-in company
        const companyDocRef = doc(db, "CompanyAccounts", companyId);
        const companyDoc = await getDoc(companyDocRef);

        if (!companyDoc.exists()) {
            console.error("Company document not found.");
            return;
        }

        const eventId = companyDoc.data().Event;
        if (!eventId) {
            console.error("No event found for this company.");
            return;
        }

        // Fetch event details
        const eventDocRef = doc(db, "Events", eventId);
        const eventDoc = await getDoc(eventDocRef);
        if (!eventDoc.exists()) {
            console.error("Event document not found.");
            return;
        }

        const eventData = eventDoc.data();
        startCountdown(eventData.StartTime, eventData.EndTime);

        // Fetch Products under the Event
        const productsRef = collection(db, `Events/${eventId}/Products`);
        const productsSnapshot = await getDocs(productsRef);

        const tableBody = document.querySelector("#myTable tbody");
        tableBody.innerHTML = "";

        for (const productDoc of productsSnapshot.docs) {
            const productData = productDoc.data();
            const productId = productDoc.id;

            const bidsRef = collection(db, `Events/${eventId}/Products/${productId}/Bids`);
            const bidsSnapshot = await getDocs(bidsRef);

            let bidData = {};
            let rank = "-";

            if (!bidsSnapshot.empty) {
                // Increment Rank 1 = Highest Bid
                const sortedBids = bidsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                    .sort((a, b) => b.BidAmount - a.BidAmount); // Descending order

                // Decrement Rank 1 = Lowest Bid
                // const sortedBids = bidsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                //     .sort((a, b) => a.BidAmount - b.BidAmount); // Ascending order

                sortedBids.forEach((bid, index) => {
                    const bidDocRef = doc(db, `Events/${eventId}/Products/${productId}/Bids`, bid.id);
                    updateDoc(bidDocRef, { Rank: index + 1 });

                    if (bid.Company === companyId) {
                        bidData = bid;
                        rank = index + 1;
                    }
                });
            }

            let row = document.createElement("tr");
            row.setAttribute("data-product-id", productId);
            row.innerHTML = `
                <td>${productData.Description}</td>
                <td style="text-align: center;">${productData.QuantityRequired}</td>
                <td style="text-align: center;" class="quantity-offered">${bidData.QuantityOffered || "-"}</td>
                <td><input type="radio" name="selectedProduct" value="${productId}" style="margin-left: 10px; transform: scale(2);"></td>
                <td style="text-align: center;" class="bid-amount">₱ ${bidData.BidAmount || 0}</td>
                <td style="text-align: center;">${rank}</td>
            `;
            tableBody.appendChild(row);
        }
    } catch (error) {
        console.error("Error fetching event data:", error);
    } finally {
        submitButton.disabled = false;
    }
}

let pendingBidData = {}; // Temporarily stores bid info before confirmation

// Function to display the modal with a custom message
function showModal(modalType, message, callback) {
    let modal, messageElement, confirmButton, cancelButton;

    if (modalType === "confirmation") {
        modal = document.getElementById("confirmationModal");
        messageElement = document.getElementById("modalMessage");
        confirmButton = document.getElementById("confirmBid");
        cancelButton = document.getElementById("cancelBid");
    } else {
        modal = document.getElementById("errorModal");
        messageElement = document.getElementById("errorMessage");
        confirmButton = document.getElementById("confirmError");
        cancelButton = null;
    }

    messageElement.textContent = message;
    modal.style.display = "flex";

    confirmButton.onclick = () => {
        callback(true);
        modal.style.display = "none";
    };

    if (cancelButton) {
        cancelButton.onclick = () => {
            callback(false);
            modal.style.display = "none";
        };
    }
}


// Event listener for bid updates
submitButton.addEventListener("click", () => {
    const quantityInput = document.querySelector("input[placeholder='Quantity']");
    const amountInput = document.querySelector("input[placeholder='Amount']");
    const selectedProduct = document.querySelector("input[name='selectedProduct']:checked");

    if (!quantityInput.value || !amountInput.value || !selectedProduct) {
        showModal("error", "Both Quantity and Amount fields are required, and a product must be selected.", () => {});
        return;
    }

    const incrementAmount = parseFloat(amountInput.value);
    if (isNaN(incrementAmount) || incrementAmount < 300) {
        showModal("error", "Invalid input. The increment amount must be at least 300.", () => {});
        return;
    }

    const modalMessage = `Are you sure you want to increase your bid amount by ₱${incrementAmount.toLocaleString()}?`;
    showModal("confirmation", modalMessage, (confirmed) => {
        if (confirmed) {
            pendingBidData = {
                quantity: quantityInput.value,
                amount: amountInput.value,
                productId: selectedProduct.value
            };
            confirmBtn.click();
        }
        

    // Decrement Logic (commented out)
    // const modalMessage = `Are you sure you want to decrease your bid amount by ₱${incrementAmount.toLocaleString()}?`;
    // showModal("confirmation", modalMessage, (confirmed) => {
    //     if (confirmed) {
    //         pendingBidData = {
    //             quantity: quantityInput.value,
    //             amount: amountInput.value,
    //             productId: selectedProduct.value
    //         };
    //         confirmBtn.click(); // Manually trigger the confirmation handler
    //     }
    });
});


// Handle confirmation
confirmBtn.addEventListener("click", async () => {
    const modal = document.getElementById("confirmationModal");
    modal.style.display = "none";
    submitButton.disabled = true;

    const quantity = parseInt(pendingBidData.quantity);
    const amountChange = parseFloat(pendingBidData.amount);
    const productId = pendingBidData.productId;


    try {
        const companyId = localStorage.getItem('userDocId');
        if (!companyId) {
            alert("You are not logged in!");
            window.location.href = "index.html";
            return;
        }

        let eventId = localStorage.getItem('eventId');
        if (!eventId) {
            const companyDocRef = doc(db, "CompanyAccounts", companyId);
            const companyDoc = await getDoc(companyDocRef);
            if (!companyDoc.exists()) throw new Error("Company document not found.");
            eventId = companyDoc.data().Event;
            localStorage.setItem('eventId', eventId);
        }

        const productDocRef = doc(db, `Events/${eventId}/Products/${productId}`);
        const productDoc = await getDoc(productDocRef);
        if (!productDoc.exists()) {
            submitButton.disabled = false;
            return;
        }

        const productData = productDoc.data();
        if (quantity > productData.QuantityRequired) {
            showModal("error", `The quantity offered (${quantity}) cannot exceed the required quantity (${productData.QuantityRequired}).`, () => {});
            submitButton.disabled = false;
            return;
        }        

        const bidsRef = collection(db, `Events/${eventId}/Products/${productId}/Bids`);
        const bidsQuery = query(bidsRef, where("Company", "==", companyId));
        const bidsSnapshot = await getDocs(bidsQuery);

        if (!bidsSnapshot.empty) {
            const bidDoc = bidsSnapshot.docs[0];
            const bidDocRef = bidDoc.ref;
            const bidData = bidDoc.data();

            // Increment
            const newBidAmount = (bidData.BidAmount || 0) + amountChange;

            // Decrement
            // const newBidAmount = Math.max((bidData.BidAmount || 0) - amountChange, 0);

            // Check for tie 
            const allBidsSnapshot = await getDocs(bidsRef);
            const sortedBids = allBidsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const isTie = sortedBids.some(bid => bid.BidAmount === newBidAmount && bid.Company !== companyId);
            if (isTie) {
                alert("There will be a tie! Please change the amount further to avoid ties.");
                submitButton.disabled = false;
                return;
            }

            // Update the bid
            await updateDoc(bidDocRef, {
                QuantityOffered: quantity,
                BidAmount: newBidAmount
            });

            //  Ranking (rank 1 = highest bid)
            const updatedBidsSnapshot = await getDocs(bidsRef);
            const updatedBids = updatedBidsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).sort((a, b) => b.BidAmount - a.BidAmount); // Descending order

            // Ranking (rank 1 = lowest bid)
            // const updatedBids = updatedBidsSnapshot.docs.map(doc => ({
            //     id: doc.id,
            //     ...doc.data()
            // })).sort((a, b) => a.BidAmount - b.BidAmount); // Ascending order

            const updatePromises = updatedBids.map((bid, index) => {
                const bidDocRef = doc(db, `Events/${eventId}/Products/${productId}/Bids`, bid.id);
                return updateDoc(bidDocRef, { Rank: index + 1 });
            });

            await Promise.all(updatePromises);

            //  Sort display to match (highest bid first)
            const finalBidsSnapshot = await getDocs(bidsRef);
            const finalBids = finalBidsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).sort((a, b) => b.BidAmount - a.BidAmount); // Descending

            // Sort display to match (Lowest bid first)
            // const finalBids = finalBidsSnapshot.docs.map(doc => ({
            //     id: doc.id,
            //     ...doc.data()
            // })).sort((a, b) => a.BidAmount - b.BidAmount); // Ascending

            const userBid = finalBids.find(bid => bid.Company === companyId);
            if (userBid) {
                const row = document.querySelector(`input[name='selectedProduct'][value='${productId}']`).closest("tr");
                row.querySelector(".quantity-offered").innerText = quantity;
                row.querySelector(".bid-amount").innerText = `₱ ${newBidAmount}`;
                row.querySelector("td:last-child").innerText = userBid.Rank;
            }
        }

         // ✅ Only now: Clear inputs safely
         document.querySelector("input[placeholder='Quantity']").value = "";
         document.querySelector("input[placeholder='Amount']").value = "";
         const selected = document.querySelector("input[name='selectedProduct']:checked");
         if (selected) selected.checked = false;

    } catch (error) {
        console.error("Error updating Firestore:", error);
    } finally {
        submitButton.disabled = false;
    }
});

// Handle cancellation
cancelBtn.addEventListener("click", () => {
    modal.style.display = "none";  // Hide modal
});

document.getElementById("update").addEventListener("click", async () => {
    fetchLatestTableData();
});

async function fetchLatestTableData() {
    try {
        const companyId = localStorage.getItem('userDocId');
        if (!companyId) {
            alert("You are not logged in!");
            window.location.href = "index.html";
            return;
        }

        const companyDocRef = doc(db, "CompanyAccounts", companyId);
        const companyDoc = await getDoc(companyDocRef);
        if (!companyDoc.exists()) {
            console.error("Company document not found.");
            return;
        }

        const eventId = companyDoc.data().Event;
        if (!eventId) {
            console.error("No event found for this company.");
            return;
        }

        const productsRef = collection(db, `Events/${eventId}/Products`);
        const productsSnapshot = await getDocs(productsRef);

        let rows = [];

        const bidPromises = productsSnapshot.docs.map(async (productDoc) => {
            const productData = productDoc.data();
            const productId = productDoc.id;

            const bidsRef = collection(db, `Events/${eventId}/Products/${productId}/Bids`);
            const bidsSnapshot = await getDocs(bidsRef);

            let bidData = {};
            let rank = "-";

            if (!bidsSnapshot.empty) {
                // Increment Rank 1 = Highest Bid
                const sortedBids = bidsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                    .sort((a, b) => b.BidAmount - a.BidAmount); // Descending order

                // Decrement Rank 1 = Lowest Bid
                // const sortedBids = bidsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                //     .sort((a, b) => a.BidAmount - b.BidAmount); // Ascending order

                sortedBids.forEach((bid, index) => {
                    const bidDocRef = doc(db, `Events/${eventId}/Products/${productId}/Bids`, bid.id);
                    updateDoc(bidDocRef, { Rank: index + 1 });

                    if (bid.Company === companyId) {
                        bidData = bid;
                        rank = index + 1;
                    }
                });
            }

            rows.push(`
                <tr data-product-id="${productId}">
                    <td>${productData.Description}</td>
                    <td style="text-align: center;">${productData.QuantityRequired}</td>
                    <td style="text-align: center;" class="quantity-offered">${bidData.QuantityOffered || "-"}</td>
                    <td><input type="radio" name="selectedProduct" value="${productId}" style="margin-left: 10px; transform: scale(2);"></td>
                    <td style="text-align: center;" class="bid-amount">₱ ${bidData.BidAmount || 0}</td>
                    <td style="text-align: center;">${rank}</td>
                </tr>
            `);
        });

        await Promise.all(bidPromises);

        const tableBody = document.querySelector("#myTable tbody");
        tableBody.innerHTML = rows.join("");

    } catch (error) {
        console.error("Error fetching latest event data:", error);
    }
}


function startCountdown(startTime, endTime) {
    const startTimestamp = startTime.toDate();
    const endTimestamp = endTime.toDate();
    
    function updateTimer() {
        const now = new Date();
        if (now < startTimestamp) {
            timerDisplay.innerText = "Event has not started yet.";
            disableInputs(true);
            return;
        }
        
        const remainingTime = Math.max(0, endTimestamp - now);
        if (remainingTime === 0) {
            timerDisplay.innerText = "Event has ended.";
            disableInputs(true);
            displayOverlay();
            return;
        }

        disableInputs(false);

        const hours = Math.floor(remainingTime / (1000 * 60 * 60));
        const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
        
        timerDisplay.innerText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    updateTimer();
    setInterval(updateTimer, 1000);
}


function disableInputs(disable) {
    quantityInput.disabled = disable;
    amountInput.disabled = disable;
    submitButton.disabled = disable;
    productRadios.forEach(radio => radio.disabled = disable);
}

function displayOverlay() {
    overlayTableBody.innerHTML = "";
    document.querySelectorAll("#myTable tbody tr").forEach(row => {
        const cells = row.children;
        const overlayRow = document.createElement("tr");
        overlayRow.innerHTML = `
            <td>${cells[0].innerText}</td>
            <td>${cells[2].innerText}</td>
            <td>${cells[4].innerText}</td>
            <td>${cells[5].innerText}</td>
        `;
        overlayTableBody.appendChild(overlayRow);
    });
    overlay.style.display = "flex";
}
// Fetch initial data for logged-in company
fetchEventData();
