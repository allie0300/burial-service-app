// src/pages/Dashboard.js
import React, { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, deleteDoc, doc, orderBy, onSnapshot, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';
import PaymentTrackerModal from '../components/modals/PaymentTrackerModal'; // <--- ADD THIS LINE
import EditDateModal from '../components/modals/EditDateModal'; // Adjust path
import DeleteConfirmModal from '../components/modals/DeleteConfirmModal'; // Adjust path
import SubscriptionModal from '../components/modals/SubscriptionModal'; // Adjust path

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



function Dashboard() {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditDateModalOpen, setIsEditDateModalOpen] = useState(false);
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

  const deleteSubscription = async (id) => {
    try {
      await deleteDoc(doc(db, "subscriptions", id));
      console.log(`Subscription ${id} deleted successfully`);
      alert("Subscription deleted successfully!");
      setIsDeleteModalOpen(false);
      setSelectedSubscription(null);
    } catch (error) {
      console.error("Error deleting subscription:", error);
      alert("Failed to delete subscription. Please try again.");
    }
  };

  const handleViewDetails = (subscription) => {
    setSelectedSubscription(subscription);
    setIsModalOpen(true);
  };

  const handlePaymentTracker = (subscription) => {
    setSelectedSubscription(subscription);
    setIsPaymentModalOpen(true);
  };

  const handleDeleteSubscription = (subscription) => {
    setSelectedSubscription(subscription);
    setIsDeleteModalOpen(true);
  };

  const handleEditDate = (subscription) => {
    setSelectedSubscription(subscription);
    setIsEditDateModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSubscription(null);
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedSubscription(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedSubscription(null);
  };

  const closeEditDateModal = () => {
    setIsEditDateModalOpen(false);
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
                          title="View Details"
                        >
                          View
                        </button>
                        <button 
                          className="payment-btn"
                          onClick={() => handlePaymentTracker(sub)}
                          title="Payment Tracker"
                        >
                          💰
                        </button>
                        <button 
                          className="edit-date-btn"
                          onClick={() => handleEditDate(sub)}
                          title="Edit Application Date"
                        >
                          📅
                        </button>
                        {(sub.status === 'pending' || !sub.status) && (
                          <button 
                            className="approve-btn"
                            onClick={() => updateSubscriptionStatus(sub.id, 'active')}
                            title="Activate Subscription"
                          >
                            Activate
                          </button>
                        )}
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteSubscription(sub)}
                          title="Delete Subscription"
                        >
                          🗑️
                        </button>
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

      {/* Payment Tracker Modal */}
      <PaymentTrackerModal 
        subscription={selectedSubscription}
        isOpen={isPaymentModalOpen}
        onClose={closePaymentModal}
        onPaymentUpdate={() => {
          // Refresh data or update state as needed
          console.log('Payment updated');
        }}
      />

      {/* Edit Date Modal */}
      <EditDateModal 
        subscription={selectedSubscription}
        isOpen={isEditDateModalOpen}
        onClose={closeEditDateModal}
        onDateUpdate={() => {
          // Data will refresh automatically due to onSnapshot
          console.log('Date updated');
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal 
        subscription={selectedSubscription}
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={() => deleteSubscription(selectedSubscription?.id)}
      />
    </div>
  );
}

export default Dashboard;