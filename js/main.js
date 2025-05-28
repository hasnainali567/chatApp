import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, setDoc, db, doc, query, where, getDocs, collection, getDoc, updateDoc, arrayUnion, serverTimestamp, orderBy, addDoc, onSnapshot } from "./firebase.js";

const layer = document.getElementById('layer');
const signUpBtn = document.getElementById('signUpBtn');
const loginBtn = document.getElementById('loginBtn');
const signUpEmailInp = document.getElementById('signUpEmailInp');
const signUpPasswordInp = document.getElementById('signUpPasswordInp');
const profilePic = document.getElementById('profilePic');
const ProfileImg = document.getElementById('ProfileImg');
const profileUpload = document.getElementById('profile-upload');
const signInEmailInp = document.getElementById('signInEmailInp');
const signInPasswordInp = document.getElementById('signInPasswordInp');
const searchEmailInput = document.getElementById('searchEmailInput');
const contactItems = document.querySelectorAll('.contact-item');
const chatLoader = document.getElementById('chatLoader');
const appContainer = document.querySelector('.app-container');
const registerContainerWrapper = document.querySelector('.register-container-wrapper');
const signUp = document.querySelector('.sign-up');
const signIn = document.querySelector('.sign-in');
const emailValidate = document.querySelector('.emailValidate');
const passValidate = document.querySelector('.passValidate');
const imageSelect = document.querySelector('.image-select');
const signUpShow = document.querySelector('.signUpShow');
const signInShow = document.querySelector('.signInShow');
const contactList = document.getElementById('contactList');
const chatSection = document.getElementById('chatSection');
const addUser = document.getElementById('addUser');
const closeAddUser = document.getElementById('closeAddUser');
const searchUserBtn = document.getElementById('searchUserBtn');
const contactListContaner = document.getElementById('contact-list-contaner');
let chatId = '';

onAuthStateChanged(auth, async (user) => {
  if (user) {
    registerContainerWrapper.classList.add('d-none')
    appContainer.classList.remove('d-none');
    const userDocRef = doc(db, "users", user.uid);
    await updateDoc(userDocRef, {
      lastActive: serverTimestamp(),
      isOnline: true
    });
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const friendsList = userData.friends || [];

      if (friendsList.length > 0) {
        const contacts = setFriends(...friendsList);
        if (contacts.length > 0) {
          contactListContaner.innerHTML = '';
          contacts.forEach(elem => {
            contactListContaner.prepend(elem)
          })
        }
      }

    }

    chatLoader.classList.add('d-none');
  } else {
    chatLoader.classList.add('d-none')
  }
})


addUser.addEventListener('click', () => {
  document.querySelector('.custom-modal-wrapper').classList.remove('d-none');
  document.querySelector('.custom-modal-wrapper').classList.add('d-flex');

})
closeAddUser.addEventListener('click', () => {
  document.querySelector('.custom-modal-wrapper').classList.add('d-none')
})

profileUpload.addEventListener('change', (e) => {
  let file = profileUpload.files[0];

  if (file) {
    const reader = new FileReader();

    reader.onloadend = () => {
      const base64 = reader.result;
      ProfileImg.src = base64;  // image preview
      console.log("Base64 String:", base64); // Optional: log base64 string
    };

    reader.readAsDataURL(file); // important line to convert to base64
  }
});


const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
const passRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

function validateInputs() {
  const email = signUpEmailInp.value.trim();
  const pass = signUpPasswordInp.value.trim();

  const isEmailValid = emailRegex.test(email);
  const isPassValid = passRegex.test(pass);

  // Email error
  if (email.length === 0) {
    emailValidate.innerText = "";
  } else if (!isEmailValid) {
    emailValidate.innerText = "Please enter a valid email address.";
  } else {
    emailValidate.innerText = "";
  }

  // Password error
  if (pass.length === 0) {
    passValidate.innerText = "";
  } else if (!isPassValid) {
    passValidate.innerText = "Password must be at least 8 characters and include 1 uppercase, 1 lowercase and 1 number.";
  } else {
    passValidate.innerText = "";
  }

  // Enable button only if both are valid
  signUpBtn.disabled = !(isEmailValid && isPassValid);
}

signUpEmailInp.addEventListener('input', validateInputs);
signUpPasswordInp.addEventListener('input', validateInputs);


