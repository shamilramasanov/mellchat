import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  FONT_SIZES,
  DISPLAY_DENSITY,
  NICKNAME_COLOR_MODES,
  LIMITS,
} from '@shared/utils/constants';

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      // State
      // Language handled by i18n
      autoTranslate: false,
      fontSize: FONT_SIZES.MEDIUM,
      autoScroll: true,
      autoScrollDelay: 5, // seconds
      displayDensity: DISPLAY_DENSITY.COMFORTABLE,
      notifyNewMessages: false,
      notifyQuestions: true,
      historyRetention: LIMITS.HISTORY_RETENTION_DAYS,
      nicknameColors: NICKNAME_COLOR_MODES.RANDOM,
      
      // Actions
      setAutoTranslate: (value) => set({ autoTranslate: value }),
      
      setFontSize: (size) => {
        if (Object.values(FONT_SIZES).includes(size)) {
          set({ fontSize: size });
        }
      },
      
      setAutoScroll: (value) => set({ autoScroll: value }),
      
      setAutoScrollDelay: (delay) => {
        if (delay >= 3 && delay <= 15) {
          set({ autoScrollDelay: delay });
        }
      },
      
      setDisplayDensity: (density) => {
        if (Object.values(DISPLAY_DENSITY).includes(density)) {
          set({ displayDensity: density });
        }
      },
      
      setNotifyNewMessages: (value) => set({ notifyNewMessages: value }),
      
      setNotifyQuestions: (value) => set({ notifyQuestions: value }),
      
      setHistoryRetention: (days) => {
        if (days >= 1 && days <= 365) {
          set({ historyRetention: days });
        }
      },
      
      setNicknameColors: (mode) => {
        if (Object.values(NICKNAME_COLOR_MODES).includes(mode)) {
          set({ nicknameColors: mode });
        }
      },
      
      // Reset to defaults
      resetToDefaults: () => {
        set({
          autoTranslate: false,
          fontSize: FONT_SIZES.MEDIUM,
          autoScroll: true,
          autoScrollDelay: 5,
          displayDensity: DISPLAY_DENSITY.COMFORTABLE,
          notifyNewMessages: false,
          notifyQuestions: true,
          historyRetention: LIMITS.HISTORY_RETENTION_DAYS,
          nicknameColors: NICKNAME_COLOR_MODES.RANDOM,
        });
      },
    }),
    {
      name: 'settings-storage',
    }
  )
);

