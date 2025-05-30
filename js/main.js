import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, setDoc, db, doc, query, where, getDocs, collection, getDoc, updateDoc, arrayUnion, serverTimestamp, orderBy, addDoc, onSnapshot } from "./firebase.js";

const signUpBtn = document.getElementById('signUpBtn');
const loginBtn = document.getElementById('loginBtn');
const signUpEmailInp = document.getElementById('signUpEmailInp');
const signUpPasswordInp = document.getElementById('signUpPasswordInp');
const ProfileImg = document.getElementById('ProfileImg');
const profileUpload = document.getElementById('profile-upload');
const signInEmailInp = document.getElementById('signInEmailInp');
const signInPasswordInp = document.getElementById('signInPasswordInp');
const chatLoader = document.getElementById('chatLoader');
const appContainer = document.querySelector('.app-container');
const registerContainerWrapper = document.querySelector('.register-container-wrapper');
const emailValidate = document.querySelector('.emailValidate');
const passValidate = document.querySelector('.passValidate');

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDocRef = doc(db, "users", user.uid);
    let userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      window.location.href = '/chat.html'
    }
    // window.location = '/chat.html'
  } else {
    chatLoader.classList.add('d-none')
  }
})


profileUpload && profileUpload.addEventListener('change', (e) => {
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

signUpEmailInp && signUpEmailInp.addEventListener('input', validateInputs);
signUpPasswordInp && signUpPasswordInp.addEventListener('input', validateInputs);


signUpBtn && signUpBtn.addEventListener('click', async (e) => {
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

          chatLoader.classList.remove('d-none')
          console.log('running...');
          setTimeout(() => {
            window.location = '/chat.html'
          }, 500)

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
        profileImage: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTdmrjoiXGVFEcd1cX9Arb1itXTr2u8EKNpw&s",
      });

      signUpBtn.innerHTML = `Sign Up`;

      chatLoader.classList.remove('d-none')
      console.log('running...');
      
      setTimeout(() => {
        window.location = '/chat.html'
      }, 500)

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

    window.location = '/chat.html'
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



