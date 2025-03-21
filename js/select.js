import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  onSnapshot,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

document.getElementById("cancelButton").textContent = "✖";

document.addEventListener("DOMContentLoaded", function () {
  auth.onAuthStateChanged(async (user) => {
    // Marquez cette fonction comme async
    if (user) {
      loadPages();
      const addButton = document.getElementById("addNewPage");
      const cancelButton = document.getElementById("cancelButton");

      if (addButton) {
        addButton.addEventListener("click", () => togglePopup(true));
      } else {
        console.log("L'élément 'addNewPage' n'existe pas.");
      }

      if (cancelButton) {
        cancelButton.addEventListener("click", () => togglePopup(false));
      } else {
        console.log("L'élément 'cancelButton' n'existe pas.");
      }

      // Ajouté : Mettre à jour le pseudo de l'utilisateur
      try {
        const pseudo = await getUserPseudo(user.uid); // Utilisation de await dans une fonction async
        const userPseudoSpan = document.getElementById("userPseudo");
        if (userPseudoSpan) userPseudoSpan.textContent = "Hello, " + pseudo;
      } catch (error) {
        console.error(
          "Erreur lors de la récupération du pseudo de l'utilisateur",
          error
        );
      }
    } else {
      window.location.href = "login.html";
    }
  });
});

// Gestionnaire d'événements pour le bouton de déconnexion
document
  .getElementById("disconnectButton")
  .addEventListener("click", function () {
    auth
      .signOut()
      .then(() => {
        console.log("L'utilisateur est déconnecté");
        window.location.href = "login.html"; // Rediriger l'utilisateur vers la page de connexion après la déconnexion
      })
      .catch((error) => {
        console.error("Erreur lors de la déconnexion", error);
      });
  });

function togglePopup(show) {
  const popup = document.getElementById("pageCreationPopup");
  popup.style.display = show ? "block" : "none";
}

document
  .getElementById("joinPageButton")
  .addEventListener("click", async () => {
    const pageId = document.getElementById("searchInput").value.trim();
    if (!pageId) {
      alert("Veuillez entrer un ID de page valide.");
      return;
    }

    const pageRef = doc(db, "pages", pageId);
    const pageSnap = await getDoc(pageRef);
    if (pageSnap.exists()) {
      const userPageRef = collection(db, "userPages");
      const q = query(
        userPageRef,
        where("userId", "==", auth.currentUser.uid),
        where("pageId", "==", pageId)
      );
      const querySnapshot = await getDocs(q);

      console.log(
        `Résultats trouvés pour l'utilisateur et la pageId : ${querySnapshot.docs.length}`
      ); // Logging pour diagnostiquer

      if (querySnapshot.empty) {
        await addDoc(userPageRef, {
          userId: auth.currentUser.uid,
          pageId: pageId,
        });
        console.log("Page ajoutée avec succès à votre pageHolder.");
      } else {
        console.log("Vous avez déjà accès à cette page.");
      }
      window.location.href = `page.html?pageId=${pageId}`;
    } else {
      alert("Page non trouvée.");
    }
  });

async function getUserPseudo(uid) {
  const userRef = doc(db, "users", uid);
  const userDoc = await getDoc(userRef);
  if (userDoc.exists()) {
    return userDoc.data().pseudo;
  } else {
    console.log("No such user!");
    return null;
  }
}

document.getElementById("createPage").addEventListener("click", async () => {
  const pageName = document.getElementById("newPageName").value.trim();
  if (!pageName) {
    alert("Please enter a name for the page.");
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    alert("No authenticated user found.");
    return;
  }

  const pseudo = await getUserPseudo(user.uid);
  if (!pseudo) {
    alert("User pseudo not found.");
    return;
  }

  try {
    const docRef = await addDoc(collection(db, "pages"), {
      name: pageName,
      userId: user.uid,
      pseudo: pseudo,
    });
    console.log("Page created successfully with ID: ", docRef.id);
    togglePopup(false);
    loadPages(); // Reload pages to include the newly created one
  } catch (error) {
    console.error("Error adding document: ", error);
    alert("Error creating page: " + error.message);
  }
});
// Fonction pour supprimer une page
async function deletePage(pageId, pageDiv) {
  try {
    await deleteDoc(doc(db, "pages", pageId));
    console.log("Page deleted successfully");
    pageDiv.remove(); // Supprimer la div de la page
  } catch (error) {
    console.error("Error removing document: ", error);
    alert("Error deleting page: " + error.message);
  }
}

