import React, { useState, useRef } from 'react';
import { ImagePlus, X, Film, CheckCircle2 } from 'lucide-react';
import { Language } from '../types';

interface VideoSourceWidgetProps {
  language: Language;
  onImageSelected: (base64: string | null) => void;
}

const VideoSourceWidget: React.FC<VideoSourceWidgetProps> = ({ language, onImageSelected }) => {
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImage(base64);
      onImageSelected(base64);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImage(null);
    onImageSelected(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-rose-500/30 p-4 mb-4 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
        <Film size={64} className="text-rose-400" />
      </div>

      <h2 className="text-sm font-bold text-rose-300 mb-3 uppercase tracking-wider flex items-center gap-2">
        <ImagePlus size={16} />
        {language === 'ua' ? 'Початковий Кадр' : 'Start Image (Video)'}
      </h2>

      {!image ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-600 hover:border-rose-500 hover:bg-slate-700/50 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all gap-2 text-slate-400 hover:text-rose-200"
        >
          <Film size={24} />
          <span className="text-xs text-center font-medium">
            {language === 'ua' ? 'Завантажити зображення' : 'Upload Start Frame'}
          </span>
          <span className="text-[10px] opacity-60 text-center px-2">
             {language === 'ua' ? 'Оживити фото (Image-to-Video)' : 'Animate this image'}
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden border border-slate-600 bg-black aspect-video max-h-32 mx-auto group-image">
            <img src={image} alt="Start Frame" className="w-full h-full object-cover opacity-90" />
            
            <button 
              onClick={clearImage}
              className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-red-500/80 text-white rounded-full transition-colors backdrop-blur-sm"
            >
              <X size={14} />
            </button>
            
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-rose-600/90 text-white text-[10px] font-bold rounded flex items-center gap-1 shadow-lg">
                <CheckCircle2 size={10} />
                <span>ACTIVE</span>
            </div>
          </div>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        className="hidden" 
        onChange={handleFileChange}
      />
    </div>
  );
};

export default VideoSourceWidget;