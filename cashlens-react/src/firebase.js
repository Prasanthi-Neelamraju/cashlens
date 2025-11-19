import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // We MUST import getAuth for authentication

// Your web app's Firebase configuration
// IMPORTANT: This configuration is unique to your project.
const firebaseConfig = {
  apiKey: "AIzaSyA5jH-Mn9e6bgoBgoCnOmSfMNbTu-rj0cU",
  authDomain: "cashlens-b9491.firebaseapp.com",
  projectId: "cashlens-b9491",
  storageBucket: "cashlens-b9491.firebasestorage.app",
  messagingSenderId: "240359598726",
  appId: "1:240359598726:web:ecefc6c89ddc40ad97ff07",
  measurementId: "G-S2L9Z5SSM2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);