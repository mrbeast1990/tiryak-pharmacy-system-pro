import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SuggestionsState {
  customSuggestions: string[];
  deletedSuggestions: Set<string>;
  addCustomSuggestion: (suggestion: string) => void;
  deleteSuggestion: (suggestion: string) => void;
  getFilteredSuggestions: (medicines: any[], query: string) => string[];
}

export const useSuggestionsStore = create<SuggestionsState>()(
  persist(
    (set, get) => ({
      customSuggestions: [],
      deletedSuggestions: new Set(),

      addCustomSuggestion: (suggestion: string) => {
        const trimmed = suggestion.trim();
        if (!trimmed) return;
        
        set((state) => ({
          customSuggestions: state.customSuggestions.includes(trimmed) 
            ? state.customSuggestions 
            : [...state.customSuggestions, trimmed],
          deletedSuggestions: new Set([...state.deletedSuggestions].filter(s => s !== trimmed))
        }));
      },

      deleteSuggestion: (suggestion: string) => {
        set((state) => ({
          deletedSuggestions: new Set([...state.deletedSuggestions, suggestion]),
          customSuggestions: state.customSuggestions.filter(s => s !== suggestion)
        }));
      },

      getFilteredSuggestions: (medicines: any[], query: string) => {
        if (query.length < 2) return [];
        
        const { customSuggestions, deletedSuggestions } = get();
        const lowerQuery = query.toLowerCase();

        // Get medicine suggestions from database (including previously available items)
        const medicineSuggestions = medicines
          .filter(medicine => 
            medicine.name.toLowerCase().includes(lowerQuery) &&
            !deletedSuggestions.has(medicine.name)
          )
          .map(medicine => medicine.name);

        // Get custom suggestions
        const filteredCustom = customSuggestions
          .filter(suggestion => 
            suggestion.toLowerCase().includes(lowerQuery) &&
            !deletedSuggestions.has(suggestion)
          );

        // Combine and deduplicate
        const allSuggestions = [...new Set([...medicineSuggestions, ...filteredCustom])];
        
        return allSuggestions.slice(0, 8);
      }
    }),
    {
      name: 'medicine-suggestions-store',
      partialize: (state) => ({
        customSuggestions: state.customSuggestions,
        deletedSuggestions: Array.from(state.deletedSuggestions)
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.deletedSuggestions)) {
          state.deletedSuggestions = new Set(state.deletedSuggestions);
        }
      }
    }
  )
);