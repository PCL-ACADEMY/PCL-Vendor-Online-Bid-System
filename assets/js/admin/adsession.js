async function displayAdminName() {
    const userType = localStorage.getItem('userType');
    if (userType !== 'admin') {
      console.log("No admin logged in!");
      return;
    }
      
    const adminEmail = localStorage.getItem('adminEmail');
    if (!adminEmail) {
      console.log("Admin email not found in session!");
      return;
    }
    
    try {
      const adminRef = collection(db, "AdminAccount");
      const q = query(adminRef, where("username", "==", adminEmail));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data();
        const adminName = docData.name || adminEmail;
          
        document.getElementById("displayName").textContent = adminName;
      } else {
        console.log("Admin document not found!");
        document.getElementById("displayName").textContent = "Admin";
      }
    } catch (error) {
      console.error("Error retrieving admin info:", error);
      document.getElementById("displayName").textContent = "Admin";
    }
  }