import React, { useEffect, useState } from 'react';
import { X, Video, Download, Loader2, Sparkles } from 'lucide-react';
import { Language } from '../types';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string | null;
  isLoading: boolean;
  language: Language;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ 
  isOpen, 
  onClose, 
  videoUrl, 
  isLoading, 
  language 
}) => {
  const [loadingMsg, setLoadingMsg] = useState("");
  
  const messagesEn = [
    "Initializing Veo model...",
    "Dreaming up scenes...",
    "Calculating physics...",
    "Rendering frames...",
    "Adding magic sparkles...",
    "Polishing pixels...",
    "Almost there..."
  ];
  
  const messagesUa = [
    "Ініціалізація Veo...",
    "Вигадуємо сцени...",
    "Рахуємо фізику...",
    "Рендеримо кадри...",
    "Додаємо магії...",
    "Поліруємо пікселі...",
    "Майже готово..."
  ];

  useEffect(() => {
    if (isLoading && isOpen) {
      const msgs = language === 'ua' ? messagesUa : messagesEn;
      let i = 0;
      setLoadingMsg(msgs[0]);
      const interval = setInterval(() => {
        i = (i + 1) % msgs.length;
        setLoadingMsg(msgs[i]);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isLoading, isOpen, language]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/90 z-10">
           <div className="flex items-center gap-2 text-slate-100">
               <Video className="text-purple-400" size={20} />
               <span className="font-bold">
                   {language === 'ua' ? 'Генерація Відео (Veo)' : 'Video Generation (Veo)'}
               </span>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
               <X size={24} />
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-[400px] flex items-center justify-center bg-black relative">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-8 text-center animate-pulse">
                    <div className="relative">
                        <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                        <Loader2 size={64} className="text-purple-400 animate-spin relative z-10" />
                    </div>
                    <h3 className="mt-8 text-xl font-bold text-slate-200">
                        {loadingMsg}
                    </h3>
                    <p className="mt-2 text-slate-500 text-sm max-w-xs">
                        {language === 'ua' 
                            ? 'Це може зайняти хвилину або дві. Будь ласка, зачекайте.' 
                            : 'This can take a minute or two. Please hold on.'}
                    </p>
                </div>
            ) : videoUrl ? (
                <div className="w-full h-full flex flex-col">
                    <video 
                        src={videoUrl} 
                        controls 
                        autoPlay 
                        loop 
                        className="w-full h-auto max-h-[70vh] object-contain mx-auto"
                    />
                </div>
            ) : (
                <div className="text-slate-500">
                    {language === 'ua' ? 'Не вдалося завантажити відео' : 'Failed to load video'}
                </div>
            )}
        </div>
        
        {/* Footer */}
        {!isLoading && videoUrl && (
             <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
                 <a 
                    href={videoUrl} 
                    download="generated_video.mp4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
                 >
                     <Download size={18} />
                     <span>{language === 'ua' ? 'Завантажити' : 'Download'}</span>
                 </a>
                 <button 
                    onClick={onClose}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium shadow-lg shadow-purple-900/20"
                 >
                     {language === 'ua' ? 'Готово' : 'Done'}
                 </button>
             </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayerModal;