// ✅ Your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDwcSo_bhqO5svMl3kAL8N1c91nvEZ_sac",
  authDomain: "edad-5odam.firebaseapp.com",
  databaseURL: "https://edad-5odam-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "edad-5odam",
  storageBucket: "edad-5odam.appspot.com", // ✅ corrected from .firebasestorage.app
  messagingSenderId: "679576633778",
  appId: "1:679576633778:web:566e6aaef9b72f71a824ab",
  measurementId: "G-7WB1WPDLRH"
};

// ✅ Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// 🔐 Global variable to store the servant token from Firebase
let SERVANT_TOKEN = null;

// Load servant token from Firebase when needed
async function loadServantToken() {
  try {
    const snapshot = await database.ref('tokens/servant_auth').once('value');
    SERVANT_TOKEN = snapshot.val();
    console.log('Servant token loaded from Firebase');
    return true;
  } catch (error) {
    console.error('Error loading servant token:', error);
    alert('خطأ في تحميل بيانات التفويض. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.');
    return false;
  }
}

// Toggle servant token field visibility and load token if needed
async function toggleServantToken() {
  const roleServant = document.querySelector('input[name="role"][value="servant"]').checked;
  const tokenField = document.getElementById('servantTokenField');
  const tokenInput = document.getElementById('servantToken');
  
  if (roleServant) {
    tokenField.style.display = 'block';
    tokenInput.required = true;
    
    // Load token only when servant role is selected
    if (!SERVANT_TOKEN) {
      console.log('Loading servant token...');
      const tokenLoaded = await loadServantToken();
      if (!tokenLoaded) {
        // If token loading fails, switch back to student role
        document.querySelector('input[name="role"][value="student"]').checked = true;
        tokenField.style.display = 'none';
        tokenInput.required = false;
        tokenInput.value = '';
        return;
      }
    }
  } else {
    tokenField.style.display = 'none';
    tokenInput.required = false;
    tokenInput.value = ''; // Clear the field when hidden
  }
}

// ✅ Form Submission
document.getElementById("registerForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  if (!validateForm()) return;

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const phone = document.getElementById("phone").value.trim();
  const group = document.getElementById("group").value.trim();
  const role = document.querySelector('input[name="role"]:checked').value;
  const servantToken = document.getElementById("servantToken").value.trim();

  // 🔐 Validate servant token if role is servant
  if (role === "servant") {
    if (!servantToken) {
      alert("يرجى إدخال رمز تفويض الخادم");
      return;
    }
    
    // Token should already be loaded when servant role was selected
    if (!SERVANT_TOKEN) {
      alert("رمز التفويض غير متوفر. يرجى إعادة اختيار دور الخادم والمحاولة مرة أخرى.");
      return;
    }
    
    if (servantToken !== SERVANT_TOKEN) {
      alert("رمز تفويض الخادم غير صحيح. يرجى التواصل مع إدارة الكنيسة للحصول على الرمز الصحيح.");
      return;
    }
  }

  const userData = {
    username,
    email,
    password,
    phone,
    group,
    role
  };

  const emailKey = email.replace(/\./g, '_');

  // ✅ Check if user already exists
  database.ref('users/' + emailKey).once('value', function(snapshot) {
    if (snapshot.exists()) {
      alert("هذا البريد مسجل بالفعل.");
    } else {
      database.ref('users/' + emailKey).set(userData)
        .then(() => {
          alert("تم التسجيل بنجاح!");
          sessionStorage.setItem("currentUser", email);
          window.location.href = "login.html"; // ✅ change if needed
        })
        .catch((error) => {
          console.error("Firebase error:", error);
          alert("حدث خطأ أثناء التسجيل.");
        });
    }
  });
});

// ✅ Form Validation
function validateForm() {
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const phone = document.getElementById("phone").value.trim();

  const arabicNameRegex = /^[\u0600-\u06FF\s]+$/;
  if (!arabicNameRegex.test(username)) {
    alert("يرجى إدخال الاسم باللغة العربية فقط.");
    return false;
  }

    // ✅ تأكد أن الاسم يتكون من أربع كلمات بالضبط
  const nameWords = username.split(/\s+/); // تقسيم بالمسافات
  if (nameWords.length !== 4) {
    alert("يرجى إدخال الاسم رباعي.");
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("يرجى إدخال بريد إلكتروني صحيح.");
    return false;
  }

  if (password.length < 6) {
    alert("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
    return false;
  }

  const phoneRegex = /^01[0-9]{9}$/;
  if (!phoneRegex.test(phone)) {
    alert("يرجى إدخال رقم تليفون مصري صحيح.");
    return false;
  }

  return true;
}
