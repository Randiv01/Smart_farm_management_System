import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './styles/P-Modal.css';

const Modal = ({ title, onClose, children }) => {
  useEffect(() => {
    // No destroy call needed, cleanup is safe
    return () => {};
  }, []);

  const handleBackgroundClick = (e) => {
    if (e.target.className === 'modal-overlay') {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleBackgroundClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
