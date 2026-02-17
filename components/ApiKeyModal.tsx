import React from 'react';
import { Key, ExternalLink } from 'lucide-react';
import { Language } from '../types';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectKey: () => void;
  language: Language;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSelectKey, language }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-purple-500/50 rounded-xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-white">
             {/* Close icon handled by parent or simple x if needed, but this modal is usually blocking */}
        </button>
        
        <div className="p-8 flex flex-col items-center text-center">
          <div className="p-4 bg-purple-600/20 rounded-full text-purple-300 mb-5 shadow-lg shadow-purple-900/40">
            <Key size={32} />
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-2">
            {language === 'ua' ? 'Потрібен ключ доступу' : 'API Key Required'}
          </h3>
          
          <p className="text-slate-300 mb-6 leading-relaxed">
            {language === 'ua' 
              ? 'Для генерації відео за допомогою моделі Veo потрібен платний API ключ. Будь ласка, оберіть ключ із проекту GCP з налаштованою оплатою.' 
              : 'Video generation using the Veo model requires a paid API key. Please select a key from a billing-enabled GCP project.'}
          </p>

          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm mb-8 hover:underline"
          >
            <span>{language === 'ua' ? 'Інформація про білінг' : 'Billing Documentation'}</span>
            <ExternalLink size={14} />
          </a>

          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={onSelectKey}
              className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-purple-900/20 transition-all transform hover:scale-[1.02]"
            >
              {language === 'ua' ? 'Обрати API ключ' : 'Select API Key'}
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {language === 'ua' ? 'Скасувати' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;