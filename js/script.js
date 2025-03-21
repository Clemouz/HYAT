// Importing Firebase services and Firestore methods
import { db, auth } from "./firebase.js";
import {
  addDoc,
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  getDoc,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import { storage } from "./firebase.js";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-storage.js";

// Fonction pour charger l'arrière-plan depuis Firestore lors du chargement de la page
async function loadBackgroundFromFirestore(pageId) {
  const pageRef = doc(db, "pages", pageId);
  const docSnap = await getDoc(pageRef);

  if (docSnap.exists() && docSnap.data().background) {
    // Si le document et l'arrière-plan existent, mettez à jour le style de dropZone
    const backgroundUrl = docSnap.data().background;
    const dropZone = document.getElementById("dropZone");
    dropZone.style.backgroundImage = `url('${backgroundUrl}')`;
  } else {
    console.log("Aucun arrière-plan trouvé pour cette page dans Firestore.");
  }
}

// Initializing and handling the DOM elements when the content is fully loaded
document.addEventListener("DOMContentLoaded", function () {
  const openPopupButton = document.getElementById("openPopup"); // Button to open the popup to add a new post-it
  const popup = document.getElementById("popup"); // Popup element for adding a new post-it
  const titleInput = document.getElementById("titleInput"); // Input field for the post-it title
  const descriptionInput = document.getElementById("descriptionInput"); // Input field for the post-it description
  const addPostItButton = document.getElementById("addPostIt"); // Button to add a new post-it
  const closePopupButton = document.getElementById("closePopup"); // Button to close the popup
  const dropZone = document.getElementById("dropZone"); // Area where post-its are displayed and can be dragged
  const backgroundImages = [
    "../img/background1.png",
    "../img/background2.png",
    "../img/background3.png",
    "../img/background4.png",
    "../img/background5.png",
    "../img/background6.png",
  ]; // Array of background images for the application
  let currentBackgroundIndex = 0; // Index to keep track of the current background image
  // Obtenez les éléments
  var modal = document.getElementById("imageModal");
  var modalImg = document.getElementById("modalImage");
  var closeModal = document.getElementById("closeModal");

  const dropZoneWidth = dropZone.offsetWidth;
  const dropZoneHeight = dropZone.offsetHeight;

  // Récupération de l'ID de la page à partir de l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const currentPageId = urlParams.get("pageId"); // Assumed to be set in the URL

  const settingsButton = document.getElementById("settingsButton");
  const settingsDropdown = document.getElementById("settingsDropdown");

  if (currentPageId) {
    loadBackgroundFromFirestore(currentPageId);
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

  // Fonction pour basculer le menu déroulant
  function toggleDropdown() {
    settingsDropdown.classList.toggle("hidden");
  }

  // Ajoutez un écouteur d'événements pour le bouton de réglages
  settingsButton.addEventListener("click", function (event) {
    event.stopPropagation();
    toggleDropdown();
  });

  // Copie l'ID de la page dans le presse-papiers
  document.getElementById("copyPageId").addEventListener("click", function () {
    const pageIdElement = document.getElementById("pageIdDisplay");
    if (pageIdElement) {
      // Supposons que le texte soit "Page ID: 886ljhyjkBlEMFR5Egju"
      const pageIdText = pageIdElement.textContent || pageIdElement.innerText;
      // Divise le texte par ": " et prend le second élément du tableau résultant, qui est l'ID
      const pageId = pageIdText.split(": ")[1];
      navigator.clipboard
        .writeText(pageId)
        .then(() => {
          alert("Page ID copied to clipboard");
        })
        .catch((err) => console.error("Error copying Page ID", err));
    } else {
      console.error("Element with ID 'pageIdDisplay' was not found.");
    }
  });

  // Déconnexion de l'utilisateur
  document.getElementById("signOut").addEventListener("click", function () {
    // Utilisez votre méthode de déconnexion Firebase Auth ou autre
    auth.signOut().then(() => {
      // Redirigez vers la page de connexion ou traitez la déconnexion comme vous le souhaitez
      console.log("User signed out");
    });
  });

  // Ferme le menu déroulant si on clique en dehors
  window.addEventListener("click", function () {
    if (!settingsDropdown.classList.contains("hidden")) {
      toggleDropdown();
    }
  });
  // Function to create a post-it element and add it to the page
  function createPostItElement(data, docId) {
    const postIt = document.createElement("div");
    postIt.className = "post-it draggable";
    postIt.setAttribute("draggable", "true");
    postIt.style.backgroundColor = data.color;
    postIt.dataset.docId = docId;

    // Supposons que data.description peut contenir du texte brut potentiellement avec des URLs
    const linkedDescription = linkify(data.description); // Transforme les URLs en balises <a>

    postIt.innerHTML = `<h2>${data.title}</h2><p>${linkedDescription}</p>`;
    postIt.style.left = `${data.position.x}px`;
    postIt.style.top = `${data.position.y}px`;

    const editButton = document.createElement("span");
    editButton.textContent = "✎"; // Use an icon or text that represents editing
    editButton.className = "edit-button";
    editButton.style.position = "absolute";
    editButton.style.top = "5px";
    editButton.style.left = "5px";
    editButton.style.cursor = "pointer";
    editButton.style.color = "#151515";
    postIt.appendChild(editButton);

    const deleteButton = document.createElement("span");
    deleteButton.textContent = "✖";
    deleteButton.className = "delete-button";
    deleteButton.style.position = "absolute";
    deleteButton.style.top = "5px";
    deleteButton.style.right = "5px";
    deleteButton.style.color = "#151515";
    postIt.appendChild(deleteButton);

    if (data.imageURL) {
      let img = document.createElement("img");
      img.src = data.imageURL;
      img.className = "post-it-image";
      img.onclick = function () {
        modal.style.display = "block"; // Affiche la modal
        modalImg.src = this.src; // Définit la source de l'image de la modal
      };
      postIt.appendChild(img);
    }

    deleteButton.style.position = "absolute";
    deleteButton.style.top = "5px";
    deleteButton.style.right = "5px";
    deleteButton.style.cursor = "pointer";

    deleteButton.addEventListener("click", async (event) => {
      event.stopPropagation(); // Empêche l'événement de se propager à d'autres gestionnaires
      try {
        const docId = postIt.dataset.docId; // Assurez-vous que `postIt` a bien un attribut `data-doc-id`
        await deleteDoc(doc(db, "postIts", docId)); // Supprime le post-it de Firestore
        postIt.remove(); // Supprime le post-it de l'interface utilisateur
      } catch (error) {
        console.error(
          "Erreur lors de la suppression du post-it ou de la mise à jour des notifications: ",
          error
        );
      }
    });

    // Event listener for the Edit button
    editButton.addEventListener("click", function () {
      openEditPopup(data, docId);
    });

    dropZone.appendChild(postIt);
  }

  retrieveAndDisplayPostIts(); // Call the function to retrieve and display post-its

  function linkify(inputText) {
    var replacedText, replacePattern1;

    // URLs starting with http://, https://, or ftp://
    // Simplified pattern to capture more broadly until a space or specific delimiter
    replacePattern1 = /(\b(https?|ftp):\/\/[^\s"<>\[\]]*[^\s"<>\[\],.!?:;])/gim;
    replacedText = inputText.replace(
      replacePattern1,
      '<a href="$1" target="_blank">$1</a>'
    );

    // Return the text with URLs converted into links
    return replacedText;
  }

  function openEditPopup(data, docId) {
    const popup = document.getElementById("editPopup"); // The edit popup element
    const titleInput = document.getElementById("editTitleInput"); // Edit title input
    const descriptionInput = document.getElementById("editDescriptionInput"); // Edit description input
    const imageInput = document.getElementById("editImageInput"); // Edit image input
    const colorInput = document.getElementById("editColorInput"); // Ajouté: Sélecteur de couleur

    // Pre-fill form inputs with existing data
    titleInput.value = data.title;
    descriptionInput.value = data.description.replace(/<br\s*\/?>/gi, "\n"); // Convert <br> back to newline for editing

    // Display the popup
    popup.style.display = "block";

    // IMPORTANT: Remove any existing event listeners from the save button to prevent duplicate handlers
    const saveButton = document.getElementById("saveEdit");
    const newSaveButton = saveButton.cloneNode(true);
    saveButton.parentNode.replaceChild(newSaveButton, saveButton);

    // Save button event listener to update Firestore and close the popup
    newSaveButton.addEventListener("click", function () {
      // Retrieve updated values from form
      const updatedTitle = titleInput.value;
      const updatedDescription = descriptionInput.value;
      const updatedColor = document.getElementById("editColorInput").value;
      // Handle the updated image and color

      // Update Firestore document
      const postItRef = doc(db, "postIts", docId);
      updateDoc(postItRef, {
        title: updatedTitle,
        description: updatedDescription.replace(/\n/g, "<br>"), // Convert newlines to <br> for display
        color: updatedColor,
        // Include updated fields for image and color
      })
        .then(() => {
          console.log("Post-it updated successfully");
          popup.style.display = "none"; // Close the popup
          // Optionally refresh the displayed post-its or directly update the UI
        })
        .catch((error) => {
          console.error("Error updating post-it: ", error);
        });
    });

    // Close button functionality
    document
      .getElementById("closeEditPopup")
      .addEventListener("click", function () {
        document.getElementById("editPopup").style.display = "none";
      });
  }
  // Attend que le DOM soit entièrement chargé
  $(document).ready(function () {
    $("#dropZone").on("scroll", function () {
      var scrollHeight = $(this)[0].scrollHeight;
      var scrollPosition = $(this).innerHeight() + $(this).scrollTop();

      // Vérifie si nous sommes à moins de 100 pixels du bas.
      if (scrollPosition + 100 >= scrollHeight) {
        var newElement = $('<div style="height: 600px;"></div>');
        $("#dropZone").append(newElement);
      }
    });
  });

  // Event listeners for opening and closing the popup
  openPopupButton.addEventListener("click", function () {
    popup.style.display = "block"; // Display the popup when the open button is clicked
    document.getElementById("imageInput").value = ""; // Réinitialisez ici
  });

  closePopupButton.addEventListener("click", function () {
    popup.style.display = "none"; // Hide the popup when the close button is clicked
  });

  // Événement de clic pour fermer le modal
  closeModal.onclick = function () {
    modal.style.display = "none";
  };

  // Attacher un événement click délégué à dropZone
  dropZone.addEventListener("click", function (event) {
    if (event.target.classList.contains("post-it-image")) {
      modal.style.display = "block";
      modalImg.src = event.target.src;
    }
  });

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
    if ((title || description) && auth.currentUser) {
      const newPostIt = {
        title: title,
        description: description.replace(/\n/g, "<br>"), // Remplacement des sauts de ligne par des balises <br> pour l'affichage HTML
        userId: auth.currentUser.uid,
        pageId: pageId, // Ajout de l'ID de la page au post-it
        color: getRandomColor(), // Attribution d'une couleur aléatoire ou spécifique
        position: {
          x: Math.random() * dropZoneWidth,
          y: Math.random() * dropZoneHeight,
        }, // Position aléatoire, à ajuster selon vos besoins
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

  dropZone.ondragover = function (e) {
    e.preventDefault(); // Prévenir le comportement par défaut.

    const dropZoneRect = dropZone.getBoundingClientRect(); // Obtient les dimensions de dropZone et sa position relative au viewport.
    const relativeY = e.clientY - dropZoneRect.top; // Calcule la position Y du curseur relative à dropZone.

    const threshold = 100; // Seuil pour déclencher le scroll.
    const scrollSpeed = 20; // Vitesse de défilement.

    if (relativeY > threshold + dropZone.offsetHeight / 2) {
      // Si le curseur est proche du bas de dropZone, déclencher le défilement vers le bas.
      dropZone.scrollTop += scrollSpeed;
    } else if (relativeY < threshold) {
      // Si le curseur est proche du haut de dropZone, déclencher le défilement vers le haut.
      dropZone.scrollTop -= scrollSpeed;
    }
  };

  // Corrected drop functionality
  dropZone.ondrop = async function (e) {
    e.preventDefault();
    const postIt = document.querySelector(".dragging");

    if (postIt) {
      // Calcule la position à l'intérieur de dropZone en tenant compte du défilement
      const dropZoneRect = dropZone.getBoundingClientRect();
      const xInsideDropZone =
        e.clientX - dropZoneRect.left + dropZone.scrollLeft;
      const yInsideDropZone = e.clientY - dropZoneRect.top + dropZone.scrollTop;

      postIt.style.left = `${xInsideDropZone - offsetX}px`;
      postIt.style.top = `${yInsideDropZone - offsetY}px`;

      // Mettez à jour la position dans Firestore ou votre stockage de données ici
      try {
        const docId = postIt.dataset.docId;
        await updateDoc(doc(db, "postIts", docId), {
          position: {
            x: xInsideDropZone - offsetX,
            y: yInsideDropZone - offsetY,
          },
        });
      } catch (error) {
        console.error(
          "Erreur lors de la mise à jour de la position du post-it : ",
          error
        );
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

  $(window).scroll(function () {
    if ($(window).scrollTop() + $(window).height() == $(document).height()) {
      console.log("Vous êtes au bas de la page.");
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

  // Fonction pour changer l'arrière-plan d'une page
  async function changeBackgroundImage(pageId, next = true) {
    // Récupère la référence du document dans Firestore
    const pageRef = doc(db, "pages", pageId);

    // Calcule le nouvel indice de l'arrière-plan
    if (next) {
      currentBackgroundIndex =
        (currentBackgroundIndex + 1) % backgroundImages.length;
    } else {
      currentBackgroundIndex =
        (currentBackgroundIndex - 1 + backgroundImages.length) %
        backgroundImages.length;
    }

    // Détermine l'URL de l'arrière-plan sélectionné
    const selectedBackgroundUrl = backgroundImages[currentBackgroundIndex];

    try {
      // Met à jour le champ 'background' du document
      await updateDoc(pageRef, {
        background: selectedBackgroundUrl,
      });

      // Met à jour l'arrière-plan dans l'interface utilisateur si nécessaire
      const dropZone = document.getElementById("dropZone");
      dropZone.style.backgroundImage = `url('${selectedBackgroundUrl}')`;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'arrière-plan :", error);
    }
  }

  document
    .getElementById("nextBackground")
    .addEventListener("click", function () {
      const pageIdText = document.getElementById("pageIdDisplay").innerText;
      // Nettoyez l'ID de la page en enlevant tout ce qui n'est pas l'ID lui-même
      const pageId = pageIdText.replace("Page ID: ", ""); // Enlevez le préfixe "Page ID: "
      changeBackgroundImage(pageId, true);
    });

  document
    .getElementById("prevBackground")
    .addEventListener("click", function () {
      const pageIdText = document.getElementById("pageIdDisplay").innerText;
      // De même, nettoyez l'ID de la page ici
      const pageId = pageIdText.replace("Page ID: ", ""); // Enlevez le préfixe "Page ID: "
      changeBackgroundImage(pageId, false);
    });

  // Listener for authentication state changes
  onAuthStateChanged(auth, (user) => {
    if (user) {
      retrieveAndDisplayPostIts(); // Retrieve and display post-its for the authenticated user
    } else {
      console.log("L'utilisateur est déconnecté."); // Log when no user is authenticated
      // Handle scenarios when the user is logged out, e.g., clearing the post-it display area or redirecting to a login page
    }
  });
});
