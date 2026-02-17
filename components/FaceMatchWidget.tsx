import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, ScanFace, CheckCircle2 } from 'lucide-react';
import { Language } from '../types';
import { analyzeImage } from '../services/geminiService';

interface FaceMatchWidgetProps {
  language: Language;
  onTagsGenerated: (tags: string[]) => void;
}

const FaceMatchWidget: React.FC<FaceMatchWidgetProps> = ({ language, onTagsGenerated }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [faceTags, setFaceTags] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImage(base64);
      analyze(base64);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async (base64: string) => {
    setIsAnalyzing(true);
    setFaceTags([]);
    
    try {
      const tags = await analyzeImage(base64, language);
      setFaceTags(tags);
      onTagsGenerated(tags);
    } catch (error) {
      console.error("Analysis error", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setFaceTags([]);
    onTagsGenerated([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-teal-500/30 p-4 mb-4 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
        <ScanFace size={64} className="text-teal-400" />
      </div>

      <h2 className="text-sm font-bold text-teal-300 mb-3 uppercase tracking-wider flex items-center gap-2">
        <ScanFace size={16} />
        {language === 'ua' ? 'Face Match (Фікс Обличчя)' : 'Face Match (Selfie Analysis)'}
      </h2>

      {!image ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-600 hover:border-teal-500 hover:bg-slate-700/50 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all gap-2 text-slate-400 hover:text-teal-200"
        >
          <Camera size={24} />
          <span className="text-xs text-center font-medium">
            {language === 'ua' ? 'Завантажити селфі' : 'Upload Selfie'}
          </span>
          <span className="text-[10px] opacity-60 text-center px-2">
             {language === 'ua' ? 'Для 100% схожості' : 'For max likeness'}
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden border border-slate-600 bg-black aspect-square max-h-48 mx-auto">
            <img src={image} alt="Selfie" className="w-full h-full object-cover opacity-80" />
            
            <button 
              onClick={clearImage}
              className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-red-500/80 text-white rounded-full transition-colors backdrop-blur-sm"
            >
              <X size={14} />
            </button>
            
            {isAnalyzing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                <Loader2 size={32} className="text-teal-400 animate-spin mb-2" />
                <span className="text-xs font-bold text-teal-100 animate-pulse">
                   {language === 'ua' ? 'Аналіз рис...' : 'Scanning DNA...'}
                </span>
              </div>
            )}
          </div>

          {!isAnalyzing && faceTags.length > 0 && (
             <div className="bg-teal-900/20 rounded-lg p-3 border border-teal-500/20">
                <div className="flex items-center gap-2 mb-2 text-teal-300">
                    <CheckCircle2 size={14} />
                    <span className="text-xs font-bold uppercase">
                        {language === 'ua' ? 'Риси виявлено' : 'Features Extracted'}
                    </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {faceTags.slice(0, 5).map((tag, i) => (
                        <span key={i} className="text-[10px] bg-teal-500/10 border border-teal-500/20 text-teal-200 px-1.5 py-0.5 rounded">
                            {tag}
                        </span>
                    ))}
                    {faceTags.length > 5 && (
                        <span className="text-[10px] text-slate-500 px-1">+{faceTags.length - 5}...</span>
                    )}
                </div>
             </div>
          )}
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

export default FaceMatchWidget;