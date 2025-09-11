import React, { useState, useEffect } from 'react';
import ClientLogin from './ClientLogin';

const ClientModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen) return null;

  // Responsive modal width
  const modalWidth = windowWidth <= 600 ? '70%' : '90%';

  return (
    <div style={styles.modalOverlay}>
      <div style={{ ...styles.modalContent, width: modalWidth }}>
        <button onClick={onClose} style={styles.closeButton}>
          &times;
        </button>
        <ClientLogin onLoginSuccess={onLoginSuccess} />
      </div>
    </div>
  );
};

export default ClientModal;

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: '1.5rem',
    borderRadius: '12px',
    maxWidth: '400px',
    boxShadow: '0 6px 18px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    transition: 'width 0.3s ease',
  },
  closeButton: {
    position: 'absolute',
    top: '10px',
    right: '12px',
    color: '#374151',
    border: 'none',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '20px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
};
