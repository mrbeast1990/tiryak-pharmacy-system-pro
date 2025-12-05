import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import { useLanguageStore } from '@/store/languageStore';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { useSuggestionsStore } from '@/store/suggestionsStore';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddMedicineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddMedicineDialog: React.FC<AddMedicineDialogProps> = ({ open, onOpenChange }) => {
  const { language, t } = useLanguageStore();
  const { medicines, addMedicine } = usePharmacyStore();
  const { getFilteredSuggestions, deleteSuggestion } = useSuggestionsStore();
  const { toast } = useToast();
  
  const [medicineName, setMedicineName] = useState('');
  const [company, setCompany] = useState('');
  const [showMedicineSuggestions, setShowMedicineSuggestions] = useState(false);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [companySuggestions, setCompanySuggestions] = useState<string[]>([]);

  // Fetch unique companies from the database
  useEffect(() => {
    const fetchCompanies = async () => {
      if (company.length < 2) {
        setCompanySuggestions([]);
        return;
      }

      const { data, error } = await supabase
        .from('medicines')
        .select('company')
        .not('company', 'is', null)
        .ilike('company', `%${company}%`)
        .limit(10);

      if (!error && data) {
        const uniqueCompanies = [...new Set(data.map(d => d.company).filter(Boolean))] as string[];
        setCompanySuggestions(uniqueCompanies);
      }
    };

    fetchCompanies();
  }, [company]);

  const medicineSuggestions = getFilteredSuggestions(medicines, medicineName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!medicineName.trim()) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "يرجى إدخال اسم الدواء" : "Please enter medicine name",
        variant: "destructive",
      });
      return;
    }

    if (/^\s/.test(medicineName)) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "اسم الدواء يجب أن يبدأ بحرف أو رقم" : "Medicine name must start with a letter or number",
        variant: "destructive",
      });
      return;
    }

    addMedicine({
      name: medicineName.trim(),
      status: 'shortage',
      notes: null,
      company: company.trim() || null,
    } as any);
    
    toast({
      title: language === 'ar' ? "تم الإضافة" : "Added",
      description: language === 'ar' ? `تم إضافة ${medicineName} كدواء ناقص` : `${medicineName} added as shortage`,
    });

    setMedicineName('');
    setCompany('');
    onOpenChange(false);
  };

  const handleDeleteSuggestion = (suggestion: string) => {
    if (window.confirm(`هل أنت متأكد من حذف "${suggestion}" من الاقتراحات؟`)) {
      deleteSuggestion(suggestion);
      toast({
        title: "تم الحذف",
        description: `تم حذف "${suggestion}" من الاقتراحات`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">
            {language === 'ar' ? 'إضافة صنف ناقص' : 'Add Shortage Item'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Medicine Name Field */}
          <div className="space-y-2">
            <Label className="text-right block">
              {language === 'ar' ? 'اسم الدواء' : 'Medicine Name'}
            </Label>
            <div className="relative">
              <Input
                value={medicineName}
                onChange={(e) => {
                  setMedicineName(e.target.value);
                  setShowMedicineSuggestions(e.target.value.length >= 2);
                }}
                onFocus={() => setShowMedicineSuggestions(medicineName.length >= 2)}
                onBlur={() => setTimeout(() => setShowMedicineSuggestions(false), 200)}
                placeholder={language === 'ar' ? 'أدخل اسم الدواء' : 'Enter medicine name'}
                className="text-right"
              />
              {showMedicineSuggestions && medicineSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {medicineSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-accent cursor-pointer text-right text-sm flex items-center justify-between"
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 hover:bg-destructive/10 hover:text-destructive shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSuggestion(suggestion);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <span
                        onClick={() => {
                          setMedicineName(suggestion);
                          setShowMedicineSuggestions(false);
                        }}
                        className="flex-1 text-right"
                      >
                        {suggestion}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Company Field */}
          <div className="space-y-2">
            <Label className="text-right block">
              {language === 'ar' ? 'الشركة' : 'Company'}
            </Label>
            <div className="relative">
              <Input
                value={company}
                onChange={(e) => {
                  setCompany(e.target.value);
                  setShowCompanySuggestions(e.target.value.length >= 2);
                }}
                onFocus={() => setShowCompanySuggestions(company.length >= 2)}
                onBlur={() => setTimeout(() => setShowCompanySuggestions(false), 200)}
                placeholder={language === 'ar' ? 'أدخل اسم الشركة (اختياري)' : 'Enter company name (optional)'}
                className="text-right"
              />
              {showCompanySuggestions && companySuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {companySuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setCompany(suggestion);
                        setShowCompanySuggestions(false);
                      }}
                      className="px-3 py-2 hover:bg-accent cursor-pointer text-right text-sm"
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full pharmacy-gradient">
            <Plus className="w-4 h-4 ml-2" />
            {language === 'ar' ? 'إضافة' : 'Add'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMedicineDialog;
