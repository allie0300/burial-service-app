import React, { useState } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import './ApplyForm.css';

function ApplyForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    subscriber: {
      fullName: '',
      surname: '',
      idNumber: '',
      dateOfBirth: '',
      gender: '',
      contact: '',
      email: '',
      address: '',
      idFile: null,
      idFileURL: ''
    },
    beneficiaries: [],
    paymentMethod: 'debit-order',
    bankDetails: {
      bankName: '',
      accountNumber: '',
      branchCode: ''
    }
  });

  // Define all handler functions first
  const handleSubscriberChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      subscriber: {
        ...prev.subscriber,
        [name]: files ? files[0] : value
      }
    }));
  };

  const handleBeneficiaryChange = (index, e) => {
    const { name, value, files } = e.target;
    const updatedBeneficiaries = [...formData.beneficiaries];
    
    updatedBeneficiaries[index] = {
      ...updatedBeneficiaries[index],
      [name]: files ? files[0] : value
    };

    setFormData(prev => ({
      ...prev,
      beneficiaries: updatedBeneficiaries
    }));
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    if (name in formData) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [name]: value
        }
      }));
    }
  };

  const addBeneficiary = () => {
    if (formData.beneficiaries.length < 5) {
      setFormData(prev => ({
        ...prev,
        beneficiaries: [
          ...prev.beneficiaries,
          {
            fullName: '',
            surname: '',
            idNumber: '',
            dateOfBirth: '',
            gender: '',
            relationship: '',
            idFile: null,
            idFileURL: ''
          }
        ]
      }));
    }
  };

  const removeBeneficiary = (index) => {
    const updatedBeneficiaries = [...formData.beneficiaries];
    updatedBeneficiaries.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      beneficiaries: updatedBeneficiaries
    }));
  };

  const handleFileUpload = async (file, path) => {
    try {
      console.log('Uploading file:', file.name, 'to path:', path);
      const storageRef = ref(storage, `id_documents/${path}_${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('File uploaded successfully:', downloadURL);
      return downloadURL;
    } catch (err) {
      console.error('File upload failed:', err);
      throw new Error(`File upload failed: ${err.message}`);
    }
  };

  const validateForm = () => {
    console.log('Validating form...');
    
    // Subscriber validation
    if (!formData.subscriber.fullName.trim()) throw new Error('Subscriber full name is required');
    if (!formData.subscriber.surname.trim()) throw new Error('Subscriber surname is required');
    if (!formData.subscriber.idNumber.trim()) throw new Error('Subscriber ID number is required');
    if (!formData.subscriber.dateOfBirth) throw new Error('Subscriber date of birth is required');
    if (!formData.subscriber.gender) throw new Error('Subscriber gender is required');
    if (!formData.subscriber.contact.trim()) throw new Error('Contact number is required');
    if (!formData.subscriber.email.trim()) throw new Error('Email is required');
    if (!formData.subscriber.address.trim()) throw new Error('Address is required');
    if (!formData.subscriber.idFile) throw new Error('Subscriber ID copy is required');

    // Beneficiaries validation (only if there are beneficiaries)
    formData.beneficiaries.forEach((beneficiary, index) => {
      if (!beneficiary.fullName.trim()) throw new Error(`Beneficiary ${index + 1} full name is required`);
      if (!beneficiary.surname.trim()) throw new Error(`Beneficiary ${index + 1} surname is required`);
      if (!beneficiary.idNumber.trim()) throw new Error(`Beneficiary ${index + 1} ID number is required`);
      if (!beneficiary.dateOfBirth) throw new Error(`Beneficiary ${index + 1} date of birth is required`);
      if (!beneficiary.gender) throw new Error(`Beneficiary ${index + 1} gender is required`);
      if (!beneficiary.relationship) throw new Error(`Beneficiary ${index + 1} relationship is required`);
      if (!beneficiary.idFile) throw new Error(`Beneficiary ${index + 1} ID copy is required`);
    });

    // Payment validation
    if (formData.paymentMethod === 'debit-order') {
      if (!formData.bankDetails.bankName.trim()) throw new Error('Bank name is required');
      if (!formData.bankDetails.accountNumber.trim()) throw new Error('Account number is required');
      if (!formData.bankDetails.branchCode.trim()) throw new Error('Branch code is required');
    }

    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    for (let checkbox of checkboxes) {
      if (!checkbox.checked) throw new Error('Please agree to all terms and conditions');
    }
    
    console.log('Form validation passed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submission started...');
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate form
      validateForm();
      console.log('Form data:', formData);

      // Test Firestore connection first
      console.log('Testing Firestore connection...');
      const testDoc = await addDoc(collection(db, "test"), {
        timestamp: serverTimestamp(),
        test: "connection test"
      });
      console.log('Test document created:', testDoc.id);

      // Prepare submission data
      const submissionData = {
        subscriber: {
          fullName: formData.subscriber.fullName,
          surname: formData.subscriber.surname,
          idNumber: formData.subscriber.idNumber,
          dateOfBirth: formData.subscriber.dateOfBirth,
          gender: formData.subscriber.gender,
          contact: formData.subscriber.contact,
          email: formData.subscriber.email,
          address: formData.subscriber.address,
          idFileURL: '' // Will be updated after upload
        },
        beneficiaries: formData.beneficiaries.map(b => ({
          fullName: b.fullName,
          surname: b.surname,
          idNumber: b.idNumber,
          dateOfBirth: b.dateOfBirth,
          gender: b.gender,
          relationship: b.relationship,
          idFileURL: '' // Will be updated after upload
        })),
        paymentMethod: formData.paymentMethod,
        bankDetails: formData.bankDetails,
        monthlyFee: 100,
        status: "pending",
        createdAt: serverTimestamp()
      };

      console.log('Uploading subscriber ID file...');
      submissionData.subscriber.idFileURL = await handleFileUpload(
        formData.subscriber.idFile,
        `subscriber_${formData.subscriber.idNumber}`
      );

      // Only upload beneficiary files if there are beneficiaries
      if (formData.beneficiaries.length > 0) {
        console.log('Uploading beneficiary ID files...');
        await Promise.all(formData.beneficiaries.map(async (beneficiary, index) => {
          submissionData.beneficiaries[index].idFileURL = await handleFileUpload(
            beneficiary.idFile,
            `beneficiary_${beneficiary.idNumber}_${index}`
          );
        }));
      }

      console.log('Saving to Firestore...', submissionData);
      const docRef = await addDoc(collection(db, "subscriptions"), submissionData);
      console.log('Document saved with ID:', docRef.id);

      setSubmitSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedToPayment = () => {
    // Check if subscriber information is complete
    const subscriber = formData.subscriber;
    return (
      subscriber.fullName.trim() &&
      subscriber.surname.trim() &&
      subscriber.idNumber.trim() &&
      subscriber.dateOfBirth &&
      subscriber.gender &&
      subscriber.contact.trim() &&
      subscriber.email.trim() &&
      subscriber.address.trim() &&
      subscriber.idFile
    );
  };

  if (submitSuccess) {
    return (
      <div className="success-message">
        <h2>Subscription Successful!</h2>
        <p>Your R100/month burial benefit plan is now active.</p>
        <p>Redirecting to home page...</p>
      </div>
    );
  }

  return (
    <div className="subscription-form-container">
      <h2>Burial Benefit Subscription</h2>
      <p className="form-description">
        R100/month covers you and your family. ID copies required for all individuals.
      </p>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
          <br />
          <small>Check the browser console for more details.</small>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Step 1: Subscriber Information */}
        {step === 1 && (
          <fieldset className="form-section">
            <legend>Your Information</legend>
            
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.subscriber.fullName}
                  onChange={handleSubscriberChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Surname *</label>
                <input
                  type="text"
                  name="surname"
                  value={formData.subscriber.surname}
                  onChange={handleSubscriberChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>ID Number *</label>
              <input
                type="text"
                name="idNumber"
                value={formData.subscriber.idNumber}
                onChange={handleSubscriberChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date of Birth *</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.subscriber.dateOfBirth}
                  onChange={handleSubscriberChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Gender *</label>
                <select
                  name="gender"
                  value={formData.subscriber.gender}
                  onChange={handleSubscriberChange}
                  required
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Upload ID Copy *</label>
              <input
                type="file"
                name="idFile"
                onChange={handleSubscriberChange}
                accept=".pdf,.jpg,.jpeg,.png"
                required
              />
              {formData.subscriber.idFile && (
                <span className="file-info">Selected: {formData.subscriber.idFile.name}</span>
              )}
            </div>

            <div className="form-group">
              <label>Contact Number *</label>
              <input
                type="tel"
                name="contact"
                value={formData.subscriber.contact}
                onChange={handleSubscriberChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.subscriber.email}
                onChange={handleSubscriberChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Physical Address *</label>
              <textarea
                name="address"
                value={formData.subscriber.address}
                onChange={handleSubscriberChange}
                required
                rows="3"
              />
            </div>
          </fieldset>
        )}

        {/* Step 2: Beneficiaries */}
        {step === 2 && (
          <fieldset className="form-section">
            <legend>Family Members to Cover ({formData.beneficiaries.length}/5)</legend>
            
            <div className="beneficiary-intro">
              <p>You can add up to 5 family members to your burial benefit plan. This step is optional - you can proceed to payment without adding beneficiaries.</p>
            </div>

            {formData.beneficiaries.length === 0 ? (
              <div className="no-beneficiaries">
                <p>No family members added yet.</p>
                <button
                  type="button"
                  className="add-button"
                  onClick={addBeneficiary}
                >
                  + Add First Family Member
                </button>
              </div>
            ) : (
              <>
                {formData.beneficiaries.map((beneficiary, index) => (
                  <div key={index} className="beneficiary-group">
                    <h4>Family Member #{index + 1}</h4>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>First Name *</label>
                        <input
                          type="text"
                          name="fullName"
                          value={beneficiary.fullName}
                          onChange={(e) => handleBeneficiaryChange(index, e)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Surname *</label>
                        <input
                          type="text"
                          name="surname"
                          value={beneficiary.surname}
                          onChange={(e) => handleBeneficiaryChange(index, e)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>ID Number *</label>
                      <input
                        type="text"
                        name="idNumber"
                        value={beneficiary.idNumber}
                        onChange={(e) => handleBeneficiaryChange(index, e)}
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Date of Birth *</label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={beneficiary.dateOfBirth}
                          onChange={(e) => handleBeneficiaryChange(index, e)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Gender *</label>
                        <select
                          name="gender"
                          value={beneficiary.gender}
                          onChange={(e) => handleBeneficiaryChange(index, e)}
                          required
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Upload ID Copy *</label>
                      <input
                        type="file"
                        name="idFile"
                        onChange={(e) => handleBeneficiaryChange(index, e)}
                        accept=".pdf,.jpg,.jpeg,.png"
                        required
                      />
                      {beneficiary.idFile && (
                        <span className="file-info">Selected: {beneficiary.idFile.name}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Relationship *</label>
                      <select
                        name="relationship"
                        value={beneficiary.relationship}
                        onChange={(e) => handleBeneficiaryChange(index, e)}
                        required
                      >
                        <option value="">Select relationship</option>
                        <option value="spouse">Spouse</option>
                        <option value="child">Child</option>
                        <option value="parent">Parent</option>
                        <option value="sibling">Sibling</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      className="remove-button"
                      onClick={() => removeBeneficiary(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}

                {formData.beneficiaries.length < 5 && (
                  <button
                    type="button"
                    className="add-button"
                    onClick={addBeneficiary}
                  >
                    + Add Another Family Member
                  </button>
                )}
              </>
            )}
          </fieldset>
        )}

        {/* Step 3: Payment Details */}
        {step === 3 && (
          <fieldset className="form-section">
            <legend>Payment Information</legend>
            
            <div className="form-group">
              <label>Payment Method *</label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handlePaymentChange}
                required
              >
              
                <option value="eft">Monthly EFT</option>
                <option value="cash">Cash Payment</option>
              </select>
            </div>

            {formData.paymentMethod === 'cash' && (
              <div className="cash-payment-info">
                <div className="info-box">
                  <h4>Cash Payment Instructions</h4>
                  <p>For cash payments, please visit our office during business hours:</p>
                  <ul>
                    <li><strong>Address:</strong> 1 Marguerite Road, Lentegeur Mitchells plain, Cape Town</li>
                    <li><strong>Or Address:</strong> 5B, Lentegeur Shopping Centre Mitchells plain, Cape Town</li>
                    <li><strong>Hours:</strong> Monday - Thursday: 8:00 AM - 5:00 PM</li>
                    <li><strong>Saturday:</strong> 8:00 AM - 1:00 PM</li>
                    <li><strong>Payment Due:</strong> Monthly by the 5th of each month</li>
                  </ul>
                  <p><strong>Note:</strong> Please bring your ID and reference number when making payments.</p>
                </div>
              </div>
            )}

            <div className="terms-group">
              <div className="pricing-summary">
                <h4>Subscription Summary</h4>
                <p>Monthly Premium: R100.00</p>
                <p>Contact ambs@almieftagh.com for account details</p>
                <p>Payment Method: {
                   formData.paymentMethod === 'debit-order' ? 'Debit Order' :
                  formData.paymentMethod === 'eft' ? 'Monthly EFT' : 
                  'Cash Payment'
                }</p>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input type="checkbox" required />
                  I authorize monthly R100 payments
                </label>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input type="checkbox" required />
                  I confirm all provided information is accurate
                </label>
              </div>
              {formData.paymentMethod === 'cash' && (
                <div className="form-group checkbox-group">
                  <label>
                    <input type="checkbox" required />
                    I understand that cash payments must be made monthly at your office
                  </label>
                </div>
              )}
            </div>
          </fieldset>
        )}

        <div className="form-actions">
          {step > 1 && (
            <button
              type="button"
              className="back-button"
              onClick={() => setStep(step - 1)}
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <div className="next-actions">
              {step === 1 && !canProceedToPayment() && (
                <p className="validation-hint">Please complete all required fields to continue</p>
              )}
              <button
                type="button"
                className="next-button"
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !canProceedToPayment()}
              >
                {step === 2 ? 'Proceed to Payment' : 'Next'}
              </button>
            </div>
          ) : (
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Complete Subscription'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default ApplyForm;