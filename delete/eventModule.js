import { db } from "../firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

async function loadProducts(eventId) {
    try {
        console.log(`Fetching products for event: ${eventId}`);

        // Unhide the table container when an event is clicked
        document.querySelector(".table-container").style.display = "block";

        const tableBody = document.querySelector("#myTable tbody");

        if (!tableBody) {
            console.error("Table not found in the DOM!");
            return;
        }

        tableBody.innerHTML = ""; // Clear previous products

        const productsRef = collection(db, `Events/${eventId}/Products`);
        const productsSnapshot = await getDocs(productsRef);

        if (productsSnapshot.empty) {
            tableBody.innerHTML = "<tr><td colspan='6' style='text-align:center;'><i>No products available</i></td></tr>";
            return;
        }

        productsSnapshot.forEach((productDoc) => {
            const productData = productDoc.data();
            const description = productData.Description || "No description";
            const quantityRequired = productData.QuantityRequired || 0;
            const bidAmount = productData.BidAmount || "₱ 0"; // Default bid amount
            const rank = productData.Rank || "-"; // Default rank

            // Create a row for each product
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${description}</td>
                <td style="text-align: center;">${quantityRequired}</td>
                <td style="text-align: center; padding: 5px;">
                    <input type="text" placeholder="Offer.." style="width:100px; padding: 5px; border-radius: 5px; border: 1px solid #aaa;">
                </td>                    
                <td style="text-align: center;">
                    <input type="checkbox" style="margin-left: 10px; transform: scale(1.5);">
                </td>         
                <td style="text-align: center;">${bidAmount}</td>
                <td style="text-align: center;">${rank}</td>
            `;

            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading products:", error);
    }
}
