import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

document.getElementById('register_button').addEventListener('click', async function() {
  var pseudo = document.getElementById('pseudo').value;
  var email = document.getElementById('email').value;
  var password = document.getElementById('password').value;

  try {
    // Créer un nouvel utilisateur avec email et mot de passe
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Utilisateur créé avec succès : ", userCredential.user);

    // Utiliser l'UID de l'utilisateur pour stocker des informations supplémentaires dans Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      pseudo: pseudo,
      email: email // Optionnel si vous voulez aussi stocker l'email
    });

    console.log("Informations de l'utilisateur stockées dans Firestore");

    // Redirection vers 'index.html' après l'enregistrement
    window.location.href = 'index.html';
  } catch (error) {
    console.error("Erreur lors de l'inscription : ", error);
    alert("Erreur lors de l'inscription : " + error.message);
  }
});

