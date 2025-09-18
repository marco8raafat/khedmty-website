// Secure Session Utilities

// Verify secure session and return verified email
function verifySecureSession() {
  const sessionHash = sessionStorage.getItem("sessionHash");
  const sessionSalt = sessionStorage.getItem("sessionSalt");
  
  // Check that both sessionHash and sessionSalt exist
  if (!sessionHash || !sessionSalt) {
    // Fallback: check for legacy currentUser for backward compatibility
    const legacyUser = sessionStorage.getItem("currentUser");
    if (legacyUser) {
      // For existing sessions, return the email but consider upgrading security
      return legacyUser;
    }
    return null;
  }
  
  try {
    // Decode sessionHash
    const decodedHash = atob(sessionHash);
    
    // Check if it contains email and salt separated by "|"
    const parts = decodedHash.split("|");
    if (parts.length !== 2) {
      return null;
    }
    
    const [email, decodedSalt] = parts;
    
    // Verify that decoded salt matches sessionSalt
    if (decodedSalt !== sessionSalt) {
      return null;
    }
    
    // Return the verified email
    return email;
  } catch (error) {
    console.error("Session verification error:", error);
    return null;
  }
}

// Generate secure session
function generateSecureSession(email) {
  // Generate random salt using crypto.getRandomValues
  const saltArray = new Uint8Array(16);
  crypto.getRandomValues(saltArray);
  const salt = btoa(String.fromCharCode(...saltArray));
  
  // Create hash string from email + "|" + salt
  const hashString = email + "|" + salt;
  const sessionHash = btoa(hashString);
  
  // Store both in sessionStorage
  sessionStorage.setItem("sessionHash", sessionHash);
  sessionStorage.setItem("sessionSalt", salt);
  
  // Also keep legacy currentUser for compatibility with older code
  sessionStorage.setItem("currentUser", email);
}

// Clear all session data
function clearSession() {
  sessionStorage.removeItem("sessionHash");
  sessionStorage.removeItem("sessionSalt");
  sessionStorage.removeItem("currentUser");
}

// Check authentication and redirect to login if not authenticated
function requireAuthentication() {
  const currentEmail = verifySecureSession();
  if (!currentEmail) {
    window.location.href = "login.html";
    return null;
  }
  return currentEmail;
}
