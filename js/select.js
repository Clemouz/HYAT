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
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {
  auth.onAuthStateChanged((user) => {
    if (user) {
      loadPages();
      document
        .getElementById("addNewPage")
        .addEventListener("click", () => togglePopup(true));
      document
        .getElementById("cancelButton")
        .addEventListener("click", () => togglePopup(false));
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

  const pagesQuery = query(
    collection(db, "pages"),
    where("userId", "==", user.uid)
  );
  const querySnapshot = await getDocs(pagesQuery);
  const pageHolder = document.getElementById("pageHolder");

  pageHolder.innerHTML = "";

  // Re-create the "Add New Page" button
  const addNewPageDiv = document.createElement("div");
  addNewPageDiv.id = "addNewPage";
  addNewPageDiv.className = "page";
  addNewPageDiv.style = "justify-content: center; align-items: center;";
  addNewPageDiv.innerHTML =
    '<span style="font-size: 4em; cursor: pointer;">+</span>';
  pageHolder.appendChild(addNewPageDiv);

  querySnapshot.forEach((doc) => {
    const page = doc.data();
    const pageDiv = document.createElement("div");
    pageDiv.className = "page";

    const pageNameSpan = document.createElement("span");
    pageNameSpan.textContent = page.name;
    pageDiv.appendChild(pageNameSpan);

    const deleteCross = document.createElement("span");
    deleteCross.textContent = "✖";
    deleteCross.className = "delete-cross";
    deleteCross.onclick = function (event) {
      event.stopPropagation();
      deletePage(doc.id, pageDiv);
    };
    pageDiv.appendChild(deleteCross);

    pageDiv.addEventListener("click", () => {
      window.location.href = `page.html?pageId=${doc.id}`;
    });

    pageHolder.appendChild(pageDiv);
  });

  document
    .getElementById("addNewPage")
    .addEventListener("click", () => togglePopup(true));
}
