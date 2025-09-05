import React from 'react';
import { createPortal } from 'react-dom';

interface NotificationPortalProps {
  isOpen: boolean;
  children: React.ReactNode;
}

const NotificationPortal: React.FC<NotificationPortalProps> = ({ isOpen, children }) => {
  if (!isOpen) return null;

  // إنشاء portal في body مباشرة لضمان أعلى z-index
  return createPortal(
    <div 
      className="fixed inset-0 z-[999999] pointer-events-none"
      style={{ zIndex: 999999 }}
    >
      <div className="absolute top-16 right-4 pointer-events-auto">
        {children}
      </div>
    </div>,
    document.body
  );
};

export default NotificationPortal;