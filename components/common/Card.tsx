
import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  bodyClassName?: string;
  footer?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, children, className = '', titleClassName = '', bodyClassName = '', footer }) => {
  return (
    <div className={`bg-white shadow-lg rounded-lg overflow-hidden ${className}`}>
      {title && (
        <div className={`p-4 sm:p-5 border-b border-gray-200 ${titleClassName}`}>
          <h3 className="text-lg sm:text-xl font-semibold text-smkn-text">{title}</h3>
        </div>
      )}
      <div className={`p-4 sm:p-5 ${bodyClassName}`}>
        {children}
      </div>
      {footer && (
        <div className="p-4 sm:p-5 border-t border-gray-200 bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
    