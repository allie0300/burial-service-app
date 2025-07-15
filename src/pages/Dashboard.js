// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

// Inline StatCard component to avoid import issues
function StatCard({ title, value, icon, color = '#3498db' }) {
  return (
    <div className="stat-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="stat-icon" style={{ color }}>
        {icon}
      </div>
      <div className="stat-content">
        <h3>{title}</h3>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}

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

function Dashboard() {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    active: 0,
    totalPeople: 0,
    revenue: 0
  });

  useEffect(() => {
    const q = query(
      collection(db, "subscriptions"), 
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const subs = [];
      querySnapshot.forEach((doc) => {
        subs.push({ id: doc.id, ...doc.data() });
      });
      
      setSubscriptions(subs);
      
      // Calculate total people (subscribers + beneficiaries)
      const totalPeople = subs.reduce((total, sub) => {
        // Each subscription has 1 subscriber + number of beneficiaries
        return total + 1 + (sub.beneficiaries?.length || 0);
      }, 0);
      
      // Calculate stats
      const newStats = {
        total: subs.length,
        pending: subs.filter(s => s.status === 'pending').length,
        active: subs.filter(s => s.status === 'active').length,
        totalPeople: totalPeople,
        revenue: subs.filter(s => s.status === 'active').length * 100
      };
      setStats(newStats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateSubscriptionStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, "subscriptions", id), {
        status: newStatus,
        updatedAt: new Date()
      });
      console.log(`Subscription ${id} updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update subscription status. Please try again.");
    }
  };

  const handleViewDetails = (subscription) => {
    setSelectedSubscription(subscription);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSubscription(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
      alert('Failed to log out. Please try again.');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate ? timestamp.toDate().toLocaleDateString() : new Date(timestamp).toLocaleDateString();
  };

  // Export to CSV functionality
  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Contact', 'ID Number', 'Members', 'Payment Method', 'Status', 'Date Applied'];
    
    const csvData = filteredSubscriptions.map(sub => [
      `${sub.subscriber?.fullName || ''} ${sub.subscriber?.surname || ''}`.trim(),
      sub.subscriber?.email || '',
      sub.subscriber?.contact || '',
      sub.subscriber?.idNumber || '',
      (sub.beneficiaries?.length || 0) + 1,
      sub.paymentMethod === 'debit-order' ? 'Debit Order' : 
      sub.paymentMethod === 'eft' ? 'Monthly EFT' : 
      sub.paymentMethod === 'cash' ? 'Cash Payment' : 'Unknown',
      sub.status || 'Pending',
      formatDate(sub.createdAt)
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `burial-service-subscriptions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter subscriptions based on active filter and search term
  const filteredSubscriptions = subscriptions.filter(sub => {
    // Filter by status
    if (activeFilter !== 'all' && sub.status !== activeFilter) return false;
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const subscriberName = `${sub.subscriber?.fullName || ''} ${sub.subscriber?.surname || ''}`.toLowerCase();
      const email = (sub.subscriber?.email || '').toLowerCase();
      const contact = (sub.subscriber?.contact || '').toLowerCase();
      const idNumber = (sub.subscriber?.idNumber || '').toLowerCase();
      
      return subscriberName.includes(searchLower) || 
             email.includes(searchLower) || 
             contact.includes(searchLower) ||
             idNumber.includes(searchLower);
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Burial Service Dashboard</h1>
            <p>Manage your burial service subscriptions and applications</p>
          </div>
          <div className="header-actions">
            <span className="admin-info">Welcome, {currentUser?.email}</span>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
      
      <div className="stats-grid">
        <StatCard 
          title="Total Subscriptions" 
          value={stats.total} 
          icon="📊"
          color="#3498db"
        />
        <StatCard 
          title="Total People Covered" 
          value={stats.totalPeople.toLocaleString()} 
          icon="👥"
          color="#9b59b6"
        />
        <StatCard 
          title="Pending Applications" 
          value={stats.pending} 
          icon="⏳"
          color="#f39c12"
        />
        <StatCard 
          title="Active Policies" 
          value={stats.active} 
          icon="✅"
          color="#27ae60"
        />
        <StatCard 
          title="Monthly Revenue" 
          value={`R${stats.revenue.toLocaleString()}`} 
          icon="💰"
          color="#e74c3c"
        />
      </div>

      <div className="subscriptions-section">
        <div className="section-header">
          <h2>Recent Applications</h2>
          
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by name, email, contact, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveFilter('pending')}
            >
              Pending
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'active' ? 'active' : ''}`}
              onClick={() => setActiveFilter('active')}
            >
              Active
            </button>
            <button className="export-btn" onClick={exportToCSV}>
              Export CSV
            </button>
          </div>
        </div>

        {filteredSubscriptions.length === 0 ? (
          <div className="empty-state">
            <p>No applications found for the selected filter</p>
          </div>
        ) : (
          <div className="subscriptions-table">
            <table>
              <thead>
                <tr>
                  <th>Subscriber</th>
                  <th>Contact</th>
                  <th>Members</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th>Date Applied</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <div className="subscriber-info">
                        <strong>
                          {sub.subscriber?.fullName && sub.subscriber?.surname 
                            ? `${sub.subscriber.fullName} ${sub.subscriber.surname}`
                            : sub.subscriber?.fullName || 'N/A'
                          }
                        </strong>
                        <small>{sub.subscriber?.email || 'N/A'}</small>
                      </div>
                    </td>
                    <td>{sub.subscriber?.contact || 'N/A'}</td>
                    <td>
                      <span className="member-count">
                        {(sub.beneficiaries?.length || 0) + 1} members
                      </span>
                    </td>
                    <td>
                      <span className={`payment-method ${sub.paymentMethod}`}>
                        {sub.paymentMethod === 'debit-order' ? 'Debit Order' : 
                         sub.paymentMethod === 'eft' ? 'Monthly EFT' : 
                         sub.paymentMethod === 'cash' ? 'Cash Payment' : 
                         'Unknown'}
                      </span>
                    </td>
                    <td>
                      <span className={`status ${sub.status || 'pending'}`}>
                        {sub.status ? sub.status.charAt(0).toUpperCase() + sub.status.slice(1) : 'Pending'}
                      </span>
                    </td>
                    <td>{formatDate(sub.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="view-btn"
                          onClick={() => handleViewDetails(sub)}
                        >
                          View
                        </button>
                        {(sub.status === 'pending' || !sub.status) && (
                          <button 
                            className="approve-btn"
                            onClick={() => updateSubscriptionStatus(sub.id, 'active')}
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for viewing subscription details */}
      <SubscriptionModal 
        subscription={selectedSubscription}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}

export default Dashboard;