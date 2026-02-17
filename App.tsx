import React, { useState, useEffect, useRef } from 'react';
import { CATEGORIES, NEGATIVE_CATEGORY, PRESETS } from './constants';
import { Language, PromptMode, PromptState, CategoryOption, ToastMessage, ToastType } from './types';
import GuideCard, { GuideCardSkeleton } from './components/GuideCard';
import Toast from './components/Toast';
import TutorialModal from './components/TutorialModal';
import ConfirmationModal from './components/ConfirmationModal';
import ApiKeyModal from './components/ApiKeyModal';
import VideoPlayerModal from './components/VideoPlayerModal';
import FaceMatchWidget from './components/FaceMatchWidget';
import StyleReferenceWidget from './components/StyleReferenceWidget';
import VideoSourceWidget from './components/VideoSourceWidget';
import { enhancePrompt, formatPrompt, getSuggestedTags, generateVideo } from './services/geminiService';
import { Copy, RefreshCw, Wand2, Terminal, Image as ImageIcon, Video as VideoIcon, Trash2, Ban, AlignLeft, Dice5, Check, Sparkles, BookOpen, HelpCircle, Lightbulb, Loader2, PlayCircle, ChevronDown, Clock, Maximize, Minimize } from 'lucide-react';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('ua');
  const [mode, setMode] = useState<PromptMode>('image');
  const [selections, setSelections] = useState<PromptState>({});
  const [generatedResult, setGeneratedResult] = useState<string>('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Track if user has manually typed in the box to prevent overwriting with auto-tags
  const [userHasEdited, setUserHasEdited] = useState(false);
  
  // Video Duration State
  const [videoDuration, setVideoDuration] = useState<number>(5);
  const [isDurationManuallySet, setIsDurationManuallySet] = useState(false);
  const [videoStartImage, setVideoStartImage] = useState<string | null>(null);
  
  // Face Match State
  const [faceTags, setFaceTags] = useState<string[]>([]);
  
  // Style Reference State
  const [styleTags, setStyleTags] = useState<string[]>([]);

  // Video Generation State
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  // Simulate initial loading for skeleton effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // --- SMART VIDEO DURATION LOGIC ---
  useEffect(() => {
    // Only adjust if the user hasn't manually touched the slider
    if (isDurationManuallySet) return;

    const videoSettings = selections['video_settings'];
    if (!videoSettings || videoSettings.length === 0) return;

    const ids = videoSettings.map(opt => opt.id);
    let newDuration: number | null = null;
    let reason = '';

    // Priority 1: Long formats
    if (ids.some(id => ['timelapse', 'hyperlapse'].includes(id))) {
        newDuration = 10;
        reason = language === 'ua' ? 'Таймлапс' : 'Timelapse';
    } 
    // Priority 2: Slow Motion (needs time to breathe)
    else if (ids.some(id => ['super_slow_mo', 'slow_mo'].includes(id))) {
        newDuration = 8;
        reason = language === 'ua' ? 'Сповільнення' : 'Slow Motion';
    } 
    // Priority 3: Complex Camera Moves
    else if (ids.some(id => ['circular_tracking', 'orbit', 'drone_reveal'].includes(id))) {
        newDuration = 7;
        reason = language === 'ua' ? 'Складний рух' : 'Complex Move';
    }
    // Priority 4: Fast/Impact shots
    else if (ids.some(id => ['crash_zoom', 'fast_zoom_in', 'fast_zoom_out', 'whip_pan', 'glitch_transition'].includes(id))) {
        newDuration = 3;
        reason = language === 'ua' ? 'Швидка дія' : 'Fast Action';
    }

    if (newDuration && newDuration !== videoDuration) {
        setVideoDuration(newDuration);
        addToast(
            language === 'ua' 
            ? `Тривалість авто-змінено: ${newDuration}с (${reason})` 
            : `Auto-duration set: ${newDuration}s (${reason})`, 
            'info'
        );
    }
  }, [selections, isDurationManuallySet, videoDuration, language]);

  // --- LIVE SYNC LOGIC START ---
  useEffect(() => {
    if (userHasEdited) return;

    const parts: string[] = [];
    
    // Sort keys based on semantic importance (Updated based on user's 12 points)
    const promptOrder = [
        'format',
        'subject', 
        'character_details', // Face/Appearance
        'clothing',          // Clothing/Style
        'emotion',           // Emotion
        'pose_action',       // Pose/Action
        'props', 
        'models_3d', 
        'environment', 
        'framing', 
        'video_settings', 
        'lighting', 
        'visual_rules', 
        'camera', 
        'visual_effects', 
        'text_handling',     // Typography
        'style',
        'style_intensity',
        'mood', 
        'quality'
    ];

    // Add categorized tags
    promptOrder.forEach(id => {
        const cat = CATEGORIES.find(c => c.id === id);
        if (cat && selections[cat.id] && selections[cat.id].length > 0) {
             const vals = selections[cat.id].map((o: CategoryOption) => o.value).join(", ");
             parts.push(`${cat.title.en}: ${vals}`); 
        }
    });

    // Handle any categories not in the specific sort order
    Object.keys(selections).forEach(catId => {
        if (!promptOrder.includes(catId) && catId !== 'negative') {
            const vals = selections[catId].map(o => o.value).join(", ");
            if (vals) parts.push(`${catId}: ${vals}`);
        }
    });

    // Face & Style tags
    if (faceTags.length > 0) parts.push(`Face Details: ${faceTags.join(", ")}`);
    if (styleTags.length > 0) parts.push(`Style Ref: ${styleTags.join(", ")}`);

    if (parts.length > 0) {
        setGeneratedResult(parts.join(" | "));
    } else {
        setGeneratedResult("");
    }
  }, [selections, faceTags, styleTags, userHasEdited]);
  // --- LIVE SYNC LOGIC END ---

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setGeneratedResult(e.target.value);
      setUserHasEdited(true);
  };

  const handleResetToTags = () => {
      setUserHasEdited(false);
      addToast(language === 'ua' ? 'Скинуто до обраних тегів' : 'Reset to selected tags', 'info');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
      const handleFsChange = () => {
          setIsFullscreen(!!document.fullscreenElement);
      };
      document.addEventListener('fullscreenchange', handleFsChange);
      return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleToggleOption = (category: string, option: CategoryOption) => {
    setSelections((prev) => {
      const current = prev[category] || [];
      const exists = current.find((o) => o.id === option.id);
      
      let newOptions;
      if (exists) {
        newOptions = current.filter((o) => o.id !== option.id);
      } else {
        newOptions = [...current, option];
      }

      const newState = { ...prev };
      if (newOptions.length > 0) {
        newState[category] = newOptions;
      } else {
        delete newState[category];
      }
      return newState;
    });
  };

  const handleCustomInput = (category: string, value: string) => {
    const customOption: CategoryOption = {
      id: `custom_${Date.now()}_${Math.random()}`,
      value: value,
      label: { en: value, ua: value }
    };
    handleToggleOption(category, customOption);
  };

  const handleClearCategory = (categoryId: string) => {
    if (!selections[categoryId] || selections[categoryId].length === 0) return;
    
    setSelections((prev) => {
      const newState = { ...prev };
      delete newState[categoryId];
      return newState;
    });
    addToast(language === 'ua' ? 'Категорію очищено' : 'Category cleared', 'info');
  };

  const handleCategoryPreview = (categoryId: string) => {
      const catSelections = selections[categoryId];
      if (!catSelections || catSelections.length === 0) {
          addToast(language === 'ua' ? 'Нічого не вибрано' : 'Nothing selected', 'info');
          return;
      }
      const text = catSelections.map(o => o.value).join(', ');
      addToast(text, 'info');
  };

  const applyPreset = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    const newSelections: PromptState = { ...selections };
    
    Object.keys(preset.selections).forEach(catId => {
        const optionIds = preset.selections[catId];
        const category = CATEGORIES.find(c => c.id === catId);
        if (category) {
            const options = category.options.filter(o => optionIds.includes(o.id));
            newSelections[catId] = options;
        }
    });
    
    setSelections(newSelections);
    addToast(language === 'ua' ? `Застосовано пресет: ${preset.name.ua}` : `Applied preset: ${preset.name.en}`, 'success');
  };

  const isPresetActive = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return false;
    for (const [catId, optionIds] of Object.entries(preset.selections)) {
        const currentOptions = selections[catId];
        if (!currentOptions) return false;
        
        const currentIds = currentOptions.map((o: CategoryOption) => o.id);
        const hasAll = (optionIds as string[]).every(id => currentIds.includes(id));
        if (!hasAll) return false;
    }
    return true;
  };

  const executeClearAll = () => {
    setSelections({});
    setGeneratedResult('');
    setUserHasEdited(false); 
    setFaceTags([]); 
    setStyleTags([]); 
    setIsDurationManuallySet(false); 
    setVideoDuration(5);
    setVideoStartImage(null);
    addToast(language === 'ua' ? 'Все очищено' : 'Cleared all selections', 'info');
    setIsClearConfirmOpen(false);
  };

  const requestClearAll = () => {
    if (Object.keys(selections).length === 0 && !generatedResult && faceTags.length === 0 && styleTags.length === 0 && !videoStartImage) {
        addToast(language === 'ua' ? 'Нічого очищати' : 'Nothing to clear', 'info');
        return;
    }
    setIsClearConfirmOpen(true);
  };

  const handleFaceTagsGenerated = (tags: string[]) => {
      setFaceTags(tags);
      if (tags.length > 0) {
          addToast(language === 'ua' ? 'Риси обличчя успішно додано' : 'Face features added successfully', 'success');
      }
  };

  const handleStyleTagsGenerated = (tags: string[]) => {
      setStyleTags(tags);
      if (tags.length > 0) {
          addToast(language === 'ua' ? 'Стиль успішно визначено' : 'Style successfully extracted', 'success');
      }
  };

  const generatePrompt = async (enhance: boolean = false) => {
    setIsEnhancing(true);
    let result = "";
    
    const faceDescription = faceTags.join(", ");
    const styleDescription = styleTags.join(", ");

    try {
        if (enhance) {
            result = await enhancePrompt(selections, mode, language, faceDescription, styleDescription, videoDuration, generatedResult);
        } else {
            const parts: string[] = [];
            const contextPrefix = mode === 'image' 
                ? (language === 'ua' ? "GENERATE_IMAGE_PROMPT (Detailed, High Quality)" : "GENERATE_IMAGE_PROMPT (Detailed, High Quality)") 
                : (language === 'ua' ? "GENERATE_CINEMATIC_VIDEO_PROMPT (Describe movement, camera, duration)" : "GENERATE_CINEMATIC_VIDEO_PROMPT (Describe movement, camera, duration)");
            parts.push(contextPrefix);

            if (mode === 'video') {
                const durationLabel = language === 'ua' ? "ТРИВАЛІСТЬ" : "DURATION";
                parts.push(`[${durationLabel}]: ${videoDuration}s`);
            }

            if (faceDescription) {
                const label = language === 'ua' ? "ДЕТАЛІ ОБЛИЧЧЯ" : "FACE DETAILS";
                parts.push(`[${label}]: ${faceDescription}`);
            }

            if (styleDescription) {
                const label = language === 'ua' ? "РЕФЕРЕНС СТИЛЮ" : "STYLE REFERENCE";
                parts.push(`[${label}]: ${styleDescription}`);
            }

            // Updated order for AI enhancement context
            const promptOrder = [
                'format', 'subject', 'character_details', 'clothing', 'emotion', 'pose_action', 
                'props', 'models_3d', 'environment', 'framing', 'video_settings', 'lighting', 
                'visual_rules', 'camera', 'visual_effects', 'text_handling', 'style', 'style_intensity', 'mood', 'quality'
            ];

            promptOrder.forEach(id => {
                const cat = CATEGORIES.find(c => c.id === id);
                if (cat && selections[cat.id]) {
                     const vals = selections[cat.id].map((o: CategoryOption) => o.value).join(", ");
                     const label = id === 'video_settings' ? 'VIDEO_SETTINGS' : cat.title.en;
                     parts.push(`[${label}]: ${vals}`); 
                }
            });
            
            if (selections[NEGATIVE_CATEGORY.id]) {
                const negs = selections[NEGATIVE_CATEGORY.id].map(o => o.value).join(", ");
                parts.push(`[Negative]: ${negs}`);
            }

            if (userHasEdited && generatedResult) {
                 parts.push(`[USER NOTES]: ${generatedResult}`);
            }

            result = await formatPrompt(parts.join("\n"), mode, language);
        }
        setGeneratedResult(result);
        setUserHasEdited(true); 
        
        if (enhance) {
            addToast(language === 'ua' ? 'Промт покращено через AI' : 'Prompt enhanced with AI', 'success');
        }
    } catch (err) {
        addToast(language === 'ua' ? 'Помилка генерації' : 'Generation failed', 'error');
    } finally {
        setIsEnhancing(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedResult) return;
    navigator.clipboard.writeText(generatedResult);
    setIsCopied(true);
    addToast(language === 'ua' ? 'Скопійовано в буфер обміну' : 'Copied to clipboard', 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSuggestion = async () => {
    setIsSuggesting(true);
    try {
        const currentTagsStr = Object.values(selections).flat().map((o: CategoryOption) => o.value).join(", ");
        const suggestions = await getSuggestedTags(currentTagsStr, mode, language);
        
        let count = 0;
        Object.entries(suggestions).forEach(([catId, tags]) => {
            tags.forEach(tag => {
                handleCustomInput(catId, tag);
                count++;
            });
        });

        if (count > 0) {
            addToast(language === 'ua' ? `Додано ${count} ідей` : `Added ${count} suggestions`, 'success');
        } else {
             addToast(language === 'ua' ? 'AI не знайшов нових ідей' : 'AI found no new suggestions', 'info');
        }
    } catch (error) {
         addToast(language === 'ua' ? 'Помилка отримання ідей' : 'Failed to get suggestions', 'error');
    } finally {
        setIsSuggesting(false);
    }
  };

  const handleVideoGeneration = async () => {
    if (mode !== 'video') return;
    
    try {
        const aistudio = (window as any).aistudio;
        if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
             const hasKey = await aistudio.hasSelectedApiKey();
             if (!hasKey) {
                 setIsApiKeyModalOpen(true);
                 return;
             }
        }
    } catch (e) {
        console.warn("AIStudio check failed, proceeding or checking key manually", e);
    }

    if (!generatedResult) {
        addToast(language === 'ua' ? 'Спочатку згенеруйте промт' : 'Generate a prompt first', 'error');
        return;
    }

    setIsVideoModalOpen(true);
    setIsGeneratingVideo(true);
    setGeneratedVideoUrl(null);

    try {
        // Pass videoStartImage if available
        const url = await generateVideo(
            generatedResult, 
            selections['image_settings']?.[0]?.value?.includes('9:16') ? '9:16' : '16:9',
            videoStartImage
        );
        setGeneratedVideoUrl(url);
    } catch (error: any) {
        if (error.message?.includes('Requested entity was not found')) {
             setIsVideoModalOpen(false);
             setIsApiKeyModalOpen(true); 
             const aistudio = (window as any).aistudio;
             if (aistudio && typeof aistudio.openSelectKey === 'function') {
             }
        } else {
             addToast(language === 'ua' ? 'Помилка генерації відео' : 'Video generation failed', 'error');
             setIsVideoModalOpen(false);
        }
    } finally {
        setIsGeneratingVideo(false);
    }
  };
  
  const handleApiKeySelect = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio && typeof aistudio.openSelectKey === 'function') {
          await aistudio.openSelectKey();
          setIsApiKeyModalOpen(false);
          addToast(language === 'ua' ? 'Ключ обрано. Спробуйте ще раз.' : 'Key selected. Try again.', 'success');
      }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-purple-500/30 pb-64 md:pb-40">
      {/* Background gradients */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none z-0"></div>
      
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2 pointer-events-none">
        <div className="pointer-events-auto flex flex-col gap-2">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onClose={removeToast} />
            ))}
        </div>
      </div>

      {/* Modals */}
      <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} language={language} />
      <ConfirmationModal 
        isOpen={isClearConfirmOpen} 
        onClose={() => setIsClearConfirmOpen(false)} 
        onConfirm={executeClearAll}
        title={language === 'ua' ? 'Очистити все?' : 'Clear Everything?'}
        message={language === 'ua' ? 'Ви впевнені, що хочете видалити всі вибрані теги та згенерований текст? Це не можна скасувати.' : 'Are you sure you want to remove all selected tags and generated text? This cannot be undone.'}
        confirmText={language === 'ua' ? 'Так, очистити' : 'Yes, Clear'}
        cancelText={language === 'ua' ? 'Скасувати' : 'Cancel'}
      />
      <ApiKeyModal 
          isOpen={isApiKeyModalOpen} 
          onClose={() => setIsApiKeyModalOpen(false)} 
          onSelectKey={handleApiKeySelect} 
          language={language} 
      />
      <VideoPlayerModal 
          isOpen={isVideoModalOpen} 
          onClose={() => setIsVideoModalOpen(false)} 
          videoUrl={generatedVideoUrl} 
          isLoading={isGeneratingVideo} 
          language={language} 
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-purple-600 p-2 rounded-lg shadow-lg shadow-blue-900/20">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Gemini Prompt Architect
              </h1>
              <p className="text-xs text-slate-500 font-mono">POWERED BY GOOGLE GENAI</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800 backdrop-blur-sm">
             {/* Fullscreen Toggle */}
             <button
               onClick={toggleFullscreen}
               className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-lg"
               title={language === 'ua' ? (isFullscreen ? 'Вийти з повного екрану' : 'На весь екран') : (isFullscreen ? 'Exit Fullscreen' : 'Fullscreen')}
             >
                 {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
             </button>

             <div className="w-px h-6 bg-slate-700 mx-1"></div>

             {/* Language Toggle */}
             <button 
               onClick={() => setLanguage(l => l === 'en' ? 'ua' : 'en')}
               className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-slate-800 text-slate-400 hover:text-white"
             >
               {language === 'en' ? 'UA 🇺🇦' : 'EN 🇺🇸'}
             </button>
             
             <div className="w-px h-6 bg-slate-700 mx-1"></div>

             {/* Mode Toggle */}
             <div className="flex bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setMode('image')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'image' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  <ImageIcon size={16} />
                  <span>Image</span>
                </button>
                <button
                  onClick={() => setMode('video')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'video' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  <VideoIcon size={16} />
                  <span>Video</span>
                </button>
             </div>
             
             <button 
               onClick={() => setIsTutorialOpen(true)}
               className="p-2 text-slate-400 hover:text-yellow-400 transition-colors"
               title={language === 'ua' ? 'Довідка' : 'Help'}
             >
               <HelpCircle size={20} />
             </button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* ... existing main content ... */}
           
           {/* Left Sidebar - Controls (expanded to 4 cols) */}
           <div className="lg:col-span-4 space-y-6">
              
              {/* Presets Grid */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <BookOpen size={14} />
                      {language === 'ua' ? 'Швидкі Пресети' : 'Quick Presets'}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                      {PRESETS.map(preset => (
                          <button
                              key={preset.id}
                              onClick={() => applyPreset(preset.id)}
                              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all text-center gap-2 relative group overflow-hidden ${
                                  isPresetActive(preset.id)
                                      ? 'bg-blue-600/20 border-blue-500/50 text-blue-200 shadow-md shadow-blue-900/20'
                                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                              }`}
                          >
                              {/* Background shimmer for active state */}
                              {isPresetActive(preset.id) && (
                                  <div className="absolute inset-0 bg-blue-500/10 animate-pulse pointer-events-none"></div>
                              )}
                              
                              <preset.icon size={20} className={isPresetActive(preset.id) ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'} />
                              <span className="text-[10px] font-bold leading-tight line-clamp-2 w-full">{preset.name[language]}</span>
                              
                              {isPresetActive(preset.id) && (
                                  <div className="absolute top-1 right-1 text-blue-400">
                                      <Check size={10} strokeWidth={4} />
                                  </div>
                              )}
                          </button>
                      ))}
                  </div>
              </div>

              {/* Smart Widgets */}
              <FaceMatchWidget language={language} onTagsGenerated={handleFaceTagsGenerated} />
              <StyleReferenceWidget language={language} onTagsGenerated={handleStyleTagsGenerated} />

              {/* Video Specific Controls */}
              {mode === 'video' && (
                  <div className="space-y-4">
                      {/* NEW: Start Image Widget */}
                      <VideoSourceWidget language={language} onImageSelected={setVideoStartImage} />

                      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3 text-indigo-300 font-bold text-sm">
                              <Clock size={16} />
                              {language === 'ua' ? 'ТРИВАЛІСТЬ ВІДЕО' : 'VIDEO DURATION'}
                          </div>
                          <input 
                            type="range" 
                            min="2" 
                            max="10" 
                            step="1"
                            value={videoDuration}
                            onChange={(e) => {
                                setVideoDuration(parseInt(e.target.value));
                                setIsDurationManuallySet(true);
                            }}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                          <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
                              <span>2s</span>
                              <span className="text-white font-bold">{videoDuration}s</span>
                              <span>10s</span>
                          </div>
                      </div>
                  </div>
              )}

           </div>

           {/* Center - Categories (expanded to 8 cols) */}
           <div className="lg:col-span-8 space-y-4">
              {isLoading ? (
                  <>
                    <GuideCardSkeleton />
                    <GuideCardSkeleton />
                    <GuideCardSkeleton />
                  </>
              ) : (
                  <>
                    {CATEGORIES.map(cat => {
                        // Filter video settings if in image mode
                        if (mode === 'image' && cat.id === 'video_settings') return null;
                        return (
                            <GuideCard 
                                key={cat.id} 
                                category={cat} 
                                language={language}
                                selectedOptions={selections[cat.id] || []}
                                onToggleOption={(opt) => handleToggleOption(cat.id, opt)}
                                onCustomInput={(val) => handleCustomInput(cat.id, val)}
                                onClear={() => handleClearCategory(cat.id)}
                                onPreview={() => handleCategoryPreview(cat.id)}
                            />
                        );
                    })}
                    
                    {/* Negative Category always at bottom */}
                    <GuideCard 
                         category={NEGATIVE_CATEGORY}
                         language={language}
                         selectedOptions={selections[NEGATIVE_CATEGORY.id] || []}
                         onToggleOption={(opt) => handleToggleOption(NEGATIVE_CATEGORY.id, opt)}
                         onCustomInput={(val) => handleCustomInput(NEGATIVE_CATEGORY.id, val)}
                         onClear={() => handleClearCategory(NEGATIVE_CATEGORY.id)}
                         onPreview={() => handleCategoryPreview(NEGATIVE_CATEGORY.id)}
                    />
                  </>
              )}
           </div>

        </main>
      </div>

      {/* FIXED BOTTOM BAR - YOUR PROMPT */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-700 z-40 transition-all duration-300 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
       <div className="max-w-7xl mx-auto p-4">
          
          <div className="flex flex-col lg:flex-row gap-4 items-stretch">
             
             {/* Prompt Input Area */}
             <div className="flex-1 flex flex-col relative group">
                <div className="flex justify-between items-center mb-2 px-1">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <AlignLeft size={14} />
                        {language === 'ua' ? 'Ваш Промт' : 'Your Prompt'}
                        {userHasEdited && generatedResult && (
                             <span className="text-[10px] bg-blue-900/40 text-blue-300 px-1.5 py-0.5 rounded ml-2">
                                 {language === 'ua' ? 'Режим редагування' : 'Editing Mode'}
                             </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={requestClearAll} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded bg-red-900/20 hover:bg-red-900/30 border border-red-500/20">
                            <Trash2 size={12} />
                            {language === 'ua' ? 'Очистити' : 'Clear'}
                        </button>
                        <button onClick={handleSuggestion} disabled={isSuggesting} className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 transition-colors px-2 py-1 rounded bg-yellow-900/20 hover:bg-yellow-900/30 border border-yellow-500/20">
                            {isSuggesting ? <Loader2 size={12} className="animate-spin"/> : <Lightbulb size={12} />}
                            {language === 'ua' ? 'Ідеї' : 'Ideas'}
                        </button>
                    </div>
                </div>
                
                <div className="relative flex-1">
                    <textarea 
                        value={generatedResult}
                        onChange={handleTextChange}
                        placeholder={language === 'ua' ? 'Пишіть тут свій промт або оберіть теги вище...' : 'Type your prompt here or select tags above...'}
                        className="w-full h-24 lg:h-full min-h-[80px] bg-slate-950 border border-slate-700 rounded-xl p-4 pr-12 text-sm leading-relaxed text-slate-200 resize-none focus:outline-none focus:border-blue-500/50 transition-all font-mono shadow-inner placeholder:text-slate-600"
                    />
                    <div className="absolute top-2 right-2 flex flex-col gap-2">
                       <button 
                          onClick={copyToClipboard} 
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all shadow-lg border border-slate-700"
                          title={language === 'ua' ? 'Копіювати' : 'Copy'}
                        >
                          {isCopied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                       </button>
                       <button
                          onClick={handleResetToTags}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all shadow-lg border border-slate-700"
                          title={language === 'ua' ? 'Скинути до тегів' : 'Reset to Tags'}
                       >
                          <RefreshCw size={16} />
                       </button>
                    </div>
                </div>
             </div>

             {/* Action Buttons Area */}
             <div className="lg:w-72 flex flex-col gap-3 justify-end shrink-0">
                 <button 
                    onClick={() => generatePrompt(true)}
                    disabled={isEnhancing}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 relative overflow-hidden group"
                 >
                    {isEnhancing ? <Loader2 size={20} className="animate-spin" /> : <Wand2 size={20} />}
                    <span>{language === 'ua' ? 'Покращити через AI' : 'Enhance with AI'}</span>
                    {!isEnhancing && <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>}
                 </button>

                 {mode === 'video' ? (
                     <button
                        onClick={handleVideoGeneration}
                        disabled={isGeneratingVideo || !generatedResult}
                        className={`w-full py-3 px-4 font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${
                            !generatedResult 
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-900/20'
                        }`}
                     >
                        {isGeneratingVideo ? <Loader2 size={20} className="animate-spin" /> : <PlayCircle size={20} />}
                        <span>{language === 'ua' ? 'Згенерувати (Veo)' : 'Generate (Veo)'}</span>
                     </button>
                 ) : (
                     <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 flex items-center justify-center gap-2 text-xs text-slate-400 text-center select-none">
                         <ImageIcon size={14} />
                         <span>
                             {language === 'ua' ? 'Скопіюйте для Midjourney/DALL-E' : 'Copy for MJ/DALL-E'}
                         </span>
                     </div>
                 )}
             </div>

          </div>
       </div>
    </div>

    </div>
  );
};

export default App;