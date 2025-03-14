// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAY6t5KqiUX8bbWjfhgjs-XTNLhy0M4Wio",
    authDomain: "pcl-app-10984.firebaseapp.com",
    projectId: "pcl-app-10984",
    storageBucket: "pcl-app-10984.firebasestorage.app",
    messagingSenderId: "329888119021",
    appId: "1:329888119021:web:aaec0580a9270b9ec6f4e4",
    measurementId: "G-2LKY8NTFLL"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const db = getFirestore (app);

export { db }