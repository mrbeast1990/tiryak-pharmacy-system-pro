import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import { useLanguageStore } from '@/store/languageStore';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { useSuggestionsStore } from '@/store/suggestionsStore';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AddSupplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddSupplyDialog: React.FC<AddSupplyDialogProps> = ({ open, onOpenChange }) => {
  const { language } = useLanguageStore();
  const { supplies, addSupply } = usePharmacyStore();
  const { getFilteredSuggestions, deleteSuggestion } = useSuggestionsStore();
  const { toast } = useToast();
  
  const [supplyName, setSupplyName] = useState('');
  const [priority, setPriority] = useState<'1' | '2' | '3'>('1');
  const [showSupplySuggestions, setShowSupplySuggestions] = useState(false);

  const supplySuggestions = getFilteredSuggestions(
    supplies.map(s => ({ ...s, name: s.name, status: s.status, id: s.id, last_updated: s.last_updated, created_at: s.created_at })), 
    supplyName
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supplyName.trim()) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "يرجى إدخال اسم المستلزم" : "Please enter supply name",
        variant: "destructive",
      });
      return;
    }

    if (/^\s/.test(supplyName)) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "اسم المستلزم يجب أن يبدأ بحرف أو رقم" : "Supply name must start with a letter or number",
        variant: "destructive",
      });
      return;
    }

    addSupply({
      name: supplyName.trim(),
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
      description: language === 'ar' ? `تم إضافة ${supplyName} (${priorityLabels[priority]})` : `${supplyName} added (${priorityLabels[priority]})`,
    });

    setSupplyName('');
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
          <DialogTitle className="text-right text-blue-600">
            {language === 'ar' ? 'إضافة مستلزم ناقص' : 'Add Shortage Supply'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Supply Name Field */}
          <div className="space-y-2">
            <Label className="text-right block">
              {language === 'ar' ? 'اسم المستلزم' : 'Supply Name'}
            </Label>
            <div className="relative">
              <Input
                value={supplyName}
                onChange={(e) => {
                  setSupplyName(e.target.value);
                  setShowSupplySuggestions(e.target.value.length >= 2);
                }}
                onFocus={() => setShowSupplySuggestions(supplyName.length >= 2)}
                onBlur={() => setTimeout(() => setShowSupplySuggestions(false), 200)}
                placeholder={language === 'ar' ? 'أدخل اسم المستلزم' : 'Enter supply name'}
                className="text-right"
              />
              {showSupplySuggestions && supplySuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {supplySuggestions.map((suggestion, index) => (
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
                          setSupplyName(suggestion);
                          setShowSupplySuggestions(false);
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

          {/* Priority Selection - Blue/Purple theme */}
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
                  id="supply-priority-normal"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="supply-priority-normal"
                  className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-500/10 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium">{language === 'ar' ? 'عادي' : 'Normal'}</span>
                  </div>
                </Label>
              </div>
              <div className="flex-1">
                <RadioGroupItem
                  value="2"
                  id="supply-priority-medium"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="supply-priority-medium"
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
                  id="supply-priority-high"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="supply-priority-high"
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

          <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
            <Plus className="w-4 h-4 ml-2" />
            {language === 'ar' ? 'إضافة' : 'Add'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSupplyDialog;
