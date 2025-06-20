
import React from 'react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  const baseClasses = 'p-4 rounded-md mb-4 flex items-start';
  const typeClasses = {
    success: 'bg-green-100 border border-green-400 text-green-700',
    error: 'bg-red-100 border border-red-400 text-red-700',
    warning: 'bg-yellow-100 border border-yellow-400 text-yellow-700',
    info: 'bg-blue-100 border border-blue-400 text-blue-700',
  };

  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-times-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle',
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`} role="alert">
      <i className={`${icons[type]} mr-3 mt-1`}></i>
      <div className="flex-1">
        {message}
      </div>
      {onClose && (
        <button onClick={onClose} className="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-md hover:bg-opacity-20 focus:outline-none">
          <span className="sr-only">Dismiss</span>
          <i className="fas fa-times"></i>
        </button>
      )}
    </div>
  );
};

export default Alert;
    