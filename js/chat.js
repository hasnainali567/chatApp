import { auth, onAuthStateChanged, setDoc, db, doc, query, where, getDocs, collection, getDoc, updateDoc, arrayUnion, serverTimestamp, orderBy, addDoc, onSnapshot, arrayRemove, deleteDoc, limit } from "./firebase.js";

const layer = document.getElementById('layer');
const searchEmailInput = document.getElementById('searchEmailInput');
const chatLoader = document.getElementById('chatLoader');
const appContainer = document.querySelector('.app-container');
const contactList = document.getElementById('contactList');
const chatSection = document.getElementById('chatSection');
const addUser = document.getElementById('addUser');
const closeAddUser = document.getElementById('closeAddUser');
const searchUserBtn = document.getElementById('searchUserBtn');
const headerUserName = document.getElementById('headerUserName');
const contactListContaner = document.getElementById('contact-list-contaner');
const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
let chatId = '';
let isFirstTime = true;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
            lastActive: serverTimestamp(),
            isOnline: true
        });
        onSnapshot(userDocRef, (doc) => {
            const updatedData = doc.data();

            if (isFirstTime) {
                headerUserName.innerText = `${updatedData.name}`
                isFirstTime = false;
            }
            updateContactListUI(updatedData.friends || []);
        })
    } else {
        chatLoader.classList.add('d-none')
        window.location = 'index.html'
    }
})


function updateContactListUI(friends) {
    chatLoader.classList.add('d-none');
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

            await updateDoc(currentUserDocRef, {
                friends: arrayUnion({
                    name: userData.name,
                    email: userData.email,
                    uid: userData.userId,
                    profileImage: userData.profileImage
                })
            });
            showToast(`${userData.name} added to your contacts.`);

            // clear input
            searchEmailInput.value = '';
            searchUserBtn.disabled = true;
        });
    } catch (err) {
        console.error("Search error:", err);
        showToast("Something went wrong while searching.");
    }
});

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {

    }, 150);
});


window.addEventListener('resize', () => {
    if (window.innerWidth >= 660) {
        if (chatSection.style.display === 'none') {
            chatSection.style.display = 'flex'
        }
    }
    const chatHeader = document.querySelector('.chat-header');

    if (window.innerWidth <= 660) {
        if (chatSection.style.display === 'flex' && contactList.className.indexOf('d-none') === -1) {
            contactList.classList.add('d-none')
            const backBtn = document.createElement('button');
            backBtn.classList.add('chatBackBtn');
            backBtn.innerHTML = `<i class="fa-solid fa-arrow-left"></i>`

            backBtn.addEventListener('click', closeChatDiv);
            chatHeader.prepend(backBtn)


        }
    } else {
        const backBtn = chatHeader?.querySelector('.chatBackBtn');
        backBtn && backBtn.remove()
        contactList.classList.remove('d-none')
    }
})

