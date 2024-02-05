import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {
  auth.onAuthStateChanged((user) => {
    if (user) {
      loadPages();
      document
        .getElementById("addNewPage")
        .addEventListener("click", () => togglePopup(true));
    } else {
      window.location.href = "login.html";
    }
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
    pageDiv.textContent = page.name;
    pageDiv.addEventListener("click", () => {
      window.location.href = `page.html?pageId=${doc.id}`; // Redirect with page ID
    });
    pageHolder.appendChild(pageDiv);
  });

  document
    .getElementById("addNewPage")
    .addEventListener("click", () => togglePopup(true));
}