signUpBtn.addEventListener('click', async (e) => {
  e.preventDefault();

  signUpBtn.innerHTML = `
    <div class="spinner-grow text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
    <div class="spinner-grow text-secondary" role="status"><span class="visually-hidden">Loading...</span></div>
    <div class="spinner-grow text-success" role="status"><span class="visually-hidden">Loading...</span></div>
  `;

  let email = signUpEmailInp.value;
  let pass = signUpPasswordInp.value;
  let name = document.getElementById('nameInp');
  let profileImage = "";
  const file = profileUpload.files[0];

  try {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          profileImage = reader.result;

          let userCredential = await createUserWithEmailAndPassword(auth, email, pass);
          let userId = userCredential.user.uid;

          await setDoc(doc(db, 'users', userId), {
            name: name.value,
            email,
            userId,
            profileImage
          });

          signUpBtn.innerHTML = `Sign Up`;
        } catch (error) {
          handleSignupError(error);
        }
      };
      reader.readAsDataURL(file);
    } else {
      let userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      let userId = userCredential.user.uid;

      await setDoc(doc(db, 'users', userId), {
        name: name.value,
        email,
        userId,
        profileImage: "https://img.freepik.com/premium-vector/user-profile-icon-flat-style-member-avatar-vector-illustration-isolated-background-human-permission-sign-business-concept_157943-15752.jpg?semt=ais_hybrid&w=740"
      });

      signUpBtn.innerHTML = `Sign Up`;
    }
  } catch (error) {
    handleSignupError(error);
  }

  function handleSignupError(error) {
    console.log(error.message);
    if (error.message?.includes('email-already-in-use')) {
      showToast('Email already in Use!');
    } else {
      showToast(error.message || "Something went wrong!");
    }
    signUpBtn.innerHTML = `Sign Up`;
  }
});


function validateSignInInputs() {
  const email = signInEmailInp.value.trim();
  const pass = signInPasswordInp.value.trim();

  const isEmailValid = emailRegex.test(email);
  const isPassValid = passRegex.test(pass);

  // Email error
  if (email.length === 0) {
    emailValidate.innerText = "";
  } else if (!isEmailValid) {
    emailValidate.innerText = "Please enter a valid email address.";
  } else {
    emailValidate.innerText = "";
  }

  // Password error
  if (pass.length === 0) {
    passValidate.innerText = "";
  } else if (!isPassValid) {
    passValidate.innerText = "Password must be at least 8 characters and include 1 uppercase, 1 lowercase and 1 number.";
  } else {
    passValidate.innerText = "";
  }

  // Enable button only if both are valid
  loginBtn.disabled = !(isEmailValid && isPassValid);
}

signInEmailInp.addEventListener('input', validateSignInInputs);
signInPasswordInp.addEventListener('input', validateSignInInputs);

// Sign In Button Logic
loginBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  loginBtn.innerHTML = `
  <div class="spinner-grow text-primary" role="status">
    <span class="visually-hidden">Loading...</span>
  </div>
  <div class="spinner-grow text-secondary" role="status">
    <span class="visually-hidden">Loading...</span>
  </div>
  <div class="spinner-grow text-success" role="status">
    <span class="visually-hidden">Loading...</span>
  </div>`;

  const email = signInEmailInp.value.trim();
  const pass = signInPasswordInp.value.trim();

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    console.log("Login Success", userCredential.user);
    chatLoader.classList.remove('d-none');
    chatLoader.classList.add('d-flex');
    console.log(appContainer);
    registerContainerWrapper.classList.add('d-none')
    appContainer.classList.remove('d-none');
    chatLoader.classList.add('d-none')
  } catch (error) {
    console.log(error.message);

    if (error.message.includes("user-not-found")) {
      showToast("User not found. Please check your email.");
    } else if (error.message.includes("wrong-password")) {
      showToast("Incorrect password. Try again.");
    } else {
      showToast(error.message || "Something went wrong!");
    }

    loginBtn.innerHTML = `Sign In`;
  }
});


function showToast(message) {
  const toastContainer = document.createElement('div');
  toastContainer.className = 'toast align-items-center show position-fixed';
  toastContainer.setAttribute('role', 'alert');
  toastContainer.setAttribute('aria-live', 'assertive');
  toastContainer.setAttribute('aria-atomic', 'true');
  toastContainer.style.top = '50px';
  toastContainer.style.right = '20px';
  toastContainer.style.zIndex = '9999';
  toastContainer.style.minWidth = '250px';
  toastContainer.style.maxWidth = '280px';

  toastContainer.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        ${message}
      </div>
      <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  document.body.appendChild(toastContainer);

  // Auto remove after 5 seconds
  setTimeout(() => {
    toastContainer.remove();
  }, 5000);
}



