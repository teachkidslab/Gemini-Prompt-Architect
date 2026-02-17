export type Language = 'en' | 'ua';

export type PromptMode = 'image' | 'video';

export interface CategoryOption {
  id: string;
  label: {
    en: string;
    ua: string;
  };
  value: string;
  description?: {
    en: string;
    ua: string;
  };
}

export interface PromptCategory {
  id: string;
  title: {
    en: string;
    ua: string;
  };
  description: {
    en: string;
    ua: string;
  };
  options: CategoryOption[];
  color: string;
}

export interface PromptState {
  [key: string]: CategoryOption[];
}

export interface GeneratedPrompt {
    text: string;
    json?: string;
}

export interface Preset {
  id: string;
  name: {
    en: string;
    ua: string;
  };
  icon: any; // Lucide icon component
  selections: {
    [categoryId: string]: string[]; // Array of option IDs
  };
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}
