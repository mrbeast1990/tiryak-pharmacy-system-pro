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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AddMedicineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddMedicineDialog: React.FC<AddMedicineDialogProps> = ({ open, onOpenChange }) => {
  const { language, t } = useLanguageStore();
  const { medicines, addMedicine } = usePharmacyStore();
  const { getFilteredSuggestions, getScientificNameSuggestions, deleteSuggestion } = useSuggestionsStore();
  const { toast } = useToast();
  
  const [medicineName, setMedicineName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [priority, setPriority] = useState<'1' | '2' | '3'>('1');
  const [showMedicineSuggestions, setShowMedicineSuggestions] = useState(false);
  const [showScientificSuggestions, setShowScientificSuggestions] = useState(false);

  const medicineSuggestions = getFilteredSuggestions(medicines, medicineName);
  const scientificSuggestions = getScientificNameSuggestions(medicines, scientificName);

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
      scientific_name: scientificName.trim() || null,
      status: 'shortage',
      notes: null,
      repeat_count: parseInt(priority),
    } as any);
    
    const priorityLabels = {
      '1': language === 'ar' ? 'عادي' : 'Normal',
      '2': language === 'ar' ? 'متوسط' : 'Medium', 
      '3': language === 'ar' ? 'عالي' : 'High',
    };
    
    toast({
      title: language === 'ar' ? "تم الإضافة" : "Added",
      description: language === 'ar' ? `تم إضافة ${medicineName} (${priorityLabels[priority]})` : `${medicineName} added (${priorityLabels[priority]})`,
    });

    setMedicineName('');
    setScientificName('');
    setPriority('1');
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

          {/* Scientific Name Field (Optional) */}
          <div className="space-y-2">
            <Label className="text-right block">
              {language === 'ar' ? 'الاسم العلمي (اختياري)' : 'Scientific Name (Optional)'}
            </Label>
            <div className="relative">
              <Input
                value={scientificName}
                onChange={(e) => {
                  setScientificName(e.target.value);
                  setShowScientificSuggestions(e.target.value.length >= 2);
                }}
                onFocus={() => setShowScientificSuggestions(scientificName.length >= 2)}
                onBlur={() => setTimeout(() => setShowScientificSuggestions(false), 200)}
                placeholder={language === 'ar' ? 'أدخل الاسم العلمي' : 'Enter scientific name'}
                className="text-right"
              />
              {showScientificSuggestions && scientificSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {scientificSuggestions.map((suggestion, index) => (
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
                          setScientificName(suggestion);
                          setShowScientificSuggestions(false);
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

          {/* Priority Selection */}
          <div className="space-y-3">
            <Label className="text-right block">
              {language === 'ar' ? 'حالة الأولوية' : 'Priority Level'}
            </Label>
            <RadioGroup
              value={priority}
              onValueChange={(value) => setPriority(value as '1' | '2' | '3')}
              className="flex gap-2"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <div className="flex-1">
                <RadioGroupItem
                  value="1"
                  id="priority-normal"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="priority-normal"
                  className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-sm font-medium">{language === 'ar' ? 'عادي' : 'Normal'}</span>
                  </div>
                </Label>
              </div>
              <div className="flex-1">
                <RadioGroupItem
                  value="2"
                  id="priority-medium"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="priority-medium"
                  className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-warning peer-data-[state=checked]:bg-warning/10 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-warning"></div>
                    <span className="text-sm font-medium">{language === 'ar' ? 'متوسط' : 'Medium'}</span>
                  </div>
                </Label>
              </div>
              <div className="flex-1">
                <RadioGroupItem
                  value="3"
                  id="priority-high"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="priority-high"
                  className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-destructive peer-data-[state=checked]:bg-destructive/10 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-destructive"></div>
                    <span className="text-sm font-medium">{language === 'ar' ? 'عالي' : 'High'}</span>
                  </div>
                </Label>
              </div>
            </RadioGroup>
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
