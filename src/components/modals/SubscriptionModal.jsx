import React from 'react';
// Modal component for viewing subscription details
function SubscriptionModal({ subscription, isOpen, onClose }) {
  if (!isOpen || !subscription) return null;

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate ? timestamp.toDate().toLocaleDateString() : new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Subscription Details</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {/* Subscriber Information */}
          <div className="detail-section">
            <h3>Subscriber Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>First Name:</label>
                <span>{subscription.subscriber?.fullName || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Surname:</label>
                <span>{subscription.subscriber?.surname || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>ID Number:</label>
                <span>{subscription.subscriber?.idNumber || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Date of Birth:</label>
                <span>{subscription.subscriber?.dateOfBirth || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Gender:</label>
                <span>{subscription.subscriber?.gender ? subscription.subscriber.gender.charAt(0).toUpperCase() + subscription.subscriber.gender.slice(1) : 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Email:</label>
                <span>{subscription.subscriber?.email || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <label>Contact Number:</label>
                <span>{subscription.subscriber?.contact || 'N/A'}</span>
              </div>
              <div className="detail-item full-width">
                <label>Address:</label>
                <span>{subscription.subscriber?.address || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Beneficiaries Information */}
          <div className="detail-section">
            <h3>Beneficiaries ({subscription.beneficiaries?.length || 0})</h3>
            {subscription.beneficiaries && subscription.beneficiaries.length > 0 ? (
              <div className="beneficiaries-list">
                {subscription.beneficiaries.map((beneficiary, index) => (
                  <div key={index} className="beneficiary-card">
                    <h4>Beneficiary {index + 1}</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>First Name:</label>
                        <span>{beneficiary.fullName || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Surname:</label>
                        <span>{beneficiary.surname || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <label>ID Number:</label>
                        <span>{beneficiary.idNumber || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Date of Birth:</label>
                        <span>{beneficiary.dateOfBirth || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Gender:</label>
                        <span>{beneficiary.gender ? beneficiary.gender.charAt(0).toUpperCase() + beneficiary.gender.slice(1) : 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Relationship:</label>
                        <span>{beneficiary.relationship ? beneficiary.relationship.charAt(0).toUpperCase() + beneficiary.relationship.slice(1) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-beneficiaries-message">
                <p>No beneficiaries added to this policy.</p>
              </div>
            )}
          </div>

          {/* Payment Information */}
          <div className="detail-section">
            <h3>Payment Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Payment Method:</label>
                <span>
                  {subscription.paymentMethod === 'debit-order' ? 'Debit Order' : 
                   subscription.paymentMethod === 'eft' ? 'Monthly EFT' : 
                   subscription.paymentMethod === 'cash' ? 'Cash Payment' : 
                   'Unknown'}
                </span>
              </div>
              <div className="detail-item">
                <label>Monthly Fee:</label>
                <span>R{subscription.monthlyFee || 100}</span>
              </div>
              {subscription.bankDetails && subscription.paymentMethod === 'debit-order' && (
                <>
                  <div className="detail-item">
                    <label>Bank Name:</label>
                    <span>{subscription.bankDetails.bankName || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Account Number:</label>
                    <span>{subscription.bankDetails.accountNumber || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Branch Code:</label>
                    <span>{subscription.bankDetails.branchCode || 'N/A'}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Application Status */}
          <div className="detail-section">
            <h3>Application Status</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Status:</label>
                <span className={`status ${subscription.status}`}>
                  {subscription.status ? subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1) : 'Pending'}
                </span>
              </div>
              <div className="detail-item">
                <label>Date Applied:</label>
                <span>{formatDate(subscription.createdAt)}</span>
              </div>
              <div className="detail-item">
                <label>Last Updated:</label>
                <span>{formatDate(subscription.updatedAt)}</span>
              </div>
              <div className="detail-item">
                <label>Total Members:</label>
                <span>{(subscription.beneficiaries?.length || 0) + 1} (Subscriber + {subscription.beneficiaries?.length || 0} beneficiaries)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default SubscriptionModal;