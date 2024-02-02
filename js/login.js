// login.js
import { auth } from "./firebase.js"; 
import { onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

// Vérifiez si l'utilisateur est déjà connecté
onAuthStateChanged(auth, user => {
    if (user) {
        // Si l'utilisateur est déjà connecté, redirigez-le vers 'index.html' ou une autre page appropriée
        window.location.href = 'index.html';
    }
    // Sinon, continuez avec la page de connexion
});

document.getElementById('login_button').addEventListener('click', function() {
    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Connexion réussie
            console.log(userCredential);
            // Redirection vers index.html ou votre tableau de bord utilisateur
            window.location.href = 'index.html';
        })
        .catch((error) => {
            var errorCode = error.code;
            var errorMessage = error.message;
            // Gérez ici les erreurs de connexion
            console.error(errorMessage);
            alert("Failed to login: " + errorMessage);
        });
});

