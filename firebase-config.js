// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyANrDN94AdVBHoKUab3yPcHKnN4vawtzUk",
  authDomain: "blindtest-e5591.firebaseapp.com",
  databaseURL: "https://blindtest-e5591-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "blindtest-e5591",
  storageBucket: "blindtest-e5591.firebasestorage.app",
  messagingSenderId: "358552361111",
  appId: "1:358552361111:web:a8d06912a796d2a49eb1d2",
  measurementId: "G-40XKYT2P1G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
