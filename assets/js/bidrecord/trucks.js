import { db } from "../firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

async function fetchAndDisplayBids() {
    try {
        console.log("Fetching 10WheelerTrucks collection...");
        const trucksRef = collection(db, "10WheelerTrucks");
        const trucksSnapshot = await getDocs(trucksRef);
        
        if (trucksSnapshot.empty) {
            console.log("No trucks found in Firestore!");
            return;
        }

        console.log(`Found ${trucksSnapshot.docs.length} trucks`);
        const displayArea = document.getElementById("truckTables");
        displayArea.innerHTML = ""; // Clear previous content

        for (const truckDoc of trucksSnapshot.docs) {
            const truckData = truckDoc.data();
            const truckId = truckDoc.id;

            console.log(`Fetching bids for truck: ${truckId}`);

            const bidsRef = collection(db, "10WheelerTrucks", truckId, "Bids");
            const bidsSnapshot = await getDocs(bidsRef);

            if (bidsSnapshot.empty) {
                console.log(`No bids found for ${truckId}`);
                continue;
            }

            console.log(`Found ${bidsSnapshot.docs.length} bids for ${truckId}`);

            // Create Truck Information and Bidding Table
            let truckCard = document.createElement("div");
            truckCard.className = "col-12";
            truckCard.innerHTML = `
                <div class="card recent-sales overflow-auto">
                    <div class="card-body">
                        <h5 class="card-title">
                            <table border="0" cellspacing="0">
                                <thead>
                                    <tr>
                                        <th scope="col" style="padding: 0 15px;">Units</th>
                                        <th scope="col" style="padding: 0 15px;">Van Type</th>
                                        <th scope="col" style="padding: 0 15px;">Height</th>
                                        <th scope="col" style="padding: 0 15px;">Width</th>
                                        <th scope="col" style="padding: 0 15px;">Length</th>
                                        <th scope="col" style="padding: 0 15px;">Tonnage</th>
                                        <th scope="col" style="padding: 0 15px;">Temperature</th>
                                        <th scope="col" style="padding: 0 15px;">Ceiling Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style="padding: 0 15px;">${truckData.Units || "N/A"}</td>
                                        <td style="padding: 0 15px;">${truckData.VanType || "N/A"}</td>
                                        <td style="padding: 0 15px;">${truckData.Height || "N/A"}</td>
                                        <td style="padding: 0 15px;">${truckData.Width || "N/A"}</td>
                                        <td style="padding: 0 15px;">${truckData.Length || "N/A"}</td>
                                        <td style="padding: 0 15px;">${truckData.Tonnage || "N/A"}</td>
                                        <td style="padding: 0 15px;">${truckData.Temperature || "N/A"}</td>
                                        <td style="padding: 0 15px;">${truckData.CeilingPrice || "N/A"}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </h5>
                        <hr>
                        <table class="table datatable">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Bid Amount</th>
                                    <th>Company Name</th>
                                </tr>
                            </thead>
                            <tbody id="bids-${truckId}">
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            displayArea.appendChild(truckCard);

            // Populate Bids Table
            const bidsTableBody = document.getElementById(`bids-${truckId}`);
            bidsSnapshot.forEach(bidDoc => {
                const bidData = bidDoc.data();
                let row = document.createElement("tr");
                row.innerHTML = `
                    <td>${bidData.Rank || "N/A"}</td>
                    <td>${bidData.BidAmmount || "N/A"}</td>
                    <td>${bidData.VendorID || "Unknown Vendor"}</td>
                `;
                bidsTableBody.appendChild(row);
            });
        }

    } catch (error) {
        console.error("Error fetching bids:", error);
    }
}

// Run function on page load
window.onload = fetchAndDisplayBids;
