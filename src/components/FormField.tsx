import React from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  required = false,
  error,
  children,
  className = ''
}: FormFieldProps) {
  return (
    <div className={`form-group ${className}`}>
      <label className={`form-label ${required ? 'required' : ''}`}>
        {label}
      </label>
      {children}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}