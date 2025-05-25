import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, setDoc, db, doc, query, where, getDocs, collection, getDoc, updateDoc, arrayUnion } from "./firebase.js";

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
const chatBackBtn = document.querySelector('.chatBackBtn');
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
const chatDp = document.getElementById('chatDp');
const closeAddUser = document.getElementById('closeAddUser');
const searchUserBtn = document.getElementById('searchUserBtn');
const contactListContaner = document.getElementById('contact-list-contaner');

onAuthStateChanged(auth, async (user) => {
  if (user) {
    registerContainerWrapper.classList.add('d-none')
    appContainer.classList.remove('d-none');
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const friendsList = userData.friends || [];
      let contacts;  // tumhara state update ho gaya

      if (friendsList.length > 0) {
        contacts = setFriends(friendsList);
        if (contacts.length > 0) {
          // contactListContaner.innerHTML = '';
          contacts.forEach(elem => {
            contactListContaner.prepend(elem)
          })
        } else {
          contactListContaner.innerHTML = `<p class="text-light text-center p-4">Plz! Add contact to start Chating</p>`
        }
      }

      console.log(friendsList);

      console.log(contacts);


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

const setupClickEvents = () => {
  contactItems.forEach(elem => {
    elem.addEventListener('click', () => {
      if (window.innerWidth < 660) {
        chatBackBtn.classList.remove('d-none');
        contactList.style.display = 'none';
        chatSection.style.display = 'flex';
      } else {
        chatBackBtn.classList.add('d-none');
        contactList.style.display = 'flex';
        chatSection.style.display = 'flex';
      }
    });
  });

  chatBackBtn.addEventListener('click', () => {
    chatSection.style.display = 'none';
    contactList.style.display = 'flex';
    chatBackBtn.classList.add('d-none');
  });
};

const handleChatStyling = () => {
  if (window.innerWidth >= 660) {
    chatBackBtn.classList.add('d-none');
    contactList.style.display = 'flex';
    chatSection.style.display = 'flex';
  } else {
    chatSection.style.display = 'none';
    contactList.style.display = 'flex';
  }
};

window.addEventListener('load', () => {
  handleChatStyling();
  setupClickEvents();
});

window.addEventListener('resize', () => {
  handleChatStyling();
});


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
  e.preventDefault()
  signUpBtn.innerHTML = `<div class="spinner-grow text-primary" role="status">
  <span class="visually-hidden">Loading...</span>
</div>
<div class="spinner-grow text-secondary" role="status">
  <span class="visually-hidden">Loading...</span>
</div>
<div class="spinner-grow text-success" role="status">
  <span class="visually-hidden">Loading...</span>
</div>`
  let email = signUpEmailInp.value;
  let pass = signUpPasswordInp.value;
  let name = document.getElementById('nameInp')
  let profileImage = "";

  // ✅ Convert image to Base64 if user selected one
  const file = profileUpload.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = async () => {
      profileImage = reader.result;

      let userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      let userId = userCredential.user.uid;

      await setDoc(doc(db, 'users', userId), {
        name: name.value,
        email,
        userId,
        profileImage  // ✅ Save Base64 here
      });

      signUpBtn.innerHTML = `Sign Up`;
    }; //line 179
    reader.readAsDataURL(file);
  } else {
    // No image selected
    let userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    let userId = userCredential.user.uid;

    await setDoc(doc(db, 'users', userId), {
      name: name.value,
      email,
      userId,
      profileImage: ""
    });

    signUpBtn.innerHTML = `Sign Up`;
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

})


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
    setTimeout(() => {
      chatLoader.classList.add('d-none')
    }, 1000)
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
    searchUserBtn.removeAttribute('disabled');  // ✅ Enable button
  } else {
    searchUserBtn.setAttribute('disabled', 'true'); // ❌ Disable button
  }
});

searchUserBtn.addEventListener('click', async () => {
  let search = searchEmailInput.value.trim().toLowerCase();

  console.log("Searching for:", search);

  // ✅ Firestore query logic here:
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
      const user = res.data();
      console.log("User found:", user);

      let currentUserId = auth.currentUser.uid;
      let searchedUser = user;

      await updateDoc(doc(db, "users", currentUserId), {
        friends: arrayUnion({
          name: searchedUser.name,
          email: searchedUser.email,
          profileImage: searchedUser.profileImage,
          uid: searchedUser.userId
        })
      });


      let contact = setFriends(user)

      contact.forEach(elem => {
        contactListContaner.prepend(elem);
        console.log('i am here');

      })

    });

  } catch (err) {
    console.error("Search error:", err);
    showToast("Something went wrong while searching.");
  }
});


function setFriends(...friends) {

  let contacts = []

  friends.forEach(elem => {
    let contact = document.createElement('div');
    contact.classList.add('contact-item')
    contact.innerHTML = `<img src="${elem.profileImage}" class="contact-avatar" />
                           <div class="contact-info">
                            <div class="contact-name">${elem.name}</div>
                            <div class="contact-message">Sent you the file ✅</div>
                           </div>
                            <div class="contact-time">8:45 PM</div>`

    contacts.push(contact);

  })

  return contacts;
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