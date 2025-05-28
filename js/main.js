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
    window.location = '/chat.html'
  } else {
    chatLoader.classList.add('d-none')
  }
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
          window.location = `/chat.html`
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
      window.location = '/chat.html'
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



