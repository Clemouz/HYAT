// Importation des services et méthodes Firebase nécessaires
import { db, auth } from "./firebase.js";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {
  // Vérification de l'état d'authentification de l'utilisateur
  auth.onAuthStateChanged((user) => {
    if (user) {
      // Extraction de l'ID de la page à partir de l'URL
      const urlParams = new URLSearchParams(window.location.search);
      const pageId = urlParams.get("pageId");

      // Affichage de l'ID de la page dans le header
      displayPageId(pageId);

      // Chargement des post-its spécifiques à l'ID de la page
      if (pageId) {
        loadPostItsForPage(user.uid, pageId);
      } else {
        console.error("Page ID is missing.");
      }
    } else {
      // Redirection vers la page de connexion si l'utilisateur n'est pas connecté
      window.location.href = "login.html";
    }
  });
});

// Fonction pour afficher l'ID de la page dans le header
function displayPageId(pageId) {
  const pageIdDisplay = document.getElementById("pageIdDisplay");
  if (pageIdDisplay) {
    pageIdDisplay.textContent = `Page ID: ${pageId}`;
  }
}

// Fonction pour charger les post-its spécifiques à une page
async function loadPostItsForPage(userId, pageId) {
  // Construction de la requête pour récupérer les post-its
  const postItsQuery = query(
    collection(db, "postIts"),
    where("userId", "==", userId),
    where("pageId", "==", pageId)
  );

  // Écoute des mises à jour en temps réel pour les post-its
  onSnapshot(postItsQuery, (querySnapshot) => {
    const postItContainer = document.getElementById("postItContainer");
    postItContainer.innerHTML = ""; // Réinitialisation du conteneur de post-its

    // Création et affichage des post-its
    querySnapshot.forEach((doc) => {
      const postIt = doc.data();
      // Ici, vous ajouterez le code pour créer et afficher les post-its
      // en fonction des données récupérées (postIt)
    });
  });
}
