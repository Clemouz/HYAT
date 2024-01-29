import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

// Vérifie si l'utilisateur est déjà connecté
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Si l'utilisateur est déjà connecté, redirigez-le vers 'index.html'
    console.log("Redirection car l'utilisateur est déjà connecté");
    window.location.href = 'index.html';
  }
});

document.getElementById('register_button').addEventListener('click', async function() {
  var pseudo = document.getElementById('pseudo').value;
  var email = document.getElementById('email').value;
  var password = document.getElementById('password').value;

  try {
    // Créer un nouvel utilisateur
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Utilisateur créé avec succès : ", userCredential.user);

    // Tentative d'enregistrer le pseudo dans Firestore
    console.log("Tentative d'enregistrement du pseudo dans Firestore");
    await setDoc(doc(db, "users", userCredential.user.uid), {
      pseudo: pseudo
    });
    console.log("Pseudo enregistré dans Firestore");

    // Redirection vers 'index.html' après l'enregistrement
    window.location.href = 'index.html';
  } catch (error) {
    console.error("Erreur : ", error);
    alert("Erreur lors de l'inscription : " + error.message);
  }
});