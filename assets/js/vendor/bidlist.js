import { db } from "../firebase-config.js";
import { 
    collection,  
    getDocs, 
    getDoc, 
    updateDoc, 
    deleteDoc, 
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async function () {
    const truckTablesContainer = document.getElementById("truckTables");

    if (truckTablesContainer) {
        truckTablesContainer.innerHTML = "<p>Loading data...</p>";
        const truckData = await fetchTruckData();
        truckTablesContainer.innerHTML = truckData;
        attachEventListeners();
    } else {
        console.error("Error: truckTablesContainer not found.");
    }
});

function attachEventListeners() {
    const updateForm = document.getElementById("updateTruckForm");
    if (updateForm) {
        updateForm.addEventListener("submit", handleUpdateFormSubmit);
    }
    
    const removeBtn = document.getElementById("removeTruckBtn");
    if (removeBtn) {
        removeBtn.addEventListener("click", handleRemoveTruck);
    }
    const updateBtns = document.querySelectorAll(".update-btn");
    updateBtns.forEach(btn => {
        btn.addEventListener("click", handleUpdateButtonClick);
    });
    const startBtns = document.querySelectorAll(".start-btn");
    startBtns.forEach(btn => {
        btn.addEventListener("click", handleStartButtonClick);
    });
}

async function countAndDisplayTrucks() {
    let totalTrucks = 0;
    const truckCollections = [
        { name: "10 Wheeler Trucks", collectionName: "10WheelerTrucks" },
        { name: "6 Wheeler Trucks", collectionName: "6WheelerTrucks" }
    ];

    for (const truckType of truckCollections) {
        const querySnapshot = await getDocs(collection(db, truckType.collectionName));
        totalTrucks += querySnapshot.size;
    }

    const countElement = document.getElementById("count-trucks");
    if (countElement) {
        countElement.textContent = totalTrucks;
    }
}

document.addEventListener("DOMContentLoaded", async function () {
    const truckTablesContainer = document.getElementById("truckTables");

    if (truckTablesContainer) {
        truckTablesContainer.innerHTML = "<p>Loading data...</p>";
        const truckData = await fetchTruckData();
        truckTablesContainer.innerHTML = truckData;
        attachEventListeners();
        
        await countAndDisplayTrucks();
    } else {
        console.error("Error: truckTablesContainer not found.");
    }
});

async function fetchTruckData() {
    let content = "";
    const truckCollections = [
        { name: "10 Wheeler Trucks", collectionName: "10WheelerTrucks" },
        { name: "6 Wheeler Trucks", collectionName: "6WheelerTrucks" }
    ];

    // Timer Box HTML (Fixed to top-right corner)
    content += `
        <div id="timerBox" style="position: fixed; top: 10px; right: 10px; background: #fff; padding: 10px 20px; border: 1px solid #ccc; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); font-size: 16px; z-index: 9999;">
            Time: <span id="timer"></span>
        </div>
    `;

    content += `
        <div class="col-12">
       <div style="padding: 10px; font-size: 1.2em; font-weight: bold; background-color: #f0f8ff; border-radius: 5px;">
        My Bid Rank: (#)
    </div>
            <div class="card recent-sales overflow-auto">
                <div class="card-body mt-3">
                    <table class="table datatable" style="width: 100%;">
                        <thead>
                            <tr>
                                <th scope="col" style="padding: 1 15px; width: 13%;">Truck Type</th>
                                <th scope="col" style="padding: 1 15px; width: 35%;">Description</th>
                                <th scope="col" style="padding: 1 15px; width: 7%; text-align: center;">Qty Req</th>
                                <th scope="col" style="padding: 1 15px; width: 10%; text-align: center;">Qty Offer</th>
                                <th scope="col" style="padding: 1 15px; width: 10%; text-align: center;">Bid Amount</th>
                                <th scope="col" style="padding: 1 15px; width: 7%; text-align: center;">Rank</th>
                            </tr>
                        </thead>
                        <tbody>
    `;

    // Loop through the truck collections and fetch the data
    for (const truckType of truckCollections) {
        const querySnapshot = await getDocs(collection(db, truckType.collectionName));
        const rowCount = querySnapshot.size;

        if (!querySnapshot.empty) {
            // Add a row for the truck type
            querySnapshot.forEach(doc => {
                const data = doc.data();

                content += `    
                        <tr>
                            <td style="padding: 10px 15px; text-align: left;">${truckType.name}</td>
                            <td style="padding: 10px 15px; text-align: left;">
                                ${data.Units || "N/A"}, ${data.VanType || "N/A"}, ${data.Height || "N/A"}, 
                                ${data.Width || "N/A"}, ${data.Length || "N/A"}, ${data.Tonnage || "N/A"}, 
                                ${data.Temperature || "N/A"}, ${data.CeilingPrice || "N/A"}
                            </td>
                            <td style="padding: 10px 15px; text-align: center;">22</td>
                            <td style="padding: 10px 15px; text-align: center;">
                                <input type="text" id="qtyOffer" style="width: 50%; padding: px; border-radius: 5px; border: 1px solid #ccc;">
                            </td>
                            <td style="padding: 10px 15px; text-align: center;">
                                <input type="checkbox" id="bidAmountCheckbox" style="margin-right: 5px;">ㅤ
                                <span>₱ 777</span>
                            </td>
                            <td style="padding: 10px 15px; text-align: center;">9</td>

                        </tr>
                `;
            });
        }
    }

    content += `
                        </tbody>
                    </table>
                   <div style="display: flex; justify-content: flex-end; align-items: center;">
                        <input type="text" id="decrease" style="width: 10%; padding: 5px; margin-right: 1%; border-radius: 5px; border: 1px solid #ccc;">
                        <button type="submit" class="btn btn-primary me-">Decrement</button>
                    </div>
                </div> 
            </div>
        </div>
    `;

    // Add Timer functionality
    setInterval(() => {
        const timerElement = document.getElementById("timer");
        const now = new Date();
        const timeString = now.toLocaleTimeString();  // Format the time
        timerElement.textContent = timeString;  // Update the timer text
    }, 1000);  // Update every second

    return content || "<p>No available trucks.</p>";
}


// Handle click on update button
async function handleUpdateButtonClick(event) {
    const truckId = event.target.getAttribute("data-id");
    const collectionName = event.target.getAttribute("data-collection");

    try {
        console.log("Loading truck data for ID:", truckId, "Collection:", collectionName);
        
        // Get truck details from Firestore
        const docRef = doc(db, collectionName, truckId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("Truck data loaded:", data);
            
            // Populate hidden fields
            document.getElementById("truckId").value = truckId;
            document.getElementById("truckCollection").value = collectionName;
            
            // Populate form fields with existing data
            document.getElementById("updateUnits").value = data.Units || "";
            document.getElementById("updateVanType").value = data.VanType || "";
            document.getElementById("updateHeight").value = data.Height || "";
            document.getElementById("updateWidth").value = data.Width || "";
            document.getElementById("updateLength").value = data.Length || "";
            document.getElementById("updateTonnage").value = data.Tonnage || "";
            document.getElementById("updateTemperature").value = data.Temperature || "";
            document.getElementById("updateCeilingPrice").value = data.CeilingPrice || "";
            
            // Format the datetime for the StartTime field
            if (data.StartTime) {
                const startDate = new Date(data.StartTime.seconds * 1000);
                const formattedDate = startDate.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
                document.getElementById("updateStartTime").value = formattedDate;
            } else {
                document.getElementById("updateStartTime").value = "";
            }
        } else {
            console.error("No such document!");
            alert("Truck data not found. Please try again.");
        }
    } catch (error) {
        console.error("Error getting document:", error);
        alert("Error loading truck data: " + error.message);
    }
}