searchEmailInput.addEventListener('input', () => {
  let value = searchEmailInput.value.trim();

  if (value.match(emailRegex)) {
    console.log('Valid email');
    searchUserBtn.removeAttribute('disabled');
  } else {
    searchUserBtn.setAttribute('disabled', 'true');
  }
});

searchUserBtn.addEventListener('click', async () => {
  let search = searchEmailInput.value.trim().toLowerCase();

  console.log("Searching for:", search);

  const q = query(
    collection(db, 'users'),
    where("email", "==", search)
  );

  try {
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      showToast("No user found with this email.");
      return;
    }

    querySnapshot.forEach(async (res) => {
      const userData = res.data();
      const currentUser = auth.currentUser;

      if (userData.userId === currentUser.uid) {
        showToast("You can't add yourself.");
        return;
      }

      const currentUserDocRef = doc(db, "users", currentUser.uid);
      const currentUserDoc = await getDoc(currentUserDocRef);
      const currentUserData = currentUserDoc.data();

      const isAlreadyFriend = (currentUserData.friends || []).includes(userData.userId);

      if (isAlreadyFriend) {
        showToast("This user is already in your contact list.");
        return;
      }

      // ✅ Add the user to current user's friends list
      await updateDoc(currentUserDocRef, {
        friends: arrayUnion({
          name: userData.name,
          email: userData.email,
          uid: userData.userId,
          profileImage: userData.profileImage
        })
      });
      showToast(`${userData.name} added to your contacts.`);

      // Optionally: update UI immediately with new contact
      const contactElem = setFriends(userData);
      if (Array.isArray(contactElem)) {
        contactElem.forEach(elem => contactListContaner.prepend(elem));
      } else if (contactElem) {
        contactListContaner.prepend(contactElem);
      }

      // clear input
      searchEmailInput.value = '';
      searchUserBtn.disabled = true;
    });
  } catch (err) {
    console.error("Search error:", err);
    showToast("Something went wrong while searching.");
  }
});

const defaultChatScreen = document.getElementById('defaultChatScreen');
function setFriends(...friends) {

  let contacts = []

  friends.forEach(elem => {
    let contact = createContactItem(elem);

    contact.addEventListener('click', async (e) => {
      createChatId(e);
      openChat(chatId);
      if (window.innerWidth >= 660) {
        createChat(elem);
      } else {
        createChatMobile(elem);
      }
    })
    contacts.push(contact);

  })
  return contacts;
}



async function createChatId(e) {
  const foundUserId = e.currentTarget.getAttribute('data-id');
  const currentUser = auth.currentUser;
  chatId = [currentUser.uid, foundUserId].sort().join("_");

  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    await setDoc(chatRef, {
      chatId: chatId,
      users: [currentUser.uid, foundUserId],
      createdAt: serverTimestamp()
    });
  }
}

function createContactItem(elem) {
  const contact = document.createElement('div');
  contact.classList.add('contact-item')
  contact.setAttribute('data-id', elem.uid)
  contact.innerHTML = `<img src="${elem.profileImage}" class="contact-avatar" />
                         <div class="contact-info">
                            <div class="contact-name">${elem.name}</div>
                            <div class="contact-message">Sent you the file ✅</div>
                         </div>
                         <div class="contact-time">8:45 PM</div>`

  return contact;
}

function createChat(conatct) {
  defaultChatScreen.classList.add('d-none');
  chatSection.style.display = 'flex'
  let chat = `
            <div class="chat-header">
                <img src="${conatct.profileImage}" id="chatDp" alt="User" />
                <div class="chat-user-info">
                    <div class="chat-username">${conatct.name}</div>
                    <div class="chat-status">online</div>
                </div>
            </div>

            <div id="chat" class="position-relative">
              <div id="chatLoader"
              class="d-flex position-absolute top-0 start-0 w-100 h-100 bg-white justify-content-center align-items-center"
              style="z-index: 9999;">
                <div class="text-center">
                  <div class="spinner-grow text-primary" role="status"></div>
                  <div class="spinner-grow text-secondary" role="status"></div>
                  <div class="spinner-grow text-success" role="status"></div>
                  <p class="mt-3 fw-bold">Loading your chats...</p>
                </div>
              </div>
            </div>

            <div class="chat-bar">
                <input class="chat-bar__input" type="text" placeholder="Message...">
                <div class="chat-bar__buttons">
                    <i class="btn fas fa-paper-plane"></i>
                </div>
            </div>`

  chatSection.innerHTML = chat;
  const sendBtn = document.querySelector('.fa-paper-plane');
  console.log(sendBtn);
  sendBtn.addEventListener('click', (e) => {
    sendMessage(e, conatct);
  })
}


