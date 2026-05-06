import React from 'react';
import type { SimpleMessageProps } from '../../../types/ui-schema';

const SimpleMessage: React.FC<SimpleMessageProps> = ({ text, type }) => {
  const typeStyles: Record<SimpleMessageProps['type'], string> = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    success: 'bg-green-50 border-green-200 text-green-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  };

  return (
    <div className={`p-4 rounded-lg border ${typeStyles[type]}`}>
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
};

export default SimpleMessage;
