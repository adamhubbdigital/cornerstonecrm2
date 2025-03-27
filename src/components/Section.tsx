import React from 'react';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function Section({ title, children, actions, className = '' }: SectionProps) {
  return (
    <div className={`border-t border-gray-200 pt-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {actions}
      </div>
      {children}
    </div>
  );
}