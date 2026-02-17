import React from 'react';
import { PromptCategory, CategoryOption, Language } from '../types';
import { Plus, Info, Trash2, Eye } from 'lucide-react';

export const GuideCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/30 backdrop-blur-sm mb-6 overflow-hidden">
      {/* Header Skeleton */}
      <div className="p-4 flex items-center justify-between border-b border-slate-700/50">
        <div className="flex items-center gap-3 w-full">
          <div className="w-3 h-3 rounded-full bg-slate-700 shimmer"></div>
          <div className="h-6 bg-slate-700 rounded w-1/3 shimmer"></div>
        </div>
        <div className="w-16 h-4 bg-slate-700 rounded hidden sm:block shimmer"></div>
      </div>
      
      {/* Content Skeleton */}
      <div className="p-4">
        <div className="h-4 bg-slate-700/50 rounded w-3/4 mb-6 shimmer"></div>
        
        {/* Tags Grid */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-8 w-20 sm:w-28 bg-slate-700/50 rounded-md border border-slate-600/30 shimmer"></div>
          ))}
        </div>
        
        {/* Input Row */}
        <div className="flex gap-2 mt-4">
            <div className="flex-1 h-10 bg-slate-700/30 rounded-md border border-slate-700 shimmer"></div>
            <div className="w-10 h-10 bg-slate-700/30 rounded-md shimmer"></div>
        </div>
      </div>
    </div>
  );
};

interface GuideCardProps {
  category: PromptCategory;
  language: Language;
  selectedOptions: CategoryOption[];
  onToggleOption: (option: CategoryOption) => void;
  onCustomInput: (value: string) => void;
  onClear: () => void;
  onPreview?: () => void;
}

const GuideCard: React.FC<GuideCardProps> = ({ 
  category, 
  language, 
  selectedOptions, 
  onToggleOption,
  onCustomInput,
  onClear,
  onPreview
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [customVal, setCustomVal] = React.useState('');

  const handleCustomAdd = () => {
    if (customVal.trim()) {
      onCustomInput(customVal);
      setCustomVal('');
    }
  };

  // Merge predefined options with user-created selections (custom tags) so they appear in the list
  const customSelections = selectedOptions.filter(
    (sel) => !category.options.some((opt) => opt.id === sel.id)
  );
  
  const displayOptions = [...category.options, ...customSelections];

  return (
    <div className={`rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur-sm transition-all duration-300 ${isExpanded ? 'mb-6' : 'mb-2'}`}>
      <div 
        className={`p-4 flex items-center justify-between cursor-pointer ${category.color} bg-opacity-10 hover:bg-opacity-20 transition-colors duration-200 rounded-t-xl ${!isExpanded ? 'rounded-b-xl' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${category.color} shadow-sm shadow-${category.color.replace('bg-', '')}/50`}></div>
          <h3 className="font-bold text-lg text-slate-100">{category.title[language]}</h3>
        </div>
        <div className="flex items-center gap-3">
            {selectedOptions.length > 0 && onPreview && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onPreview();
                    }}
                    className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-blue-300 transition-colors"
                    title={language === 'ua' ? 'Попередній перегляд тегів' : 'Preview tag snippet'}
                >
                    <Eye size={18} />
                </button>
            )}
            <div className="text-xs text-slate-400 font-mono hidden sm:block">
               {isExpanded ? (language === 'en' ? 'Collapse' : 'Згорнути') : (language === 'en' ? 'Expand' : 'Розгорнути')}
            </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-slate-700 rounded-b-xl">
          <p className="text-sm text-slate-400 mb-4 flex items-start gap-2">
            <Info size={16} className="mt-0.5 shrink-0" />
            {category.description[language]}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {displayOptions.map((opt) => {
              const isSelected = selectedOptions.some((s) => s.id === opt.id);
              const tooltipText = opt.description?.[language] || opt.value;
              // Check if it's a custom tag (starts with custom_)
              const isCustom = opt.id.startsWith('custom_');

              return (
                <div key={opt.id} className="relative group">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleOption(opt);
                      }}
                      className={`px-3 py-1.5 rounded-md text-sm transition-all duration-200 transform border ${
                        isSelected
                          ? `${category.color} bg-opacity-20 border-${category.color.replace('bg-', '')} text-white hover:scale-105 active:scale-95 shadow-md shadow-${category.color.replace('bg-', '')}/20`
                          : 'border-slate-600 hover:border-slate-400 hover:bg-slate-700/50 text-slate-300 hover:text-white hover:scale-105 active:scale-95'
                      }`}
                    >
                      {opt.label[language]}
                      {isCustom && <span className="ml-1 opacity-50 text-[10px]">•</span>}
                    </button>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 border border-slate-600 text-xs text-slate-200 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-normal w-max max-w-[200px] text-center z-50 shadow-xl">
                        <span className="font-mono text-blue-300 opacity-75 block mb-0.5 text-[10px] uppercase">{language === 'ua' ? 'Ефект' : 'Effect'}:</span>
                        {tooltipText}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-600"></div>
                    </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={customVal}
              onChange={(e) => setCustomVal(e.target.value)}
              placeholder={language === 'en' ? 'Add custom keyword...' : 'Додати свій тег...'}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors duration-200"
              onKeyDown={(e) => e.key === 'Enter' && handleCustomAdd()}
            />
            <button 
              onClick={handleCustomAdd}
              className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-md transition-all duration-200 transform hover:scale-110 active:scale-95"
            >
              <Plus size={18} />
            </button>
            
            {selectedOptions.length > 0 && (
                <button
                    onClick={onClear}
                    className="bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 text-red-400 p-2 rounded-md transition-all duration-200 hover:scale-105 active:scale-95"
                    title={language === 'en' ? 'Clear category' : 'Очистити категорію'}
                >
                    <Trash2 size={18} />
                </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GuideCard;