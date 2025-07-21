import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase'; // Adjust path based on where 'components' is relative to 'firebase.js'
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
// If you have specific CSS for this modal, import it here, e.g.,


// Payment Tracker Modal Component
function PaymentTrackerModal({ subscription, isOpen, onClose, onPaymentUpdate }) {
  const [payments, setPayments] = useState([]);
  const [newPayment, setNewPayment] = useState({
    amount: subscription?.monthlyFee || 100,
    date: new Date().toISOString().split('T')[0],
    method: 'debit-order',
    status: 'paid'
  });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // New state for financial summary
  const [financialSummary, setFinancialSummary] = useState({
    totalPaid: 0,
    amountOwed: 0,
    creditAmount: 0, // New: To show if there's an overpayment/credit
    hasCredit: false
  });

  // Memoize generatePaymentHistory to prevent unnecessary re-creations
  const generatePaymentHistory = useCallback(async (sub) => {
    setDataLoading(true);
    const history = [];
    // Ensure createdAt is a Date object
    const startDate = new Date(sub.createdAt?.toDate?.() || sub.createdAt || new Date());
    const currentDate = new Date();
    
    let actualPayments = [];
    try {
      const paymentsQuery = query(
        collection(db, "payments"),
        where("subscriptionId", "==", sub.id)
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      actualPayments = paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Fetched payments:', actualPayments); // Debug log
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
    
    let date = new Date(startDate);
    date.setDate(1); // Start from first day of month
    
    while (date <= currentDate) {
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const actualPayment = actualPayments.find(payment => {
        // Ensure payment.date is treated as a Date object for comparison
        const paymentDate = new Date(payment.date);
        const paymentMonthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
        return paymentMonthKey === monthKey;
      });
      
      let status = 'pending';
      let amountForPeriod = sub.monthlyFee || 100; // Default to monthly fee for expected amount
      
      if (actualPayment) {
        status = 'paid';
        amountForPeriod = actualPayment.amount; // Use actual paid amount if payment exists
      } else {
        const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthKey < currentMonthKey) {
          status = 'overdue';
        }
      }
      
      history.push({
        id: monthKey,
        month: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
        date: date.toISOString().split('T')[0],
        amount: amountForPeriod, // This now correctly represents the amount for this period (actual or expected)
        status: status,
        method: actualPayment?.method || sub.paymentMethod || 'debit-order',
        paymentId: actualPayment?.id || null
      });
      
      date.setMonth(date.getMonth() + 1);
    }
    
    setDataLoading(false);
    return history.reverse();
  }, []); // Dependencies: none if sub comes from useEffect's dependency array

  useEffect(() => {
    if (subscription && isOpen) {
      const loadPayments = async () => {
        const paymentHistory = await generatePaymentHistory(subscription);
        setPayments(paymentHistory);
      };
      loadPayments();
    }
  }, [subscription, isOpen, generatePaymentHistory]); // Add generatePaymentHistory to dependencies

  // New useEffect to calculate summary whenever payments change
  useEffect(() => {
    const calculateSummary = () => {
      if (!subscription) { // If subscription becomes null, stop calculation
        setFinancialSummary({
          totalPaid: 0,
          amountOwed: 0,
          creditAmount: 0,
          hasCredit: false
        });
        return; // Exit early
      }
      let cumulativeExpected = 0;
      let cumulativePaid = 0;

      // Iterate over the history *chronologically* for correct balance calculation
      // `payments` is already reversed for display, so we need to reverse it back to chronological
      const chronologicalPayments = [...payments].reverse(); 

      chronologicalPayments.forEach(item => {
        cumulativeExpected += (subscription.monthlyFee || 100); // Always add the expected monthly fee
        if (item.status === 'paid') {
          cumulativePaid += item.amount; // Add the actual amount paid for "paid" months
        }
      });

      const currentBalance = cumulativeExpected - cumulativePaid;

      setFinancialSummary({
        totalPaid: cumulativePaid, // Sum of actual amounts paid
        amountOwed: Math.max(0, currentBalance), // Amount owed is currentBalance if positive, else 0
        creditAmount: Math.max(0, -currentBalance), // Credit is negative currentBalance if negative, else 0
        hasCredit: currentBalance < 0
      });
    };

       // Only run calculation if data has loaded AND a subscription is present AND there are payments
    // or if payments become empty (e.g., after deletion) but a subscription is still there.
    if (!dataLoading && subscription) { // Check for subscription here
      calculateSummary();
    } else if (!dataLoading && !subscription) { // Clear summary if subscription is null after loading
        setFinancialSummary({
            totalPaid: 0,
            amountOwed: 0,
            creditAmount: 0,
            hasCredit: false
        });
    }
  }, [payments, dataLoading, subscription]); // Recalculate when payments, dataLoading or subscription changes


  const handleAddPayment = async () => {
    if (!subscription || !newPayment.date || !newPayment.amount) {
      alert('Please fill in all payment details');
      return;
    }
    
    setLoading(true);
    try {
      const paymentData = {
        subscriptionId: subscription.id,
        subscriberName: `${subscription.subscriber?.fullName || ''} ${subscription.subscriber?.surname || ''}`.trim(),
        amount: parseFloat(newPayment.amount),
        date: newPayment.date,
        method: newPayment.method,
        status: 'paid', // Always 'paid' when manually recording
        recordedAt: new Date(),
        createdAt: new Date()
      };
      
      console.log('Adding payment:', paymentData);
      
      await addDoc(collection(db, "payments"), paymentData);
      
      // Reload payment history immediately
      const updatedPaymentHistory = await generatePaymentHistory(subscription);
      setPayments(updatedPaymentHistory);
      
      // Reset form to next month or current month
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setNewPayment({
        amount: subscription.monthlyFee || 100, // Reset amount to monthly fee
        date: nextMonth.toISOString().split('T')[0],
        method: 'debit-order',
        status: 'paid'
      });
      
      if (onPaymentUpdate) onPaymentUpdate();
      
      alert('Payment recorded successfully!');
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment. Please try again.');
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#27ae60';
      case 'pending': return '#f39c12';
      case 'overdue': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  // Delete a payment
  const handleDeletePayment = async (payment) => {
    if (!payment.paymentId) return;
    
    if (window.confirm('Are you sure you want to delete this payment record?')) {
      try {
        await deleteDoc(doc(db, "payments", payment.paymentId));
        
        const updatedPaymentHistory = await generatePaymentHistory(subscription);
        setPayments(updatedPaymentHistory);
        
        alert('Payment deleted successfully!');
      } catch (error) {
          console.error('Error deleting payment:', error);
          alert('Failed to delete payment.');
      }
    }
  };

  if (!isOpen || !subscription) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Payment Tracker - {subscription.subscriber?.fullName} {subscription.subscriber?.surname}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {dataLoading ? (
            <div className="loading-payments">
              <p>Loading payment data...</p>
            </div>
          ) : (
            <>
              {/* Payment Summary */}
              <div className="payment-summary">
                <div className="summary-card">
                  <h4>Total Paid</h4>
                  <span className="amount paid">R{financialSummary.totalPaid.toLocaleString()}</span>
                </div>
                <div className="summary-card">
                  <h4>Amount Owed</h4>
                  {financialSummary.hasCredit ? (
                    <span className="amount credit">R{financialSummary.creditAmount.toLocaleString()} (Credit)</span>
                  ) : (
                    <span className="amount owed">R{financialSummary.amountOwed.toLocaleString()}</span>
                  )}
                </div>
                <div className="summary-card">
                  <h4>Monthly Fee</h4>
                  <span className="amount">R{(subscription.monthlyFee || 100).toLocaleString()}</span>
                </div>
              </div>

              {/* Add New Payment */}
              <div className="add-payment-section">
                <h3>Record Payment</h3>
                <div className="payment-form">
                  <input
                    type="date"
                    value={newPayment.date}
                    onChange={(e) => setNewPayment({...newPayment, date: e.target.value})}
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({...newPayment, amount: Number(e.target.value)})}
                  />
                  <select
                    value={newPayment.method}
                    onChange={(e) => setNewPayment({...newPayment, method: e.target.value})}
                  >
                    <option value="debit-order">Debit Order</option>
                    <option value="eft">EFT</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                  </select>
                  <button 
                    onClick={handleAddPayment} 
                    disabled={loading}
                    className="record-payment-btn"
                  >
                    {loading ? 'Recording...' : 'Record Payment'}
                  </button>
                </div>
              </div>

              {/* Payment History */}
              <div className="payment-history">
                <h3>Payment History</h3>
                <div className="payments-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Method</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td>{payment.month}</td>
                          <td>R{payment.amount.toLocaleString()}</td> {/* Format amount here */}
                          <td>
                            <span 
                              className={`payment-status ${payment.status}`}
                              style={{ color: getStatusColor(payment.status) }}
                            >
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </span>
                          </td>
                          <td className="payment-method-cell">
                            {payment.method === 'debit-order' ? 'Debit Order' : 
                             payment.method === 'eft' ? 'EFT' : 
                             payment.method === 'cash' ? 'Cash' :
                             payment.method === 'card' ? 'Card' : 'Unknown'}
                          </td>
                          <td>
                            {payment.paymentId && (
                              <button 
                                className="delete-payment-btn"
                                onClick={() => handleDeletePayment(payment)}
                                title="Delete Payment"
                              >
                                🗑️
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {payments.length === 0 && (
                    <p className="no-payments-message">No payment history available.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentTrackerModal;