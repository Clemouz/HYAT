// auth.js
import { auth } from "./firebase.js"; // Assurez-vous que le chemin est correct
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  }
});

const handleSignOut = () => {
  signOut(auth)
    .then(() => {
      window.location.href = "index.html";
    })
    .catch((error) => {
      console.error("Erreur lors de la déconnexion", error);
    });
};

document
  .getElementById("disconnectButton")
  ?.addEventListener("click", handleSignOut);