async function loadPages() {
  const user = auth.currentUser;
  if (!user) return;

  const pageHolder = document.getElementById("pageHolder");
  pageHolder.innerHTML = ""; // Nettoyer le pageHolder avant de le remplir

  // Charger les pages créées par l'utilisateur
  const pagesQuery = query(
    collection(db, "pages"),
    where("userId", "==", user.uid)
  );
  const querySnapshot = await getDocs(pagesQuery);
  querySnapshot.forEach((doc) => {
    addPageToHolder(doc.data(), doc.id);
  });

  // Charger les pages que l'utilisateur a rejointes via la collection userPages
  const userPagesQuery = query(
    collection(db, "userPages"),
    where("userId", "==", user.uid)
  );
  const userPagesSnapshot = await getDocs(userPagesQuery);
  for (const userPageDoc of userPagesSnapshot.docs) {
    const pageRef = doc(db, "pages", userPageDoc.data().pageId);
    const pageSnap = await getDoc(pageRef);
    if (pageSnap.exists()) {
      addPageToHolder(pageSnap.data(), pageSnap.id);
    }
  }

  // Ajouter le bouton pour créer une nouvelle page, si nécessaire
  addNewPageButton();
}

// Dans la fonction qui charge les pages, après avoir récupéré chaque document de page

function addPageToHolder(page, pageId) {
  const pageHolder = document.getElementById("pageHolder");
  const pageElement = document.createElement("div");
  pageElement.className = "page";
  pageElement.textContent = page.name;

  // Créer l'élément de la bulle de notification
  const notificationBubble = document.createElement("div");
  notificationBubble.className = "notification-bubble";
  // Afficher ou masquer la bulle en fonction de la propriété hasNewNotifications
  notificationBubble.style.display = page.hasNewNotifications
    ? "block"
    : "none";
  notificationBubble.setAttribute("data-page-id", pageId);

  // Ajouter la bulle de notification à l'élément de la page
  pageElement.appendChild(notificationBubble);

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.textContent = "✖";
  deleteButton.onclick = function () {
    deletePage(pageId, pageElement);
  };

  pageElement.appendChild(deleteButton);

  // Écouteur d'événements pour gérer les clics sur la pageElement et potentiellement réinitialiser hasNewNotifications
  pageElement.addEventListener("click", async (event) => {
    // Assurez-vous que le clic n'est pas sur le bouton de suppression
    if (event.target === deleteButton) {
      // Ne faites rien si le bouton de suppression est cliqué
      event.stopPropagation(); // Optionnel, pour éviter que l'événement ne se propage plus loin
    } else if (page.hasNewNotifications) {
      // Si le clic est sur l'élément de la page et qu'il y a des notifications
      const pageRef = doc(db, "pages", pageId);
      try {
        await updateDoc(pageRef, { hasNewNotifications: false });
        notificationBubble.style.display = "none"; // Cachez la bulle de notification
      } catch (error) {
        console.error("Erreur lors de la mise à jour du document : ", error);
      }
      window.location.href = `page.html?pageId=${pageId}`; // Redirige vers la page liée
    } else {
      // Si aucune notification n'est active, redirige simplement vers la page
      window.location.href = `page.html?pageId=${pageId}`;
    }
  });

  pageHolder.appendChild(pageElement);
}

function addNewPageButton() {
  const pageHolder = document.getElementById("pageHolder");
  const addNewPageDiv = document.createElement("div");
  addNewPageDiv.id = "addNewPage";
  addNewPageDiv.className = "page";
  addNewPageDiv.style = "justify-content: center; align-items: center;";
  addNewPageDiv.innerHTML =
    '<span style="font-size: 4em; cursor: pointer;">+</span>';
  addNewPageDiv.addEventListener("click", () => togglePopup(true));
  pageHolder.appendChild(addNewPageDiv);
}
