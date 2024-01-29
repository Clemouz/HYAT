
  // Import the functions you need from the SDKs you need
  import { getFirestore } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-analytics.js";
  import { getAuth } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
  import { getStorage, ref } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-storage.js";



  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries
  
  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyDpe1E5Wqbsp7TPz8Dry27frCQ42F5HG4E",
    authDomain: "hyat-ad4a9.firebaseapp.com",
    projectId: "hyat-ad4a9",
    storageBucket: "hyat-ad4a9.appspot.com",
    messagingSenderId: "683657743502",
    appId: "1:683657743502:web:c634411b96b897f2630ddf",
    measurementId: "G-DVH3MKMBK5"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);
  
  export { app, analytics, auth, db, storage };
