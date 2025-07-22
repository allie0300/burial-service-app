// src/App.js
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ApplyForm from './pages/ApplyForm';
import Dashboard from './pages/Dashboard';
import './App.css';
import almieftaghLogo from './assets/Almieftagh_logo.png'; // Adjust filename as needed
function App() {
  const [connection, setConnection] = useState({
    status: 'connecting',
    documentId: null,
    error: null
  });
 
  const location = useLocation();

  useEffect(() => {
    const testConnection = async () => {
      try {
        const docRef = await addDoc(collection(db, "connectionTests"), {
          timestamp: serverTimestamp(),
          app: "ALMIEFTAGH Burial Services",
          purpose: "Connection test"
        });
        setConnection({
          status: 'connected',
          documentId: docRef.id,
          error: null
        });
      } catch (error) {
        console.error("Connection test failed:", error);
        setConnection({
          status: 'error',
          documentId: null,
          error: {
            code: error.code,
            message: error.message
          }
        });
      }
    };
  
    
    testConnection();
  }, []);

  return (
    <div className="App">
      <nav className="app-nav">
         <div className="nav-brand">
          <Link to="/">
            <img src={almieftaghLogo} alt="ALMIEFTAGH Burial Services Logo" className="app-logo" />
          </Link>
          {/* Keep the h2 here */}
          <h2>AL-MIEFTAGH Burial Services</h2>
        </div>
        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>
          <Link to="/apply" className={`nav-link ${location.pathname === '/apply' ? 'active' : ''}`}>
            Apply Now
          </Link>
          <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
            Dashboard
          </Link>
        </div>
      </nav>

      <div className={`connection-banner ${connection.status}`}>
        {connection.status === 'connecting' && '🔵 Connecting to database...'}
        {connection.status === 'connected' && `✅ Connected (ID: ${connection.documentId?.slice(0, 8)})`}
        {connection.status === 'error' && `❌ Error: ${connection.error?.message || 'Connection failed'}`}
      </div>

      <main className="app-content">
        <Routes>
          <Route path="/" element={
            <div className="home-page">
              <div className="hero-section">
                <h1>Welcome to Al-Mieftagh Burial Services</h1>
                <p className="hero-subtitle">Dignified Islamic burial services for your family</p>
                <div className="hero-features">
                  <div className="feature">
                    <span className="feature-icon">👨‍👩‍👧‍👦</span>
                    <span>Cover the whole family</span>
                  </div>
                  <div className="feature">
                    <span className="feature-icon">💰</span>
                    <span>Only R100 per month</span>
                  </div>
                  <div className="feature">
                    <span className="feature-icon">🤝</span>
                    <span>Islamic burial services</span>
                  </div>
                </div>
                <Link to="/apply" className="cta-button">
                  Start Your Application
                </Link>
              </div>
              
              {/* Additional Home Page Content */}
              <div className="info-sections">
                <div className="info-section">
                  <h2>Why Choose AL-MIEFTAGH?</h2>
                  <div className="info-grid">
                    <div className="info-card">
                      <div className="info-icon">🕌</div>
                      <h3>Islamic Compliance</h3>
                      <p>All burial services conducted according to Islamic traditions and requirements.</p>
                    </div>
                    <div className="info-card">
                      <div className="info-icon">⚡</div>
                      <h3>Quick Response</h3>
                      <p>24/7 availability with immediate response during times of need.</p>
                    </div>
                    <div className="info-card">
                      <div className="info-icon">💝</div>
                      <h3>Family Coverage</h3>
                      <p>One affordable plan that covers you and your family.</p>
                    </div>
                    <div className="info-card">
                      <div className="info-icon">🛡️</div>
                      <h3>Peace of Mind</h3>
                      <p>Secure your family's future with our reliable burial benefit plan.</p>
                    </div>
                  </div>
                </div>

                <div className="pricing-section">
                  <h2>Simple, Transparent Pricing</h2>
                  <div className="pricing-card">
                    <div className="pricing-header">
                      <h3>Family Burial Plan</h3>
                      <div className="price">
                        <span className="currency">R</span>
                        <span className="amount">100</span>
                        <span className="period">/month</span>
                        
                      </div>
                    </div>
                    <div className="pricing-features">
                      <div className="feature-item">
                        <span className="check">✓</span>
                        <span>Cover the whole family</span>
                      </div>
                      <div className="feature-item">
                        <span className="check">✓</span>
                        <span>Islamic burial services</span>
                      </div>
                      <div className="feature-item">
                        <span className="check">✓</span>
                        <span>24/7 emergency response</span>
                      </div>
                      <div className="feature-item">
                        <span className="check">✓</span>
                        <span>Active after R100 registration fee and 1 month premium</span>
                      </div>
                      <div className="feature-item">
                        <span className="check">✓</span>
                        <span>Cash or EFT payment</span>
                      </div>
                      <div className="feature-item">
                      
                        <span className="currency">R</span>
                        <span className="amount">50</span>
                        <span className="period">Pensioner T&C's Apply</span>
                      </div>
                    </div>
                    <Link to="/apply" className="pricing-cta">
                      Get Started Today
                    </Link>
                  </div>
                </div>

                <div className="contact-section">
                  <h2>Get in Touch</h2>
                  <div className="contact-grid">
                    <div className="contact-item">
                      <div className="contact-icon">📞</div>
                      <h4>Phone</h4>
                      <p>073 229 5029</p>
                      <p>079 496 6833</p>
                    </div>
                    <div className="contact-item">
                      <div className="contact-icon">📧</div>
                      <h4>Email</h4>
                      <p>amburials@gmail.com</p>
                    </div>
                    <div className="contact-item">
                      <div className="contact-icon">🕐</div>
                      <h4>Availability</h4>
                      <p>24/7 Emergency Response</p>
                      <p>Office Hours: 8AM - 5PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          } />
          <Route path="/apply" element={<ApplyForm />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={
            <div className="not-found">
              <h1>404 - Page Not Found</h1>
              <p>The page you're looking for doesn't exist.</p>
              <Link to="/" className="back-home-btn">
                Return Home
              </Link>
            </div>
          } />
        </Routes>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>AL-MIEFTAGH Burial Services</h3>
            <p>Providing dignified Islamic burial services with compassion and respect for over a decade.</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <div className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/apply">Apply Now</Link>
              <Link to="/dashboard">Dashboard</Link>
            </div>
          </div>
          <div className="footer-section">
            <h4>Contact Information</h4>
            <div className="contact-info">
              <p><strong>Phone:</strong></p>
              <p>📞 073 229 5029</p>
              <p>📞 079 496 6833</p>
              <p><strong>Email:</strong></p>
              <p>📧 amburials@gmail.com</p>
            </div>
          </div>
          <div className="footer-section">
            <h4>Service Areas</h4>
            <p>We provide services across Cape Town South Africa with special focus on Islamic communities.</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2019 AL-MIEFTAGH Burial Services. All rights reserved.</p>
          <p>Developed with care for the community.</p>
        </div>
      </footer>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <AuthProvider>
      <Router>
        <App />
      </Router>
    </AuthProvider>
  );
}