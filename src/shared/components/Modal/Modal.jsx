import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@shared/utils/helpers';
import { useOnClickOutside } from '@shared/hooks';
import { useRef } from 'react';
import './Modal.css';

const Modal = ({ 
  isOpen,
  onClose,
  title,
  children,
  size = 'md', // sm | md | lg
  showCloseButton = true,
  closeOnClickOutside = true,
  closeOnEscape = true,
  className = '',
}) => {
  const modalRef = useRef(null);

  // Close on click outside
  useOnClickOutside(modalRef, () => {
    if (closeOnClickOutside && isOpen) {
      onClose();
    }
  });

  // Close on Escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeOnEscape, isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay">
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          
          <div className="modal-container">
            <motion.div
              ref={modalRef}
              className={cn('modal', `modal--${size}`, className)}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              {(title || showCloseButton) && (
                <div className="modal-header">
                  {title && <h2 className="modal-title">{title}</h2>}
                  {showCloseButton && (
                    <button
                      className="modal-close"
                      onClick={onClose}
                      aria-label="Close modal"
                    >
                      <span style={{ position: 'relative', zIndex: 100 }}>✕</span>
                    </button>
                  )}
                </div>
              )}
              
              <div className="modal-content">
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
