// Importing Firebase services and Firestore methods
import { db, auth } from "./firebase.js";
import {
  addDoc,
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import { storage } from "./firebase.js";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-storage.js";

// Initializing and handling the DOM elements when the content is fully loaded
document.addEventListener("DOMContentLoaded", function () {
  // UI elements for the post-it note application
  const openPopupButton = document.getElementById("openPopup"); // Button to open the popup to add a new post-it
  const popup = document.getElementById("popup"); // Popup element for adding a new post-it
  const titleInput = document.getElementById("titleInput"); // Input field for the post-it title
  const descriptionInput = document.getElementById("descriptionInput"); // Input field for the post-it description
  const addPostItButton = document.getElementById("addPostIt"); // Button to add a new post-it
  const closePopupButton = document.getElementById("closePopup"); // Button to close the popup
  const dropZone = document.getElementById("dropZone"); // Area where post-its are displayed and can be dragged
  const backgroundImages = [
    "/img/background1.png",
    "/img/background2.png",
    "/img/background3.png",
    "/img/background4.png",
    "/img/background5.png",
    "/img/background6.png",
  ]; // Array of background images for the application
  let currentBackgroundIndex = 0; // Index to keep track of the current background image
  // Obtenez les éléments
  var modal = document.getElementById("imageModal");
  var modalImg = document.getElementById("modalImage");
  var closeModal = document.getElementById("closeModal");

  // Récupération de l'ID de la page à partir de l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const currentPageId = urlParams.get("pageId"); // Assumed to be set in the URL

  async function displayUserPseudo() {
    if (!auth.currentUser) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const userData = docSnap.data();
      document.getElementById("userPseudo").textContent =
        "Hello," + userData.pseudo;
    }
  }

  // Function to retrieve and display post-its from Firestore
  // Fonction pour récupérer et afficher les post-its depuis Firestore
  function retrieveAndDisplayPostIts() {
    if (!auth.currentUser || !currentPageId) return; // Ne rien faire si aucun utilisateur n'est authentifié ou si pageId est manquant

    const q = query(
      collection(db, "postIts"),
      where("pageId", "==", currentPageId) // Ajouter un filtre pour le pageId
    ); // Requête Firestore pour récupérer les post-its pour l'utilisateur courant et le pageId spécifique

    onSnapshot(q, (querySnapshot) => {
      dropZone.innerHTML = ""; // Effacer la zone de dépôt avant d'afficher de nouveaux post-its
      querySnapshot.forEach((doc) => {
        const data = doc.data(); // Obtenir les données de chaque post-it
        createPostItElement(data, doc.id); // Créer et afficher chaque post-it
      });
    });
  }

  // Function to create a post-it element and add it to the page
  function createPostItElement(data, docId) {
    const postIt = document.createElement("div");
    postIt.className = "post-it draggable";
    postIt.setAttribute("draggable", "true");
    postIt.style.backgroundColor = data.color;
    postIt.dataset.docId = docId;
    postIt.innerHTML = `<h2>${data.title}</h2><p>${data.description}</p>`;
    postIt.style.left = `${data.position.x}px`;
    postIt.style.top = `${data.position.y}px`;

    const deleteButton = document.createElement("span");
    deleteButton.textContent = "✖";
    deleteButton.className = "delete-button";
    postIt.appendChild(deleteButton);

    if (data.imageURL) {
      let img = document.createElement("img");
      img.src = data.imageURL;
      img.className = "post-it-image";
      img.onclick = function () {
        modal.style.display = "block";
        modalImg.src = this.src;
      };
      postIt.appendChild(img);
    }

    deleteButton.style.position = "absolute";
    deleteButton.style.top = "0px";
    deleteButton.style.right = "0px";
    deleteButton.style.cursor = "pointer";

    deleteButton.addEventListener("click", async (event) => {
      event.stopPropagation();
      try {
        const docId = postIt.dataset.docId;
        await deleteDoc(doc(db, "postIts", docId));
        postIt.remove();
      } catch (error) {
        console.error("Erreur lors de la suppression du post-it: ", error);
      }
    });

    dropZone.appendChild(postIt);
  }

  retrieveAndDisplayPostIts(); // Call the function to retrieve and display post-its

  // Event listeners for opening and closing the popup
  openPopupButton.addEventListener("click", function () {
    popup.style.display = "block"; // Display the popup when the open button is clicked
    document.getElementById("imageInput").value = ""; // Réinitialisez ici
  });

  closePopupButton.addEventListener("click", function () {
    popup.style.display = "none"; // Hide the popup when the close button is clicked
  });

  // Événement de clic pour les images des post-its
  document.querySelectorAll(".post-it img").forEach((img) => {
    img.onclick = function () {
      modal.style.display = "block";
      modalImg.src = this.src;
    };
  });

  // Événement de clic pour fermer le modal
  closeModal.onclick = function () {
    modal.style.display = "none";
  };
  // Event listener for adding a new post-it
  // Event listener for adding a new post-it
  addPostItButton.addEventListener("click", async function () {
    const title = titleInput.value; // Récupération du titre depuis le champ de saisie
    const description = descriptionInput.value; // Récupération de la description depuis le champ de saisie
    let imageURL = null; // Initialisation de l'URL de l'image à null

    // Récupération de l'ID de la page à partir de l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const pageId = urlParams.get("pageId");

    // Logique pour gérer l'image, si présente
    const imageFile = document.getElementById("imageInput").files[0];
    if (imageFile) {
      const uploadResult = await uploadImageAndGetURL(imageFile);
      imageURL = uploadResult;
    }

    // Vérification de la présence d'un titre et d'une description
    if (title && description && auth.currentUser) {
      const newPostIt = {
        title: title,
        description: description.replace(/\n/g, "<br>"), // Remplacement des sauts de ligne par des balises <br> pour l'affichage HTML
        userId: auth.currentUser.uid,
        pageId: pageId, // Ajout de l'ID de la page au post-it
        color: getRandomColor(), // Attribution d'une couleur aléatoire ou spécifique
        position: { x: Math.random() * 500, y: Math.random() * 500 }, // Position aléatoire, à ajuster selon vos besoins
        imageURL: imageURL, // Ajout de l'URL de l'image, si présente
      };

      try {
        // Ajout du post-it à Firestore dans la collection 'postIts'
        await addDoc(collection(db, "postIts"), newPostIt);
        console.log("Post-it added successfully");
        // Fermeture de la pop-up après l'ajout réussi
        popup.style.display = "none";
        // Rafraîchissement des post-its affichés ou redirection, selon votre logique
      } catch (error) {
        console.error("Error adding post-it: ", error);
        alert("Error creating post-it: " + error.message);
      }
    } else {
      alert("Please fill in both title and description.");
    }
  });

  async function uploadImageAndGetURL(file) {
    const storageRef = ref(storage, "images/" + file.name);
    const uploadTask = await uploadBytesResumable(storageRef, file);
    return await getDownloadURL(uploadTask.ref);
  }

  // Drag and drop functionality for the post-its
  dropZone.ondragover = function (e) {
    e.preventDefault(); // Prevent the default behavior of the dragover event
    e.dataTransfer.dropEffect = "move"; // Set the drop effect to "move"
  };
  // Corrected drop functionality
  dropZone.ondrop = async function (e) {
    e.preventDefault();
    const postIt = document.querySelector(".dragging");

    if (postIt) {
      // Adjust the drop position based on the initial offsets
      const xInsideDropZone =
        e.clientX - offsetX - dropZone.getBoundingClientRect().left;
      const yInsideDropZone =
        e.clientY - offsetY - dropZone.getBoundingClientRect().top;

      postIt.style.left = `${xInsideDropZone}px`;
      postIt.style.top = `${yInsideDropZone}px`;

      // Update position in Firestore
      try {
        const docId = postIt.dataset.docId;
        await updateDoc(doc(db, "postIts", docId), {
          position: { x: xInsideDropZone, y: yInsideDropZone },
        });
      } catch (error) {
        console.error("Error updating post-it position: ", error);
      }
      postIt.classList.remove("dragging");
    }
  };

  // Event listeners for drag start and end events
  document.addEventListener("dragend", function (e) {
    const postIt = e.target; // Get the element that triggered the event

    if (postIt.classList.contains("post-it")) {
      postIt.classList.remove("dragging"); // Remove the "dragging" class from the post-it
    }
  });
  // Variables to store the initial cursor position on drag start
  let offsetX, offsetY;

  document.addEventListener("dragstart", function (e) {
    const postIt = e.target;
    if (postIt.classList.contains("post-it")) {
      // Calculate offsets from the mouse to the top-left corner of the post-it
      offsetX = e.clientX - postIt.getBoundingClientRect().left;
      offsetY = e.clientY - postIt.getBoundingClientRect().top;

      postIt.classList.add("dragging");
    }
  });

  // Function to get a random color for the post-it background
  function getRandomColor() {
    const colors = ["#fc8383", "#b8f5ff", "#fff177", "#befc7e", "#cacafa"]; // Array of color options
    return colors[Math.floor(Math.random() * colors.length)]; // Return a random color from the array
  }

  window.onclick = function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };

  // Function to change the background image of the dropZone
  function changeBackgroundImage(next = true) {
    if (next) {
      currentBackgroundIndex =
        (currentBackgroundIndex + 1) % backgroundImages.length; // Increment the background index
    } else {
      currentBackgroundIndex =
        (currentBackgroundIndex - 1 + backgroundImages.length) %
        backgroundImages.length; // Decrement the background index
    }
    const htmlElement = document.documentElement;
    htmlElement.style.backgroundImage = `url('${backgroundImages[currentBackgroundIndex]}')`; // Update the background image of the HTML element
    htmlElement.style.backgroundSize = "cover"; // Set the background size to cover the entire element
    htmlElement.style.backgroundPosition = "center"; // Center the background image
    htmlElement.style.backgroundRepeat = "no-repeat"; // Do not repeat the background image
  }

  // Event listeners for changing the background image
  document
    .getElementById("nextBackground")
    .addEventListener("click", function () {
      changeBackgroundImage(true); // Change to the next background image when clicked
    });

  document
    .getElementById("prevBackground")
    .addEventListener("click", function () {
      changeBackgroundImage(false); // Change to the previous background image when clicked
    });

  // Listener for authentication state changes
  onAuthStateChanged(auth, (user) => {
    if (user) {
      displayUserPseudo();
      retrieveAndDisplayPostIts(); // Retrieve and display post-its for the authenticated user
    } else {
      console.log("L'utilisateur est déconnecté."); // Log when no user is authenticated
      // Handle scenarios when the user is logged out, e.g., clearing the post-it display area or redirecting to a login page
    }
  });
});
