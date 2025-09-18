const container = document.querySelector('.cross-background');

const svgCross = `
<?xml version="1.0" encoding="iso-8859-1"?>
<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg"
	 viewBox="0 0 60 60" xml:space="preserve">
<path d="M52.247,19.665c-0.396,0-0.785,0.049-1.162,0.145c-0.403-2.214-2.347-3.897-4.675-3.897c-2.396,0-4.382,1.781-4.707,4.087
	H35v-4.811c2.077-0.517,3.594-2.381,3.594-4.599c0-2.188-1.486-4.036-3.503-4.586c0.11-0.404,0.167-0.824,0.167-1.251
	C35.258,2.132,33.126,0,30.506,0c-2.621,0-4.753,2.132-4.753,4.753c0,0.395,0.049,0.785,0.145,1.162C23.684,6.318,22,8.262,22,10.59
	c0,2.364,1.735,4.331,4,4.693V20h-7.812c-0.516-2.077-2.38-3.594-4.599-3.594c-2.188,0-4.035,1.486-4.585,3.503
	c-0.405-0.11-0.825-0.167-1.252-0.167C5.132,19.742,3,21.874,3,24.495s2.132,4.753,4.753,4.753c0.396,0,0.785-0.049,1.162-0.145
	C9.318,31.316,11.262,33,13.59,33c2.365,0,4.332-1.736,4.693-4H26v15.84c-2.026,0.551-3.506,2.405-3.506,4.569
	c0,2.188,1.486,4.036,3.502,4.586c-0.11,0.405-0.167,0.825-0.167,1.252c0,2.621,2.132,4.752,4.753,4.752s4.753-2.132,4.753-4.752
	c0-0.395-0.049-0.785-0.146-1.162c2.215-0.404,3.898-2.347,3.898-4.676c0-2.395-1.781-4.382-4.088-4.706V29h6.84
	c0.552,2.027,2.406,3.506,4.57,3.506c2.188,0,4.035-1.486,4.585-3.503c0.405,0.11,0.825,0.167,1.252,0.167c2.621,0,4.753-2.132,4.753-4.752S54.868,19.665,52.247,19.665z"/>
</svg>
`;

const isMobile = window.innerWidth < 768;
const crossCount = isMobile ? 10 : 25;

for (let i = 0; i < crossCount; i++) {
  const cross = document.createElement('div');
  cross.className = 'cross';
  cross.innerHTML = svgCross;
  cross.style.left = Math.random() * 100 + 'vw';
  cross.style.top = Math.random() * 100 + 'vh';
  cross.style.animationDuration = (12 + Math.random() * 11) + 's';
  container.appendChild(cross);
}
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
          // Generate secure session instead of storing plain email
          generateSecureSession(email);
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
