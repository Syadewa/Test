
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: string;
  rightIcon?: string;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  isLoading = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-smkn-blue text-white hover:bg-smkn-blue-dark focus:ring-smkn-blue',
    secondary: 'bg-gray-200 text-smkn-text hover:bg-gray-300 focus:ring-gray-400',
    danger: 'bg-smkn-danger text-white hover:bg-red-700 focus:ring-smkn-danger',
    success: 'bg-smkn-success text-white hover:bg-green-700 focus:ring-smkn-success',
    warning: 'bg-smkn-warning text-black hover:bg-yellow-500 focus:ring-smkn-warning',
    ghost: 'bg-transparent text-smkn-blue hover:bg-smkn-blue/10 focus:ring-smkn-blue',
  };

  const sizeStyles = {
    sm: 'py-1.5 px-3 text-xs',
    md: 'py-2 px-4 text-sm',
    lg: 'py-3 px-6 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-r-2 border-current mr-2"></div>}
      {leftIcon && !isLoading && <i className={`${leftIcon} mr-2`}></i>}
      {children}
      {rightIcon && !isLoading && <i className={`${rightIcon} ml-2`}></i>}
    </button>
  );
};

export default Button;
    