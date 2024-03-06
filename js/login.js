import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

// Vérifie si l'utilisateur est déjà connecté
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Redirection si l'utilisateur est déjà connecté
    window.location.href = "select.html";
  }
});

// Fonction pour gérer la connexion
function handleLogin() {
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Connexion réussie, redirection vers la page d'accueil ou tableau de bord
      window.location.href = "select.html";
    })
    .catch((error) => {
      // Gestion des erreurs de connexion
      alert("Échec de la connexion : " + error.message);
    });
}

// Gestion de la connexion de l'utilisateur lors du clic sur le bouton
document.getElementById("login_button").addEventListener("click", handleLogin);

// Ajout de l'écouteur d'événements sur le champ de mot de passe pour gérer la touche Entrée
document
  .getElementById("password")
  .addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault(); // Empêcher l'action par défaut
      handleLogin(); // Appeler directement handleLogin au lieu de simuler un clic
    }
  });

// Ajouter l'écouteur d'événements sur le champ email pour gérer la touche Entrée
document.getElementById("email").addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault(); // Empêcher l'action par défaut
    handleLogin(); // Appeler directement handleLogin
  }
});

// Reste du code pour la gestion de réinitialisation du mot de passe...

// Gestion du clic sur le lien de réinitialisation du mot de passe
document
  .getElementById("forgotPasswordLink")
  .addEventListener("click", function (event) {
    event.preventDefault(); // Prévenir le comportement par défaut du lien
    // Afficher le formulaire de réinitialisation du mot de passe
    document.getElementById("resetPasswordPopup").style.display = "flex";
  });

// Fermeture de la pop-up lorsque l'utilisateur clique sur la croix
document.querySelector(".close-button").addEventListener("click", function () {
  document.getElementById("resetPasswordPopup").style.display = "none";
});

// Gestion de la réinitialisation du mot de passe
document
  .getElementById("resetPasswordButton")
  .addEventListener("click", function () {
    var emailAddress = document.getElementById("resetEmail").value;
    sendPasswordResetEmail(auth, emailAddress)
      .then(() => {
        // Email de réinitialisation envoyé, notifier l'utilisateur
        alert(
          "Un email de réinitialisation de mot de passe a été envoyé à " +
            emailAddress
        );
        // Fermer le formulaire de réinitialisation du mot de passe
        document.getElementById("resetPasswordForm").style.display = "none";
      })
      .catch((error) => {
        // Gestion des erreurs d'envoi de l'email
        alert(
          "Erreur lors de l'envoi de l'email de réinitialisation : " +
            error.message
        );
      });
  });
