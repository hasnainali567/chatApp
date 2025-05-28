import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, setDoc, db, doc, query, where, getDocs, collection, getDoc, updateDoc, arrayUnion, serverTimestamp, orderBy, addDoc, onSnapshot } from "./firebase.js";

const layer = document.getElementById('layer');
const searchEmailInput = document.getElementById('searchEmailInput');
const chatLoader = document.getElementById('chatLoader');
const appContainer = document.querySelector('.app-container');
const contactList = document.getElementById('contactList');
const chatSection = document.getElementById('chatSection');
const addUser = document.getElementById('addUser');
const closeAddUser = document.getElementById('closeAddUser');
const searchUserBtn = document.getElementById('searchUserBtn');
const contactListContaner = document.getElementById('contact-list-contaner');
let chatId = '';

onAuthStateChanged(auth, async (user) => {
    if (user) {
        appContainer.classList.remove('d-none');
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
            lastActive: serverTimestamp(),
            isOnline: true
        });
        onSnapshot(userDocRef, (doc) => {
            const updatedData = doc.data();
            updateContactListUI(updatedData.friends || []);
        })
        chatLoader.classList.add('d-none');
    } else {
        chatLoader.classList.add('d-none')
    }
})

function updateContactListUI(friends) {
    contactListContaner.innerHTML = '';
    const contacts = setFriends(...friends);
    contacts.forEach(c => contactListContaner.prepend(c));
}


addUser.addEventListener('click', () => {
    document.querySelector('.custom-modal-wrapper').classList.remove('d-none');
    document.querySelector('.custom-modal-wrapper').classList.add('d-flex');

})
closeAddUser.addEventListener('click', () => {
    document.querySelector('.custom-modal-wrapper').classList.add('d-none')
})



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
            layer.classList.remove('d-none')
            createChatId(e);
            openChat(chatId);
            if (window.innerWidth >= 660) {
                createChat(elem);
            } else {
                createChat(elem, true);
            }
        })
        contacts.push(contact);

    })
    return contacts;
}

// window.addEventListener('resize', ()=>{
//     if(window)
// })



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
                            <div class="contact-message">Hey! there i am using whatsapp</div>
                         </div>
                         <div class="contact-time">8:45 PM</div>`

    return contact;
}

function createChat(contact, isMobile) {
    if (!isMobile) {
        defaultChatScreen.classList.add('d-none');
        chatSection.style.display = 'flex'
    } else {
        chatSection.innerHTML = ``
        defaultChatScreen.classList.add('d-none');
        contactList.classList.add('d-none');
        chatSection.style.display = 'flex';
    }
    let chat = `
            <div class="chat-header">
      ${isMobile ? `<button class="chatBackBtn"><i class="fa-solid fa-arrow-left"></i></button>` : ''}
      <img src="${contact.profileImage}" id="chatDp" alt="User" />
      <div class="chat-user-info">
        <div class="chat-username">${contact.name}</div>
        <div class="chat-status">online</div>
      </div>
    </div>
    <div id="chat" class="position-relative">
      <div id="chatLoader" class="d-flex position-absolute top-0 start-0 w-100 h-100 bg-white justify-content-center align-items-center" style="z-index: 9999;">
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
    </div>`;

    chatSection.innerHTML = chat;
    const sendBtn = document.querySelector('.fa-paper-plane');
    sendBtn.addEventListener('click', async (e) => {
        sendMessage(e, contact);
  })

    const chatBackBtn = document.querySelector('.chatBackBtn');
    chatBackBtn && chatBackBtn.addEventListener('click', () => {
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
                        email: senderData.email,
                        profileImage: senderData.profileImage,
                    })
                });
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

    layer.classList.add('d-none')
}


function closeChat() {
    if (unsubscribeMessages) {
        unsubscribeMessages();
    }
}