function createChatMobile(conatct) {
  chatSection.innerHTML = ``
  defaultChatScreen.classList.add('d-none');
  contactList.classList.add('d-none');
  chatSection.style.display = 'flex';

  let chat = `
            <div class="chat-header">
                <button class="chatBackBtn"><i class="fa-solid fa-arrow-left"></i></button>
                <img src="${conatct.profileImage}" id="chatDp" alt="User" />
                <div class="chat-user-info">
                    <div class="chat-username">${conatct.name}</div>
                    <div class="chat-status">online</div>
                </div>
            </div>

            <div id="chat" class="position-relative">
              <div id="chatLoader"
              class="d-flex position-absolute top-0 start-0 w-100 h-100 bg-white justify-content-center align-items-center"
              style="z-index: 9999;">
                <div class="text-center">
                  <div class="spinner-grow text-primary" role="status"></div>
                  <div class="spinner-grow text-secondary" role="status"></div>
                  <div class="spinner-grow text-success" role="status"></div>
                  <p class="mt-3 fw-bold">Loading your chats...</p>
                </div>
              </div>
            </div>

            <div class="chat-bar">
                <input class="chat-bar__input" type="text" placeholder="Message...">
                <div class="chat-bar__buttons">
                    <i class="btn fas fa-paper-plane"></i>
                </div>
            </div>`

  chatSection.innerHTML = chat;
  const sendBtn = document.querySelector('.fa-paper-plane');

  sendBtn.addEventListener('click', (e) => {
    sendMessage(e);
  })

  const chatBackBtn = document.querySelector('.chatBackBtn');
  chatBackBtn.addEventListener('click', () => {
    chatSection.style.display = 'none';
    contactList.classList.remove('d-none');
    closeChat();
  });
}


async function sendMessage(event, contact) {
  const input = document.querySelector('.chat-bar__input');
  const messageText = input.value.trim();

  if (!messageText) {
    input.placeholder = 'Please enter your message';
    return;
  }

  try {
    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        users: [auth.currentUser.uid, contact.uid],
        createdAt: serverTimestamp()
      });
    }

    const recipientRef = doc(db, 'users', contact.uid);
    const recipientSnap = await getDoc(recipientRef);

    if (recipientSnap.exists()) {
      const recipientData = recipientSnap.data();
      const hasSenderInContacts = recipientData.friends?.some(
        f => f.uid === auth.currentUser.uid
      );

      if (!hasSenderInContacts) {
        const senderDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const senderData = senderDoc.data();

        await updateDoc(recipientRef, {
          friends: arrayUnion({
            uid: auth.currentUser.uid,
            name: senderData.name,
            profileImage: senderData.profileImage,
            chatId: chatId
          })
        });

        const newContact = createContactItem({
          uid: auth.currentUser.uid,
          name: senderData.name,
          profileImage: senderData.profileImage
        });
        contactListContaner.prepend(newContact);
      }
    }

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesRef, {
      text: messageText,
      senderId: auth.currentUser.uid,
      createdAt: serverTimestamp()
    });

    input.value = '';

  } catch (error) {
    console.error("Error sending message:", error);
    showToast("Failed to send message");
  }
}


let unsubscribeMessages; // To store the listener function

function openChat(id) {

  chatId = id;
  if (unsubscribeMessages) unsubscribeMessages();

  const messagesRef = collection(db, 'chats', id, 'messages');
  const q = query(messagesRef, orderBy('createdAt'));

  unsubscribeMessages = onSnapshot(q, (snapshot) => {
    const chatDiv = document.getElementById('chat');
    chatDiv.innerHTML = '';

    snapshot.forEach((doc) => {
      const message = doc.data();
      const isCurrentUser = message.senderId === auth.currentUser.uid;

      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${isCurrentUser ? 'right' : 'left'}`;
      messageDiv.textContent = message.text;

      chatDiv.appendChild(messageDiv);
    });

    chatDiv.scrollTop = chatDiv.scrollHeight;
  });
}


function closeChat() {
  if (unsubscribeMessages) {
    unsubscribeMessages();
  }
}



signInShow.addEventListener('click', (e) => {
  showHide(signUp, signIn)
})

signUpShow.addEventListener('click', () => {
  showHide(signIn, signUp)
})


function showHide(elem1, elem2) {
  elem1.classList.add('d-none')
  elem2.classList.remove('d-none')
}