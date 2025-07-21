import React from 'react';
// No Firestore imports needed for this modal as deleteDoc is called from Dashboard
// Delete Confirmation Modal Component
function DeleteConfirmModal({ subscription, isOpen, onClose, onConfirm }) {
  if (!isOpen || !subscription) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Confirm Deletion</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="delete-warning">
            <div className="warning-icon">⚠️</div>
            <h3>Are you sure you want to delete this subscription?</h3>
            <p>
              <strong>Subscriber:</strong> {subscription.subscriber?.fullName} {subscription.subscriber?.surname}<br/>
              <strong>Email:</strong> {subscription.subscriber?.email}<br/>
              <strong>Members:</strong> {(subscription.beneficiaries?.length || 0) + 1}
            </p>
            <p className="warning-text">
              This action cannot be undone. All associated data including payment history will be permanently deleted.
            </p>
          </div>
          
          <div className="delete-actions">
            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button className="confirm-delete-btn" onClick={onConfirm}>
              Delete Subscription
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default DeleteConfirmModal;