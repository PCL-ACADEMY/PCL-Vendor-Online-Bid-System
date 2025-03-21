import { db } from "./assets/js/firebase-config.js";
import { collection, getDocs, getDoc, query, where, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const submitButton = document.querySelector("button");
const timerDisplay = document.getElementById("timer");
const quantityInput = document.querySelector("input[placeholder='Quantity']");
const amountInput = document.querySelector("input[placeholder='Amount']");
const productRadios = document.querySelectorAll("input[name='selectedProduct']");
const overlay = document.getElementById("overlay");
const overlayTableBody = document.getElementById("overlay-table-body");
const returnButton = document.getElementById("return-button");

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

            // Fetch all bids for this product
            const bidsRef = collection(db, `Events/${eventId}/Products/${productId}/Bids`);
            const bidsSnapshot = await getDocs(bidsRef);
            let bidData = {};
            let rank = "-";

            if (!bidsSnapshot.empty) {
                const sortedBids = bidsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                    .sort((a, b) => a.BidAmount - b.BidAmount); 

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


// Event listener for bid updates
submitButton.addEventListener("click", async () => {
    submitButton.disabled = true;

    const quantityInput = document.querySelector("input[placeholder='Quantity']");
    const amountInput = document.querySelector("input[placeholder='Amount']");
    const selectedProduct = document.querySelector("input[name='selectedProduct']:checked");

    if (!quantityInput.value || !amountInput.value || !selectedProduct) {
        alert("Both Quantity and Amount fields are required, and a product must be selected.");
        submitButton.disabled = false;
        return;
    }

    const quantity = parseInt(quantityInput.value);
    const decrementAmount = parseFloat(amountInput.value);
    const productId = selectedProduct.value;

    if (isNaN(quantity) || isNaN(decrementAmount)) {
        alert("Invalid input values.");
        submitButton.disabled = false;
        return;
    }

    if (decrementAmount < 300) {
        alert("The amount to be decreased cannot be lower than 300.");
        submitButton.disabled = false;
        return;
    }

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
            localStorage.setItem('eventId', eventId); // Cache eventId
        }

        // Fetch the product to get QuantityRequired
        const productDocRef = doc(db, `Events/${eventId}/Products/${productId}`);
        const productDoc = await getDoc(productDocRef);
        if (!productDoc.exists()) {
            alert("Product not found.");
            submitButton.disabled = false;
            return;
        }

        const productData = productDoc.data();
        if (quantity > productData.QuantityRequired) {
            alert(`The quantity offered (${quantity}) cannot exceed the required quantity (${productData.QuantityRequired}).`);
            submitButton.disabled = false;
            return;
        }

        // Fetch the user's existing bid document
        const bidsRef = collection(db, `Events/${eventId}/Products/${productId}/Bids`);
        const bidsQuery = query(bidsRef, where("Company", "==", companyId));
        const bidsSnapshot = await getDocs(bidsQuery);

        if (!bidsSnapshot.empty) {
            const bidDoc = bidsSnapshot.docs[0];
            const bidDocRef = bidDoc.ref;
            const bidData = bidDoc.data();

            // Calculate new bid amount
            const newBidAmount = Math.max((bidData.BidAmount || 0) - decrementAmount, 0);

            const allBidsSnapshot = await getDocs(bidsRef);
            if (!allBidsSnapshot.empty) {
                const sortedBids = allBidsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Check if new bid amount causes a tie
                const isTie = sortedBids.some(bid => bid.BidAmount === newBidAmount && bid.Company !== companyId);
                if (isTie) {
                    alert("There will be a tie! Please increase the decrement amount to avoid ties.");
                    submitButton.disabled = false;
                    return;
                }

                // Update Firestore with the new bid amount 
                await updateDoc(bidDocRef, {
                    QuantityOffered: quantity,
                    BidAmount: newBidAmount
                });

                // Fetch all updated bids and sort them
                const updatedBidsSnapshot = await getDocs(bidsRef);
                const updatedBids = updatedBidsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })).sort((a, b) => a.BidAmount - b.BidAmount);

                // Assign new ranks and update Firestore
                const updatePromises = updatedBids.map((bid, index) => {
                    const bidDocRef = doc(db, `Events/${eventId}/Products/${productId}/Bids`, bid.id);
                    return updateDoc(bidDocRef, { Rank: index + 1 });
                });

                await Promise.all(updatePromises); 

                // Fetch the updated ranks
                const finalBidsSnapshot = await getDocs(bidsRef);
                const finalBids = finalBidsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })).sort((a, b) => a.BidAmount - b.BidAmount);

                const userBid = finalBids.find(bid => bid.Company === companyId);
                if (userBid) {
                    const row = selectedProduct.closest("tr");
                    row.querySelector(".quantity-offered").innerText = quantity;
                    row.querySelector(".bid-amount").innerText = `₱ ${newBidAmount}`;
                    row.querySelector("td:last-child").innerText = userBid.Rank; 
                }
            }
        }

        // Reset input fields
        quantityInput.value = "";
        amountInput.value = "";

    } catch (error) {
        console.error("Error updating Firestore:", error);
    } finally {
        submitButton.disabled = false;
    }
});



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