// Handle start button click
async function handleStartButtonClick(event) {
    const truckId = event.target.getAttribute("data-id");
    const collectionName = event.target.getAttribute("data-collection");
    
    try {
        // Get current truck data
        const truckRef = doc(db, collectionName, truckId);
        const truckSnap = await getDoc(truckRef);
        
        if (!truckSnap.exists()) {
            alert("Truck not found!");
            return;
        }
        
        // Set the start time
        const now = new Date();
        const startTime = {
            seconds: Math.floor(now.getTime() / 1000),
            nanoseconds: 0
        };
        
        // Update the document
        await updateDoc(truckRef, {
            StartTime: startTime,
            Duration: 0
        });
        
        alert("Truck started successfully!");
        location.reload();
    } catch (error) {
        console.error("Error starting truck:", error);
        alert("Error starting truck: " + error.message);
    }
}

// Update Truck Data
async function handleUpdateFormSubmit(event) {
    event.preventDefault();
    
    const truckId = document.getElementById("truckId").value;
    const collectionName = document.getElementById("truckCollection").value;
    
    if (!truckId || !collectionName) {
        alert("Missing truck information. Please try again.");
        return;
    }
    
    try {
        console.log("Updating truck ID:", truckId, "Collection:", collectionName);
        
        // Prepare update data
        const updatedData = {
            Units: document.getElementById("updateUnits").value,
            VanType: document.getElementById("updateVanType").value,
            Height: document.getElementById("updateHeight").value,
            Width: document.getElementById("updateWidth").value,
            Length: document.getElementById("updateLength").value,
            Tonnage: document.getElementById("updateTonnage").value,
            Temperature: document.getElementById("updateTemperature").value,
            CeilingPrice: document.getElementById("updateCeilingPrice").value
        };
        
        // Handle StartTime separately if it exists
        const startTimeInput = document.getElementById("updateStartTime").value;
        if (startTimeInput) {
            const startDate = new Date(startTimeInput);
            updatedData.StartTime = {
                seconds: Math.floor(startDate.getTime() / 1000),
                nanoseconds: 0
            };
        }
        
        console.log("Update data:", updatedData);

        // Get reference to the document
        const truckRef = doc(db, collectionName, truckId);
        
        // Update the document
        await updateDoc(truckRef, updatedData);
        
        console.log("Document successfully updated");
        alert("Truck details updated successfully!");
        
        // Close the modal
        closeModal();
        
        // Reload page to show updated data
        location.reload();
    } catch (error) {
        console.error("Error updating document:", error);
        alert("Error updating truck details: " + error.message);
    }
}

// Remove Truck Data
async function handleRemoveTruck() {
    const truckId = document.getElementById("truckId").value;
    const collectionName = document.getElementById("truckCollection").value;

    if (!truckId || !collectionName) {
        alert("Missing truck information. Please try again.");
        return;
    }

    if (confirm("Are you sure you want to remove this truck?")) {
        try {
            console.log("Removing truck ID:", truckId, "Collection:", collectionName);
            
            // Delete the document
            const truckRef = doc(db, collectionName, truckId);
            await deleteDoc(truckRef);
            
            console.log("Document successfully deleted");
            alert("Truck removed successfully!");
            
            // Close the modal
            closeModal();
            
            // Reload page to show updated data
            location.reload();
        } catch (error) {
            console.error("Error removing document:", error);
            alert("Error removing truck: " + error.message);
        }
    }
}

// Helper function to close modal
function closeModal() {
    const modalElement = document.getElementById('updateModal');
    
    // Try using Bootstrap modal instance
    if (window.bootstrap) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
            return;
        }
    }
    
    // Fallback: manual modal closing
    modalElement.classList.remove('show');
    modalElement.style.display = 'none';
    document.body.classList.remove('modal-open');
    
    // Remove backdrop
    const backdrops = document.getElementsByClassName('modal-backdrop');
    while (backdrops.length > 0) {
        backdrops[0].parentNode.removeChild(backdrops[0]);
    }
}




// Add debug info
console.log("Trucks.js script loaded. Firebase DB reference:", db);