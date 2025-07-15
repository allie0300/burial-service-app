// src/utils/createAdmin.js
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export const createAdminUser = async (email, password) => {
  try {
    // Validate inputs
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Create the user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    console.log('Admin user created successfully:', {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      createdAt: new Date().toISOString()
    });

    return {
      success: true,
      user: userCredential.user,
      message: `Admin user created successfully: ${userCredential.user.email}`
    };

  } catch (error) {
    console.error('Error creating admin user:', error);
    
    // Handle specific Firebase Auth errors
    let errorMessage = error.message;
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'This email is already registered. Please use a different email.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password is too weak. Please use a stronger password.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your internet connection.';
        break;
      default:
        errorMessage = `Error creating admin user: ${error.message}`;
    }

    return {
      success: false,
      error: error.code,
      message: errorMessage
    };
  }
};

// Example usage function (you can call this directly)
export const createDefaultAdmin = async () => {
  const defaultEmail = 'admin@almieftagh.com';
  const defaultPassword = 'AdminPassword123!'; // Change this to a secure password
  
  console.log('Creating default admin user...');
  const result = await createAdminUser(defaultEmail, defaultPassword);
  
  if (result.success) {
    console.log('✅ Default admin created successfully!');
    console.log('Email:', defaultEmail);
    console.log('Password:', defaultPassword);
    console.log('⚠️  Please change the password after first login!');
  } else {
    console.error('❌ Failed to create default admin:', result.message);
  }
  
  return result;
};

// Quick setup function with prompts (for browser console use)
export const setupAdminWithPrompts = async () => {
  const email = prompt('Enter admin email:') || 'admin@almieftagh.com';
  const password = prompt('Enter admin password (min 6 characters):') || 'TempPassword123!';
  
  const result = await createAdminUser(email, password);
  
  if (result.success) {
    alert(`✅ Admin user created successfully!\nEmail: ${email}\nPlease save these credentials securely.`);
  } else {
    alert(`❌ Error: ${result.message}`);
  }
  
  return result;
};