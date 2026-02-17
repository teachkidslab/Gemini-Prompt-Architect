import React from 'react';
import { X, Layers, Palette, Lightbulb, Camera, Sparkles, BookOpen, PenTool } from 'lucide-react';
import { Language } from '../types';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose, language }) => {
  if (!isOpen) return null;

  const title = language === 'ua' ? 'Покроковий Гайд: Як писати промт' : 'Step-by-Step Guide: How to Write a Prompt';
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
        
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-5 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600/20 p-2 rounded-lg text-blue-400">
                <BookOpen size={24} />
             </div>
             <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
               {title}
             </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-8">
          
          {/* Intro Banner */}
          <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl p-6 text-indigo-100">
             <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <PenTool size={18} />
                {language === 'ua' ? 'Золоте правило промтингу' : 'The Golden Rule of Prompting'}
             </h3>
             <p className="opacity-90 leading-relaxed">
               {language === 'ua' 
                 ? 'AI не вміє читати думки, але він чудово розуміє структуру. Уявіть, що ви описуєте сцену сліпому художнику: будьте конкретними, вказуйте стиль, світло та атмосферу.' 
                 : 'AI cannot read minds, but it understands structure perfectly. Imagine describing a scene to a blind artist: be specific about style, lighting, and atmosphere.'}
             </p>
          </div>

          {/* Steps Breakdown */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-200 border-l-4 border-blue-500 pl-3">
                {language === 'ua' ? 'Анатомія ідеального промту' : 'Anatomy of a Perfect Prompt'}
            </h3>

            {/* Step 1 */}
            <div className="flex gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <div className="shrink-0 mt-1 bg-blue-900/30 text-blue-400 p-3 rounded-xl h-fit border border-blue-500/20 font-bold text-xl w-12 h-12 flex items-center justify-center">1</div>
              <div>
                <h4 className="font-bold text-slate-100 text-lg mb-1 flex items-center gap-2">
                    {language === 'ua' ? 'Головний Об\'єкт (Subject)' : 'Main Subject'}
                    <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300 font-normal opacity-70">
                        {language === 'ua' ? 'Що?' : 'What?'}
                    </span>
                </h4>
                <p className="text-slate-400 text-sm mb-2">
                   {language === 'ua' 
                     ? 'Почніть з іменника. Хто або що є центром кадру? Додайте прикметники для деталізації.' 
                     : 'Start with a noun. Who or what is the focus? Add adjectives for detail.'}
                </p>
                <div className="text-xs font-mono bg-black/40 p-2.5 rounded border border-slate-700/50 text-green-400">
                   <span className="text-slate-500 select-none mr-2">✓</span>
                   "A futuristic samurai warrior with cybernetic armor"
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <div className="shrink-0 mt-1 bg-emerald-900/30 text-emerald-400 p-3 rounded-xl h-fit border border-emerald-500/20 font-bold text-xl w-12 h-12 flex items-center justify-center">2</div>
              <div>
                <h4 className="font-bold text-slate-100 text-lg mb-1 flex items-center gap-2">
                    {language === 'ua' ? 'Дія та Середовище (Action & Context)' : 'Action & Context'}
                    <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300 font-normal opacity-70">
                        {language === 'ua' ? 'Де? Що робить?' : 'Where? Doing what?'}
                    </span>
                </h4>
                <p className="text-slate-400 text-sm mb-2">
                   {language === 'ua' 
                     ? 'Помістіть об\'єкт у локацію. Якщо це відео - опишіть рух.' 
                     : 'Place the subject in a location. If creating video, describe the movement.'}
                </p>
                <div className="text-xs font-mono bg-black/40 p-2.5 rounded border border-slate-700/50 text-green-400">
                   <span className="text-slate-500 select-none mr-2">✓</span>
                   "...standing on a neon rooftop in rainy Tokyo, looking at the city"
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <div className="shrink-0 mt-1 bg-purple-900/30 text-purple-400 p-3 rounded-xl h-fit border border-purple-500/20 font-bold text-xl w-12 h-12 flex items-center justify-center">3</div>
              <div>
                <h4 className="font-bold text-slate-100 text-lg mb-1 flex items-center gap-2">
                    {language === 'ua' ? 'Художній Стиль (Art Style)' : 'Art Style'}
                    <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300 font-normal opacity-70">
                        {language === 'ua' ? 'Як виглядає?' : 'Look & Feel?'}
                    </span>
                </h4>
                <p className="text-slate-400 text-sm mb-2">
                   {language === 'ua' 
                     ? 'Це фото, 3D рендер, олійна картина чи аніме? Вкажіть медіум.' 
                     : 'Is it a photo, 3D render, oil painting, or anime? Specify the medium.'}
                </p>
                <div className="text-xs font-mono bg-black/40 p-2.5 rounded border border-slate-700/50 text-green-400">
                   <span className="text-slate-500 select-none mr-2">✓</span>
                   "...in the style of Cyberpunk 2077, photorealistic, 8k render, Unreal Engine 5"
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <div className="shrink-0 mt-1 bg-yellow-900/30 text-yellow-400 p-3 rounded-xl h-fit border border-yellow-500/20 font-bold text-xl w-12 h-12 flex items-center justify-center">4</div>
              <div>
                <h4 className="font-bold text-slate-100 text-lg mb-1 flex items-center gap-2">
                    {language === 'ua' ? 'Освітлення та Камера (Tech Specs)' : 'Lighting & Camera'}
                    <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300 font-normal opacity-70">
                        {language === 'ua' ? 'Атмосфера' : 'Vibe'}
                    </span>
                </h4>
                <p className="text-slate-400 text-sm mb-2">
                   {language === 'ua' 
                     ? 'Світло створює настрій. Кут камери впливає на сприйняття масштабу.' 
                     : 'Lighting creates mood. Camera angle affects scale perception.'}
                </p>
                <div className="text-xs font-mono bg-black/40 p-2.5 rounded border border-slate-700/50 text-green-400">
                   <span className="text-slate-500 select-none mr-2">✓</span>
                   "...cinematic lighting, dramatic shadows, shot on 35mm lens, wide angle, bokeh"
                </div>
              </div>
            </div>

          </div>

          {/* Example Section */}
          <div className="mt-8 pt-6 border-t border-slate-800">
             <h3 className="text-lg font-bold text-slate-300 mb-4 text-center">
                 {language === 'ua' ? 'Результат (The Final Prompt)' : 'The Final Prompt'}
             </h3>
             <div className="bg-black/50 p-5 rounded-xl border border-slate-700/50 font-mono text-sm text-slate-300 leading-relaxed shadow-inner">
                <span className="text-blue-400 font-bold">[Subject]:</span> A futuristic samurai warrior with cybernetic armor, 
                <span className="text-emerald-400 font-bold"> [Action/Env]:</span> standing on a neon rooftop in rainy Tokyo, 
                <span className="text-purple-400 font-bold"> [Style]:</span> photorealistic, 8k render, Unreal Engine 5, 
                <span className="text-yellow-400 font-bold"> [Lighting/Camera]:</span> cinematic lighting, dramatic shadows, shot on 35mm lens.
             </div>
          </div>

          <div className="mt-6 flex justify-center">
             <button 
               onClick={onClose}
               className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-900/20"
             >
               {language === 'ua' ? 'Спробувати зараз' : 'Try it now'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;