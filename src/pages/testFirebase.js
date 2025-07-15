// src/testFirebase.js
import { db, storage } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...');
    
    // Test Firestore
    const testDoc = await addDoc(collection(db, "test"), {
      message: "Test connection",
      timestamp: serverTimestamp()
    });
    console.log('✅ Firestore test successful. Document ID:', testDoc.id);
    
    // Test Storage (create a simple text file)
    const testFile = new Blob(['Hello Firebase Storage'], { type: 'text/plain' });
    const storageRef = ref(storage, `test/test_${Date.now()}.txt`);
    const snapshot = await uploadBytes(storageRef, testFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('✅ Storage test successful. File URL:', downloadURL);
    
    return { success: true, message: 'Firebase connection successful!' };
  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    return { success: false, error: error.message };
  }
};