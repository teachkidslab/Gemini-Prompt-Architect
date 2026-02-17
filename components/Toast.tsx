import React, { useEffect } from 'react';
import { Check, X, Info } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const icons = {
    success: <Check size={18} />,
    error: <X size={18} />,
    info: <Info size={18} />
  };

  const colors = {
    success: 'bg-green-600 border-green-500 text-white',
    error: 'bg-red-600 border-red-500 text-white',
    info: 'bg-blue-600 border-blue-500 text-white'
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300 mb-2 ${colors[toast.type]}`}>
      <div className="shrink-0">
        {icons[toast.type]}
      </div>
      <span className="text-sm font-medium">{toast.message}</span>
      <button 
        onClick={() => onClose(toast.id)} 
        className="ml-auto opacity-70 hover:opacity-100 transition-opacity"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default Toast;