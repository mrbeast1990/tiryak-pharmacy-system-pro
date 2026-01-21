import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { usePaymentsStore } from '@/store/paymentsStore';
import { Plus, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface CompanySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const CompanySelector: React.FC<CompanySelectorProps> = ({ value, onChange }) => {
  const { companies, addCompany } = usePaymentsStore();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) {
      toast.error('يرجى إدخال اسم الشركة');
      return;
    }

    // Check if company already exists
    if (companies.some(c => c.name.toLowerCase() === newCompanyName.trim().toLowerCase())) {
      toast.error('هذه الشركة موجودة بالفعل');
      return;
    }

    setIsAdding(true);
    const success = await addCompany(newCompanyName.trim());
    setIsAdding(false);

    if (success) {
      toast.success('تمت إضافة الشركة بنجاح');
      onChange(newCompanyName.trim());
      setNewCompanyName('');
      setShowAddDialog(false);
    } else {
      toast.error('حدث خطأ أثناء إضافة الشركة');
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground flex items-center gap-2">
        <Building2 className="w-4 h-4 text-muted-foreground" />
        اسم الشركة
      </label>
      
      <div className="flex gap-2">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="اختر الشركة..." />
          </SelectTrigger>
          <SelectContent>
            {companies.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                لا توجد شركات. أضف شركة جديدة.
              </div>
            ) : (
              companies.map((company) => (
                <SelectItem key={company.id} value={company.name}>
                  {company.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowAddDialog(true)}
          className="flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Dialog لإضافة شركة جديدة */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              إضافة شركة جديدة
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              placeholder="اسم الشركة..."
              className="text-right"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCompany();
                }
              }}
            />
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setNewCompanyName('');
              }}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleAddCompany}
              disabled={isAdding || !newCompanyName.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {isAdding ? 'جاري الإضافة...' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanySelector;
