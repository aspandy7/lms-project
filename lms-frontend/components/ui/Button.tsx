
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className, ...props }) => {
  // Styles based on screenshots:
  // - Rectangular (no rounded corners or very minimal)
  // - Uppercase, Bold, Display font
  // - Specific color combinations
  
  const baseStyles = "px-8 py-3 font-display font-bold uppercase tracking-wider transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-lg leading-none";
  
  const variants = {
    // Screenshot 1: Green background, White text
    primary: "bg-brand-green text-white hover:bg-[#e1ea7d] hover:shadow-[0_0_20px_rgba(210,219,92,0.3)]",
    
    // Screenshot 2: Purple background, Dark text
    secondary: "bg-brand-purple text-gray-900 hover:bg-[#9d84c9] hover:shadow-[0_0_20px_rgba(136,113,177,0.3)]",
    
    // Outline style tailored to match brand
    outline: "border-2 border-brand-green text-brand-green hover:bg-brand-green hover:text-brand-blue",
    
    // Ghost for transparent buttons
    ghost: "bg-transparent text-white hover:bg-white/10"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className || ''}`} {...props}>
      {children}
    </button>
  );
};
