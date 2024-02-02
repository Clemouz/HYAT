// Importing Firebase services and Firestore methods
import { db, auth } from "./firebase.js";
import { addDoc, collection, query, where, onSnapshot, deleteDoc, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import { storage } from "./firebase.js";
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-storage.js";



// Initializing and handling the DOM elements when the content is fully loaded
document.addEventListener("DOMContentLoaded", function() {
  // UI elements for the post-it note application
  const openPopupButton = document.getElementById("openPopup"); // Button to open the popup to add a new post-it
  const popup = document.getElementById("popup"); // Popup element for adding a new post-it
  const titleInput = document.getElementById("titleInput"); // Input field for the post-it title
  const descriptionInput = document.getElementById("descriptionInput"); // Input field for the post-it description
  const addPostItButton = document.getElementById("addPostIt"); // Button to add a new post-it
  const closePopupButton = document.getElementById("closePopup"); // Button to close the popup
  const dropZone = document.getElementById("dropZone"); // Area where post-its are displayed and can be dragged
  const backgroundImages = ["/img/background1.png", "/img/background2.png", "/img/background3.png", "/img/background4.png", "/img/background5.png","/img/background6.png"]; // Array of background images for the application
  let currentBackgroundIndex = 0; // Index to keep track of the current background image
  // Obtenez les éléments
  var modal = document.getElementById("imageModal");
  var modalImg = document.getElementById("modalImage");
  var closeModal = document.getElementById("closeModal");

  async function displayUserPseudo() {
    if (!auth.currentUser) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const userData = docSnap.data();
      document.getElementById('userPseudo').textContent = userData.pseudo;
    }
  }

  // Function to retrieve and display post-its from Firestore
  function retrieveAndDisplayPostIts() {
    if (!auth.currentUser) return; // Do nothing if no user is authenticated

    const q = query(collection(db, "postIts"), where("userId", "==", auth.currentUser.uid)); // Firestore query to retrieve post-its for the current user

    onSnapshot(q, (querySnapshot) => {
      dropZone.innerHTML = ''; // Clear the drop zone before displaying new post-its
      querySnapshot.forEach((doc) => {
        const data = doc.data(); // Get data of each post-it
        createPostItElement(data, doc.id); // Create and display each post-it
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
      img.onclick = function() {
        modal.style.display = "block";
        modalImg.src = this.src;
      };
      postIt.appendChild(img);
    }
  
    deleteButton.style.position = "absolute";
    deleteButton.style.top = "0px";
    deleteButton.style.right = "0px";
    deleteButton.style.cursor = "pointer";
  
    deleteButton.addEventListener('click', async (event) => {
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
  openPopupButton.addEventListener("click", function() {
    popup.style.display = "block"; // Display the popup when the open button is clicked
    document.getElementById("imageInput").value = ''; // Réinitialisez ici
  });

  closePopupButton.addEventListener("click", function() {
    popup.style.display = "none"; // Hide the popup when the close button is clicked
  });

  // Événement de clic pour les images des post-its
document.querySelectorAll('.post-it img').forEach(img => {
  img.onclick = function(){
      modal.style.display = "block";
      modalImg.src = this.src;
  }
});

// Événement de clic pour fermer le modal
closeModal.onclick = function() { 
  modal.style.display = "none";
}
  // Event listener for adding a new post-it
  addPostItButton.addEventListener("click", async function() {
    const title = titleInput.value; // Get the title from the input field
    const description = descriptionInput.value; // Get the description from the input field
    let imageURL = null; // Initialisez imageURL ici
    // Ajoutez la logique pour gérer l'image
    const imageFile = document.getElementById("imageInput").files[0];
    if (imageFile) {
    imageURL = await uploadImageAndGetURL(imageFile);
  }



    if (title && description && auth.currentUser) {
      var formattedDescription = description.replace(/\n/g, '<br>'); // Format the description with line breaks
      const postIt = document.createElement("div"); // Create a new div element for the post-it
      postIt.className = "post-it draggable"; // Assign class names for styling and draggability
      postIt.setAttribute("draggable", "true"); // Make the post-it draggable
      postIt.style.backgroundColor = getRandomColor(); // Set a random background color for the post-it
      postIt.innerHTML = `<h2>${title}</h2><p>${formattedDescription}</p>`; // Set the title and formatted description of the post-it

      // Position the post-it randomly within the drop zone
      const dropX = Math.random() * (dropZone.clientWidth - postIt.offsetWidth);
      const dropY = Math.random() * (dropZone.clientHeight - postIt.offsetHeight);

      postIt.style.left = dropX + "px"; // Set the horizontal position
      postIt.style.top = dropY + "px"; // Set the vertical position

      dropZone.appendChild(postIt); // Add the post-it to the drop zone

      titleInput.value = ""; // Clear the title input field
      descriptionInput.value = ""; // Clear the description input field
      popup.style.display = "none"; // Hide the popup

      try {
        await addDoc(collection(db, "postIts"), {
          userId: auth.currentUser.uid, // User ID of the authenticated user
          title: title, // Title of the post-it
          description: formattedDescription, // Formatted description of the post-it
          color: postIt.style.backgroundColor, // Background color of the post-it
          position: { x: dropX, y: dropY }, // Position of the post-it
          imageURL: imageURL // Ajoutez l'URL de l'image ici
        });
      } catch (error) {
        console.error("Erreur lors de l'ajout du document : ", error); // Log any errors
      }
    }
  });

  async function uploadImageAndGetURL(file) {
    const storageRef = ref(storage, 'images/' + file.name);
    const uploadTask = await uploadBytesResumable(storageRef, file);
    return await getDownloadURL(uploadTask.ref);
  }
  

  // Drag and drop functionality for the post-its
  dropZone.ondragover = function(e) {
    e.preventDefault(); // Prevent the default behavior of the dragover event
    e.dataTransfer.dropEffect = "move"; // Set the drop effect to "move"
  };

  dropZone.ondrop = async function(e) {
    e.preventDefault(); // Prevent the default behavior of the drop event
    const data = e.dataTransfer.getData("text/plain"); // Get the data being dragged (if any)
    const postIt = document.querySelector(".dragging"); // Get the post-it element being dragged

    if (postIt) {
      const dropX = e.clientX - dropZone.getBoundingClientRect().left; // Calculate the horizontal drop position
      const dropY = e.clientY - dropZone.getBoundingClientRect().top; // Calculate the vertical drop position

      const left = dropX - postIt.offsetWidth / 2; // Adjust the horizontal position based on the post-it width
      const top = dropY - postIt.offsetHeight / 2; // Adjust the vertical position based on the post-it height

      postIt.style.left = left + "px"; // Set the adjusted horizontal position
      postIt.style.top = top + "px"; // Set the adjusted vertical position
      try {
        const docId = postIt.dataset.docId; // Retrieve the document ID from the dataset
        await updateDoc(doc(db, "postIts", docId), {
          position: { x: left, y: top } // Update the position of the post-it in Firestore
        });
      } catch (error) {
        console.error("Erreur lors de la mise à jour de la position du post-it: ", error); // Log any errors
      }
    }
  };

  // Event listeners for drag start and end events
  document.addEventListener("dragend", function(e) {
    const postIt = e.target; // Get the element that triggered the event

    if (postIt.classList.contains("post-it")) {
      postIt.classList.remove("dragging"); // Remove the "dragging" class from the post-it
    }
  });

  document.addEventListener("dragstart", function(e) {
    const postIt = e.target; // Get the element that triggered the event

    if (postIt.classList.contains("post-it")) {
      postIt.classList.add("dragging"); // Add the "dragging" class to the post-it
    }
  });

  // Function to get a random color for the post-it background
  function getRandomColor() {
    const colors = ["#ff7373", "#AED9E0", "#fff177", "#B3E283","#D0D0E7"]; // Array of color options
    return colors[Math.floor(Math.random() * colors.length)]; // Return a random color from the array
  }

  window.onclick = function(event) {
    if (event.target === modal) {
        modal.style.display = "none";
    }
}; 

  // Function to change the background image of the dropZone
  function changeBackgroundImage(next = true) {
    if (next) {
      currentBackgroundIndex = (currentBackgroundIndex + 1) % backgroundImages.length; // Increment the background index
    } else {
      currentBackgroundIndex = (currentBackgroundIndex - 1 + backgroundImages.length) % backgroundImages.length; // Decrement the background index
    }
    const htmlElement = document.documentElement;
    htmlElement.style.backgroundImage = `url('${backgroundImages[currentBackgroundIndex]}')`; // Update the background image of the HTML element
    htmlElement.style.backgroundSize = 'cover'; // Set the background size to cover the entire element
    htmlElement.style.backgroundPosition = 'center'; // Center the background image
    htmlElement.style.backgroundRepeat = 'no-repeat'; // Do not repeat the background image
  }

  // Event listeners for changing the background image
  document.getElementById("nextBackground").addEventListener("click", function() {
    changeBackgroundImage(true); // Change to the next background image when clicked
  });

  document.getElementById("prevBackground").addEventListener("click", function() {
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
