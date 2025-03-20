import { db } from "./assets/js/firebase-config.js";
import { collection, getDocs, getDoc, query, where, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const submitButton = document.querySelector("button");

async function fetchEventData() {
    try {
        submitButton.disabled = true; // Disable button while fetching data
        
        const companyId = localStorage.getItem('userDocId'); // Get logged-in company ID
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
                    .sort((a, b) => a.BidAmount - b.BidAmount); // Sort bids by lowest amount

                sortedBids.forEach((bid, index) => {
                    const bidDocRef = doc(db, `Events/${eventId}/Products/${productId}/Bids`, bid.id);
                    updateDoc(bidDocRef, { Rank: index + 1 }); // Update rank in Firestore
                    
                    if (bid.Company === companyId) {
                        bidData = bid;
                        rank = index + 1;
                    }
                });
            }

            let row = document.createElement("tr");
            row.setAttribute("data-product-id", productId); // Store product ID for updates
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
        submitButton.disabled = false; // Re-enable button after fetching data
    }
}

// Event listener for bid updates
submitButton.addEventListener("click", async () => {
    submitButton.disabled = true; // Disable button while updating
    
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

    try {
        const companyId = localStorage.getItem('userDocId'); // Get logged-in company ID
        if (!companyId) {
            alert("You are not logged in!");
            window.location.href = "index.html";
            return;
        }

        // Fetch the logged-in company's event
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

        const bidsRef = collection(db, `Events/${eventId}/Products/${productId}/Bids`);
        const bidsSnapshot = await getDocs(query(bidsRef, where("Company", "==", companyId)));

        if (!bidsSnapshot.empty) {
            const bidDoc = bidsSnapshot.docs[0];
            const bidData = bidDoc.data();
            const bidDocRef = doc(db, `Events/${eventId}/Products/${productId}/Bids`, bidDoc.id);

            // Update Firestore
            await updateDoc(bidDocRef, {
                QuantityOffered: quantity,
                BidAmount: Math.max((bidData.BidAmount || 0) - decrementAmount, 0) // Prevent negative bid amount
            });
        }

        // Refresh the table after update
        await fetchEventData();
        quantityInput.value = "";
        amountInput.value = "";

    } catch (error) {
        console.error("Error updating Firestore:", error);
    } finally {
        submitButton.disabled = false; // Re-enable button after update
    }
});

// Fetch initial data for logged-in company
fetchEventData();