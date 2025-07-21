import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';

// Edit Application Date Modal Component
function EditDateModal({ subscription, isOpen, onClose, onDateUpdate }) {
  const [newDate, setNewDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (subscription && isOpen) {
      const currentDate = subscription.createdAt?.toDate?.() || new Date(subscription.createdAt);
      setNewDate(currentDate.toISOString().split('T')[0]);
    }
  }, [subscription, isOpen]);

  const handleUpdateDate = async () => {
    if (!subscription || !newDate) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, "subscriptions", subscription.id), {
        createdAt: new Date(newDate),
        updatedAt: new Date()
      });
      
      alert('Application date updated successfully!');
      onDateUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating date:', error);
      alert('Failed to update date. Please try again.');
    }
    setLoading(false);
  };

  if (!isOpen || !subscription) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-date-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Application Date</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="edit-date-section">
            <p><strong>Subscriber:</strong> {subscription.subscriber?.fullName} {subscription.subscriber?.surname}</p>
            <div className="date-input-group">
              <label>Application Date:</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]} // Can't set future date
              />
            </div>
            <div className="edit-date-actions">
              <button className="cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button 
                className="save-btn" 
                onClick={handleUpdateDate}
                disabled={loading || !newDate}
              >
                {loading ? 'Updating...' : 'Update Date'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default EditDateModal;
