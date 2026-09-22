import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className, ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-white mb-2 font-display uppercase tracking-wider text-sm">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 rounded-xl bg-white text-brand-blue placeholder-brand-blue/50 focus:outline-none focus:ring-4 focus:ring-brand-cyan/50 transition-all font-sans font-medium ${className}`}
        {...props}
      />
    </div>
  );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, className, ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-white mb-2 font-display uppercase tracking-wider text-sm">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-4 py-3 rounded-xl bg-white text-brand-blue placeholder-brand-blue/50 focus:outline-none focus:ring-4 focus:ring-brand-cyan/50 transition-all font-sans font-medium ${className}`}
        {...props}
      />
    </div>
  );
};