// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
//import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBp9lcuwHLv0K7L0SdAmv_wOFIIEITHcT0",
  authDomain: "pcl-bidding-system.firebaseapp.com",
  projectId: "pcl-bidding-system",
  storageBucket: "pcl-bidding-system.firebasestorage.app",
  messagingSenderId: "740584475401",
  appId: "1:740584475401:web:570a6a9c1411e4483c21d8",
  measurementId: "G-RN370CQG08"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
const db = getFirestore (app);

export { db }