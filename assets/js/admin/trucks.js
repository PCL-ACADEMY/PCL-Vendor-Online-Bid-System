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
        // Add event listeners after content is loaded
        attachEventListeners();
    } else {
        console.error("Error: truckTablesContainer not found.");
    }
});

function attachEventListeners() {
    // Update form submission
    const updateForm = document.getElementById("updateTruckForm");
    if (updateForm) {
        updateForm.addEventListener("submit", handleUpdateFormSubmit);
    }
    
    // Remove truck button
    const removeBtn = document.getElementById("removeTruckBtn");
    if (removeBtn) {
        removeBtn.addEventListener("click", handleRemoveTruck);
    }
    
    // Update buttons in the table
    const updateBtns = document.querySelectorAll(".update-btn");
    updateBtns.forEach(btn => {
        btn.addEventListener("click", handleUpdateButtonClick);
    });
    
    // Start buttons in the table
    const startBtns = document.querySelectorAll(".start-btn");
    startBtns.forEach(btn => {
        btn.addEventListener("click", handleStartButtonClick);
    });
}

// Add this function to count trucks and display the total
// Add this function to count trucks and display only the total
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

    // Display only the total count number
    const countElement = document.getElementById("count-trucks");
    if (countElement) {
        countElement.textContent = totalTrucks;
    }
}

// Modify your DOMContentLoaded event to include the count function
document.addEventListener("DOMContentLoaded", async function () {
    const truckTablesContainer = document.getElementById("truckTables");

    if (truckTablesContainer) {
        truckTablesContainer.innerHTML = "<p>Loading data...</p>";
        const truckData = await fetchTruckData();
        truckTablesContainer.innerHTML = truckData;
        // Add event listeners after content is loaded
        attachEventListeners();
        
        // Count and display truck totals
        await countAndDisplayTrucks();
    } else {
        console.error("Error: truckTablesContainer not found.");
    }
});

// Also update the fetchTruckData function to return row counts
async function fetchTruckData() {
    let content = "";
    const truckCollections = [
        { name: "10 Wheeler Trucks", collectionName: "10WheelerTrucks" },
        { name: "6 Wheeler Trucks", collectionName: "6WheelerTrucks" }
    ];

    for (const truckType of truckCollections) {
        const querySnapshot = await getDocs(collection(db, truckType.collectionName));
        const rowCount = querySnapshot.size;

        if (!querySnapshot.empty) {
            let table = `<div class="col-12">
                <div class="card recent-sales overflow-auto">
                    <div class="card-body">
                        <h5 class="card-title">${truckType.name} (${rowCount})</h5>
                        <table class="table table-borderless datatable">
                            <thead>
                                <tr>
                                    <th scope="col">Units</th>
                                    <th scope="col">Van Type</th>
                                    <th scope="col">Height</th>
                                    <th scope="col">Width</th>
                                    <th scope="col">Length</th>
                                    <th scope="col">Tonnage</th>
                                    <th scope="col">Temperature</th>
                                    <th scope="col">Ceiling Price</th>
                                    <th scope="col">Start Time</th>
                                    <th scope="col">Duration (Seconds)</th>
                                    <th scope="col">Action</th>
                                </tr>
                            </thead>
                            <tbody>`;

            querySnapshot.forEach(doc => {
                const data = doc.data();
                const startTime = data.StartTime ? 
                    new Date(data.StartTime.seconds * 1000).toLocaleString() : "N/A";  
                const duration = data.Duration ? `${data.Duration} sec` : "N/A";

                table += `<tr>
                    <td>${data.Units || "N/A"}</td>
                    <td>${data.VanType || "N/A"}</td>
                    <td>${data.Height || "N/A"}</td>
                    <td>${data.Width || "N/A"}</td>
                    <td>${data.Length || "N/A"}</td>
                    <td>${data.Tonnage || "N/A"}</td>
                    <td>${data.Temperature || "N/A"}</td>
                    <td>${data.CeilingPrice || "N/A"}</td>
                    <td>${startTime}</td>
                    <td>${duration}</td>
                    <td>
                        <button class="btn btn-success start-btn" data-id="${doc.id}" data-collection="${truckType.collectionName}">Start</button>
                        <button class="btn btn-primary update-btn" data-id="${doc.id}" data-collection="${truckType.collectionName}" data-bs-toggle="modal" data-bs-target="#updateModal">Update</button>
                    </td>
                </tr>`;
            });

            table += `</tbody></table></div></div></div>`;
            content += table;
        } else {
            content += `<div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">${truckType.name} (0)</h5>
                        <p>No trucks available in this category.</p>
                    </div>
                </div>
            </div>`;
        }
    }

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