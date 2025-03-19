import { db } from "../firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Function to get document count
async function getCollectionCount(collectionName) {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.size; // Returns the number of documents
  }

  // Update the dashboard with Firestore counts
  async function updateDashboard() {
    const eventCount = await getCollectionCount("Events");
    const adminCount = await getCollectionCount("AdminAccounts");
    const companyCount = await getCollectionCount("CompanyAccounts");

    document.getElementById("eventCount").textContent = eventCount;
    document.getElementById("adminCount").textContent = adminCount;
    document.getElementById("companyCount").textContent = companyCount;
  }

  // Call the function to update the dashboard
  updateDashboard();;