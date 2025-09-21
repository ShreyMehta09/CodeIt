import React from 'react';
import { cn } from '../../utils/helpers';

const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '' 
}) => {
  const baseClasses = 'inline-flex items-center rounded-full font-medium transition-colors';
  
  const variants = {
    default: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    primary: 'bg-primary-100 text-primary-800 hover:bg-primary-200',
    success: 'bg-success-100 text-success-800 hover:bg-success-200',
    warning: 'bg-warning-100 text-warning-800 hover:bg-warning-200',
    danger: 'bg-danger-100 text-danger-800 hover:bg-danger-200',
    outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
};

export default Badge;