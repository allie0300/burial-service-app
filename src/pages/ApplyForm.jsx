import { useState, useRef } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import MemberFields from '../components/MemberFields';

export default function ApplyForm() {
  const [members, setMembers] = useState([{ id: 1 }]);
  const [submission, setSubmission] = useState({ 
    status: 'idle', 
    docId: null,
    message: '' 
  });
  const formRef = useRef(null);

  const addMember = () => {
    if (members.length >= 5) {
      setSubmission({
        status: 'error',
        docId: null,
        message: 'Maximum 4 additional members allowed'
      });
      return;
    }
    setMembers([...members, { id: Date.now() }]);
  };

  const removeMember = (id) => {
    if (members.length > 1) {
      setMembers(members.filter(member => member.id !== id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmission({ status: 'submitting', docId: null, message: '' });

    try {
      const formData = new FormData(e.target);
      const primaryData = {
        firstName: formData.get('primaryFirstName'),
        surname: formData.get('primarySurname'),
        idNumber: formData.get('primaryIdNumber'),
        idFile: formData.get('primaryIdFile')
      };

      const contactData = {
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address')
      };

      // Validate required fields
      if (!primaryData.firstName || !primaryData.surname || !primaryData.idNumber) {
        throw new Error('Primary member information is required');
      }

      // Upload primary ID file if exists
      let primaryIdUrl = null;
      if (primaryData.idFile) {
        const primaryRef = ref(storage, `ids/${contactData.email}/primary_${Date.now()}`);
        await uploadBytes(primaryRef, primaryData.idFile);
        primaryIdUrl = await getDownloadURL(primaryRef);
      }

      // Process family members
      const familyMembers = [];
      const uploadPromises = [];

      members.forEach((member, index) => {
        const memberData = {
          firstName: formData.get(`member-${member.id}-firstName`),
          surname: formData.get(`member-${member.id}-surname`),
          idNumber: formData.get(`member-${member.id}-idNumber`),
          idFile: formData.get(`member-${member.id}-idFile`)
        };

        if (memberData.firstName && memberData.surname) {
          const memberEntry = {
            firstName: memberData.firstName,
            surname: memberData.surname,
            idNumber: memberData.idNumber || null
          };

          if (memberData.idFile) {
            const memberRef = ref(storage, `ids/${contactData.email}/member_${index}_${Date.now()}`);
            uploadPromises.push(
              uploadBytes(memberRef, memberData.idFile)
                .then(() => getDownloadURL(memberRef))
                .then(url => {
                  memberEntry.idUrl = url;
                })
            );
          }

          familyMembers.push(memberEntry);
        }
      });

      // Wait for all file uploads to complete
      await Promise.all(uploadPromises);

      // Prepare Firestore document
      const applicationData = {
        primary: {
          ...primaryData,
          idUrl: primaryIdUrl
        },
        contact: contactData,
        familyMembers,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Remove File objects before saving to Firestore
      delete applicationData.primary.idFile;
      familyMembers.forEach(member => delete member.idFile);

      // Save to Firestore
      const docRef = await addDoc(collection(db, "applications"), applicationData);

      setSubmission({
        status: 'success',
        docId: docRef.id,
        message: 'Application submitted successfully!'
      });

      // Reset form after successful submission
      if (formRef.current) {
        formRef.current.reset();
      }

    } catch (error) {
      console.error('Submission error:', error);
      setSubmission({
        status: 'error',
        docId: null,
        message: error.message || 'Failed to submit application'
      });
    }
  };

  return (
    <div className="form-container">
      <form ref={formRef} onSubmit={handleSubmit} className="apply-form">
        <h2>Family Coverage Application</h2>
        
        {/* Primary Member Section */}
        <div className="form-section">
          <h3>Primary Member</h3>
          <div className="form-group">
            <label>First Name*</label>
            <input 
              name="primaryFirstName" 
              type="text" 
              required 
              disabled={submission.status === 'submitting'}
            />
          </div>
          
          <div className="form-group">
            <label>Surname*</label>
            <input 
              name="primarySurname" 
              type="text" 
              required 
              disabled={submission.status === 'submitting'}
            />
          </div>
          
          <div className="form-group">
            <label>ID Number*</label>
            <input 
              name="primaryIdNumber" 
              type="text" 
              required 
              disabled={submission.status === 'submitting'}
            />
          </div>
          
          <div className="form-group">
            <label>ID Document</label>
            <input 
              name="primaryIdFile" 
              type="file" 
              accept=".pdf,.jpg,.png" 
              disabled={submission.status === 'submitting'}
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="form-section">
          <h3>Contact Information</h3>
          <div className="form-group">
            <label>Email*</label>
            <input 
              name="email" 
              type="email" 
              required 
              disabled={submission.status === 'submitting'}
            />
          </div>
          
          <div className="form-group">
            <label>Phone Number*</label>
            <input 
              name="phone" 
              type="tel" 
              required 
              disabled={submission.status === 'submitting'}
            />
          </div>
          
          <div className="form-group">
            <label>Address*</label>
            <textarea 
              name="address" 
              required 
              disabled={submission.status === 'submitting'}
            />
          </div>
        </div>

        {/* Family Members */}
        <div className="form-section">
          <h3>Family Members</h3>
          {members.map((member) => (
            <MemberFields 
              key={member.id} 
              id={member.id}
              onRemove={removeMember}
              disabled={submission.status === 'submitting'} 
            />
          ))}
          
          <button 
            type="button" 
            onClick={addMember}
            className="add-member-btn"
            disabled={submission.status === 'submitting' || members.length >= 5}
          >
            + Add Family Member ({members.length}/5)
          </button>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button 
            type="submit" 
            disabled={submission.status === 'submitting'}
            className="submit-btn"
          >
            {submission.status === 'submitting' ? (
              <>
                <span className="spinner"></span>
                Submitting...
              </>
            ) : 'Submit Application'}
          </button>
        </div>

        {/* Status Messages */}
        {submission.status !== 'idle' && (
          <div className={`submission-status ${submission.status}`}>
            {submission.status === 'success' && (
              <>
                <span>✓</span>
                <div>
                  <p>{submission.message}</p>
                  <p>Reference: {submission.docId}</p>
                </div>
              </>
            )}
            
            {submission.status === 'error' && (
              <>
                <span>✗</span>
                <p>{submission.message}</p>
              </>
            )}
          </div>
        )}
      </form>
    </div>
  );
}