const defaultChatScreen = document.getElementById('defaultChatScreen');
function setFriends(...friends) {

    let contacts = []

    friends.forEach(elem => {
        let contact = createContactItem(elem);
        let chatIds = [auth.currentUser.uid, elem.uid].sort().join("_");

        loadLastMessage(chatIds, elem.uid)
        console.log('chatIds, ' + chatIds);


        contact.addEventListener('click', async (e) => {

            createChatId(e);
            console.log(chatId === chatIds);
            console.log(chatId);
            openChat(chatId, e);
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
    contact.innerHTML = `<div class="contact-avatar">
                            <img src="${elem.profileImage}" />
                         </div>
                         <div class="contact-info">
                            <div class="contact-name">${elem.name}</div>
                            <div class="contact-message">Hey! there i am using chatApp</div>
                         </div>
                         <div class="contact-time"></div>`

    return contact;
}


async function loadLastMessage(chatId, contactId) {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(1)); // Get latest 1 message

    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const data = doc.data();

            console.log(data);

            // Update UI: Find the correct DOM nodes for this contact

            updateTime(data, contactId)

        }
    } catch (error) {
        console.error('Error loading last message:', error);
    }
}

function updateTime(data, contactId) {
    let dateText = '...';
    if (data.createdAt?.toDate) {
        const date = data.createdAt.toDate();
        const options = { hour: 'numeric', minute: 'numeric', hour12: true };
        dateText = date.toLocaleString('en-US', options);
    }

    const contactElement = document.querySelector(`[data-id="${contactId}"]`);
    const messageDiv = contactElement.querySelector('.contact-message');
    const timeDiv = contactElement.querySelector('.contact-time');

    if (messageDiv) messageDiv.textContent = data.text;
    if (timeDiv) timeDiv.textContent = dateText;
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
      <div>
        <i id="deleteContact" class="fa-solid fa-trash"></i>
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
        <i class="fas fa-paper-plane"></i>
      </div>
    </div>`;



    chatSection.innerHTML = chat;
    const input = document.querySelector('.chat-bar__input');
    const sendBtn = document.querySelector('.fa-paper-plane');
    const deleteContact = document.getElementById('deleteContact');

    deleteContact.addEventListener('click', () => {
        deleteContacts(contact);
    })
    input.addEventListener('keydown', (key) => {
        if (key.keyCode === 13) {
            sendBtn.click();
        }
    })
    sendBtn.addEventListener('click', async (e) => {
        sendMessage(e, contact);
    })

    const chatBackBtn = document.querySelector('.chatBackBtn');
    chatBackBtn && chatBackBtn.addEventListener('click', closeChatDiv);
}


async function deleteMessagesSubcollection(chatId) {
    const messagesRef = collection(db, "chats", chatId, "messages");
    const messagesSnapshot = await getDocs(messagesRef);

    const deletePromises = messagesSnapshot.docs.map((docSnap) =>
        deleteDoc(docSnap.ref)
    );

    await Promise.all(deletePromises);
}

// Step 2: Delete chat and remove friend
async function deleteContacts(contact) {
    const currentUser = auth.currentUser;
    const currentUserRef = doc(db, "users", currentUser.uid);

    try {
        chatLoader.classList.remove('d-none')
        chatSection.innerHTML = `<div id="defaultChatScreen" class="default-chat-screen">
                <div class="default-chat-content">
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWmmXzSj67H9wDnOs1DRbop5TI1mLkLCJ1QQ&s"
                        class="default-logo" />
                    <h2>Welcome to MyChat</h2>
                    <p>Select a contact to start chatting</p>
                </div>
            </div>`;

        await deleteMessagesSubcollection(chatId);

        const chatRef = doc(db, "chats", chatId); // ✅ FIXED: use doc() not collection()
        await deleteDoc(chatRef);

        await updateDoc(currentUserRef, {
            friends: arrayRemove({
                name: contact.name,
                email: contact.email,
                profileImage: contact.profileImage,
                uid: contact.uid,
            }),
        });

        showToast("Contact and chat deleted successfully.");



        chatLoader.classList.add('d-none')

    } catch (error) {
        console.log(error);
        showToast(error.message);
    }
}


function closeChatDiv() {
    chatSection.style.display = 'none';
    contactList.classList.remove('d-none');
    closeChat();
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

        const messagesRef = collection(db, 'chats', chatId, 'messages');
        await addDoc(messagesRef, {
            text: messageText,
            senderId: auth.currentUser.uid,
            createdAt: serverTimestamp()
        });

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



        input.value = '';

    } catch (error) {
        console.error("Error sending message:", error);
        showToast("Failed to send message");
    }
}


let unsubscribeMessages; // To store the listener function

function openChat(id, elem) {
    elem = elem.currentTarget;
    
    chatId = id;
    if (unsubscribeMessages) unsubscribeMessages();

    const messagesRef = collection(db, 'chats', id, 'messages');
    const q = query(messagesRef, orderBy('createdAt'));

    unsubscribeMessages = onSnapshot(q, (snapshot) => {
        const chatDiv = document.getElementById('chat');
        chatDiv && (chatDiv.innerHTML = '');

        snapshot.forEach((doc) => {
            const message = doc.data();
            const isCurrentUser = message.senderId === auth.currentUser.uid;

            let dateText = '...';
            if (message.createdAt?.toDate) {
                const date = message.createdAt.toDate();
                const options = {
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true,
                };
                dateText = date.toLocaleString('en-US', options);
            } else {
                dateText = 'Sending...'; // Or leave blank if you prefer
            }

            const contactMessage = elem.querySelector('.contact-message');
            contactMessage.textContent = `${message.text}`
            const contactTime = elem.querySelector('.contact-time');
            contactTime.textContent = `${dateText}`
            const messageDiv = document.createElement('div');
            const messageTimeDiv = document.createElement('div');
            messageTimeDiv.className = `messageTime`
            messageTimeDiv.textContent = `${dateText}`
            messageDiv.className = `message ${isCurrentUser ? 'right' : 'left'}`;
            messageDiv.textContent = message.text;
            messageDiv.appendChild(messageTimeDiv)

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

