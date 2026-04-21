import React from 'react';

export const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const variants = {
    primary: 'bg-primary text-white hover:bg-blue-700 shadow-sm',
    secondary: 'bg-white/8 text-white hover:bg-white/12 border border-white/10',
    danger: 'bg-danger text-white hover:bg-red-700 shadow-sm',
    success: 'bg-success text-white hover:bg-green-700 shadow-sm',
    outline: 'border border-white/12 text-white/85 hover:bg-white/8',
    ghost: 'text-white/75 hover:bg-white/8',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
    xl: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${variants[variant]} ${sizes[size]} rounded font-medium transition-colors duration-150 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
