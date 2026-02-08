import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

interface SuggestionsState {
  customSuggestions: string[];
  deletedSuggestions: Set<string>;
  pharmacyGuideNames: string[];
  pharmacyGuideScientificNames: string[];
  addCustomSuggestion: (suggestion: string) => void;
  deleteSuggestion: (suggestion: string) => void;
  fetchPharmacyGuide: () => Promise<void>;
  getFilteredSuggestions: (medicines: any[], query: string) => string[];
  getScientificNameSuggestions: (medicines: any[], query: string) => string[];
}

export const useSuggestionsStore = create<SuggestionsState>()(
  persist(
    (set, get) => ({
      customSuggestions: [],
      deletedSuggestions: new Set(),
      pharmacyGuideNames: [],
      pharmacyGuideScientificNames: [],

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

      fetchPharmacyGuide: async () => {
        const { data, error } = await supabase
          .from('pharmacy_guide')
          .select('trade_name, scientific_name');
        
        if (error) {
          console.error('Error fetching pharmacy guide:', error);
          return;
        }
        
        const names = data?.map(item => item.trade_name) || [];
        const scientificNames = data
          ?.filter(item => item.scientific_name)
          .map(item => item.scientific_name!)
          .filter((name, index, self) => self.indexOf(name) === index) || [];
        
        set({ pharmacyGuideNames: names, pharmacyGuideScientificNames: scientificNames });
      },

      getFilteredSuggestions: (medicines: any[], query: string) => {
        if (query.length < 2) return [];
        
        const { customSuggestions, deletedSuggestions, pharmacyGuideNames } = get();
        const lowerQuery = query.toLowerCase();

        // Get medicine suggestions from database (including previously available items)
        const medicineSuggestions = medicines
          .filter(medicine => 
            medicine.name.toLowerCase().includes(lowerQuery) &&
            !deletedSuggestions.has(medicine.name)
          )
          .map(medicine => medicine.name);

        // Get suggestions from pharmacy_guide
        const guideMatches = pharmacyGuideNames
          .filter(name => 
            name.toLowerCase().includes(lowerQuery) &&
            !deletedSuggestions.has(name)
          );

        // Get custom suggestions
        const filteredCustom = customSuggestions
          .filter(suggestion => 
            suggestion.toLowerCase().includes(lowerQuery) &&
            !deletedSuggestions.has(suggestion)
          );

        // Combine and deduplicate
        const allSuggestions = [...new Set([...medicineSuggestions, ...guideMatches, ...filteredCustom])];
        
        return allSuggestions.slice(0, 8);
      },

      getScientificNameSuggestions: (medicines: any[], query: string) => {
        if (query.length < 2) return [];
        
        const { deletedSuggestions, pharmacyGuideScientificNames } = get();
        const lowerQuery = query.toLowerCase();

        // Get unique scientific names from medicines
        const medicineScientificNames = medicines
          .filter(m => 
            m.scientific_name && 
            m.scientific_name.toLowerCase().includes(lowerQuery) &&
            !deletedSuggestions.has(m.scientific_name)
          )
          .map(m => m.scientific_name);

        // Get scientific names from pharmacy_guide
        const guideScientificNames = pharmacyGuideScientificNames
          .filter(name => 
            name.toLowerCase().includes(lowerQuery) &&
            !deletedSuggestions.has(name)
          );

        // Combine and deduplicate
        const allNames = [...new Set([...medicineScientificNames, ...guideScientificNames])];

        return allNames.slice(0, 8);
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