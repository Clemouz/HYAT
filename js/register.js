import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import {
  doc,
  setDoc,
  collection,
  addDoc,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

document
  .getElementById("register_button")
  .addEventListener("click", async function () {
    var pseudo = document.getElementById("pseudo").value;
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;

    try {
      // Créer un nouvel utilisateur avec email et mot de passe
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("Utilisateur créé avec succès : ", userCredential.user);

      // Utiliser l'UID de l'utilisateur pour stocker des informations supplémentaires dans Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        pseudo: pseudo,
        email: email,
      });

      // Créer une page "Main" pour l'utilisateur dans Firestore
      const pagesRef = collection(db, "pages");
      const pageDocRef = await addDoc(pagesRef, {
        userId: userCredential.user.uid,
        name: "Main",
        pseudo: pseudo,
      });
      console.log("Page 'Main' créée avec succès avec l'ID : ", pageDocRef.id);
      console.log("Informations de l'utilisateur stockées dans Firestore");

      // Redirection vers 'select.html' après l'enregistrement
      // Nom de votre repository GitHub
      const repoName = "nom-de-votre-repo";

      // Construit le chemin de base en fonction de l'emplacement actuel
      let basePath = window.location.href.includes(repoName)
        ? `/${repoName}`
        : "";

      // Construit le chemin complet vers select.html
      let pathToSelectHtml = `${basePath}/html/select.html`;

      // Redirige vers select.html
      window.location.href = pathToSelectHtml;
    } catch (error) {
      console.error("Erreur lors de l'inscription : ", error);
      alert("Erreur lors de l'inscription : " + error.message);
    }
  });

// Code pour gérer l'appui sur la touche Entrée dans les champs d'entrée
function triggerRegisterOnEnter(event) {
  if (event.key === "Enter") {
    event.preventDefault(); // Empêcher l'action par défaut de la touche Entrée
    document.getElementById("register_button").click(); // Simuler un clic sur le bouton d'inscription
  }
}

// Ajout de l'écouteur d'événements sur les champs d'entrée
document
  .getElementById("pseudo")
  .addEventListener("keypress", triggerRegisterOnEnter);
document
  .getElementById("email")
  .addEventListener("keypress", triggerRegisterOnEnter);
document
  .getElementById("password")
  .addEventListener("keypress", triggerRegisterOnEnter);
