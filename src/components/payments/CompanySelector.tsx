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
import { usePaymentsStore, Company } from '@/store/paymentsStore';
import { Plus, Building2, User, Phone, CreditCard, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import EditCompanyDialog from './EditCompanyDialog';

interface CompanySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const CompanySelector: React.FC<CompanySelectorProps> = ({ value, onChange }) => {
  const { companies, addCompany } = usePaymentsStore();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCompanyForEdit, setSelectedCompanyForEdit] = useState<Company | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newCompanyData, setNewCompanyData] = useState({
    name: '',
    representative_name: '',
    phone: '',
    account_number: '',
  });

  const resetForm = () => {
    setNewCompanyData({
      name: '',
      representative_name: '',
      phone: '',
      account_number: '',
    });
  };

  const handleAddCompany = async () => {
    if (!newCompanyData.name.trim()) {
      toast.error('يرجى إدخال اسم الشركة');
      return;
    }

    // Check if company already exists
    if (companies.some(c => c.name.toLowerCase() === newCompanyData.name.trim().toLowerCase())) {
      toast.error('هذه الشركة موجودة بالفعل');
      return;
    }

    setIsAdding(true);
    const success = await addCompany({
      name: newCompanyData.name.trim(),
      representative_name: newCompanyData.representative_name.trim() || undefined,
      phone: newCompanyData.phone.trim() || undefined,
      account_number: newCompanyData.account_number.trim() || undefined,
    });
    setIsAdding(false);

    if (success) {
      toast.success('تمت إضافة الشركة بنجاح');
      onChange(newCompanyData.name.trim());
      resetForm();
      setShowAddDialog(false);
    } else {
      toast.error('حدث خطأ أثناء إضافة الشركة');
    }
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompanyForEdit(company);
    setShowEditDialog(true);
  };

  const selectedCompany = companies.find(c => c.name === value);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground flex items-center gap-2">
        <Building2 className="w-4 h-4 text-muted-foreground" />
        اسم الشركة
      </label>
      
      <div className="flex gap-2">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="flex-1 bg-background">
            <SelectValue placeholder="اختر الشركة..." />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            {companies.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                لا توجد شركات. أضف شركة جديدة.
              </div>
            ) : (
              companies.map((company) => (
                <SelectItem key={company.id} value={company.name}>
                  <div className="flex items-center gap-2">
                    <span>{company.name}</span>
                    {company.representative_name && (
                      <span className="text-xs text-muted-foreground">
                        ({company.representative_name})
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {selectedCompany && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => handleEditCompany(selectedCompany)}
            className="flex-shrink-0"
            title="تعديل الشركة"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowAddDialog(true)}
          className="flex-shrink-0"
          title="إضافة شركة جديدة"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* عرض معلومات الشركة المحددة */}
      {selectedCompany && (selectedCompany.representative_name || selectedCompany.phone || selectedCompany.account_number) && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
          {selectedCompany.representative_name && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-3 h-3" />
              <span>المندوب: {selectedCompany.representative_name}</span>
            </div>
          )}
          {selectedCompany.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-3 h-3" />
              <span dir="ltr">{selectedCompany.phone}</span>
            </div>
          )}
          {selectedCompany.account_number && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="w-3 h-3" />
              <span dir="ltr">{selectedCompany.account_number}</span>
            </div>
          )}
        </div>
      )}

      {/* Dialog لإضافة شركة جديدة */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              إضافة شركة جديدة
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* اسم الشركة */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                اسم الشركة <span className="text-destructive">*</span>
              </label>
              <Input
                value={newCompanyData.name}
                onChange={(e) => setNewCompanyData({ ...newCompanyData, name: e.target.value })}
                placeholder="اسم الشركة..."
                className="text-right"
                autoFocus
              />
            </div>

            {/* اسم المندوب */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                اسم المندوب
              </label>
              <Input
                value={newCompanyData.representative_name}
                onChange={(e) => setNewCompanyData({ ...newCompanyData, representative_name: e.target.value })}
                placeholder="اسم مندوب الشركة..."
                className="text-right"
              />
            </div>

            {/* رقم الهاتف */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                رقم الهاتف
              </label>
              <Input
                value={newCompanyData.phone}
                onChange={(e) => setNewCompanyData({ ...newCompanyData, phone: e.target.value })}
                placeholder="رقم هاتف المندوب..."
                className="text-right"
                dir="ltr"
                type="tel"
              />
            </div>

            {/* رقم الحساب */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                رقم الحساب البنكي
              </label>
              <Input
                value={newCompanyData.account_number}
                onChange={(e) => setNewCompanyData({ ...newCompanyData, account_number: e.target.value })}
                placeholder="رقم الحساب البنكي..."
                className="text-right"
                dir="ltr"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleAddCompany}
              disabled={isAdding || !newCompanyData.name.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {isAdding ? 'جاري الإضافة...' : 'إضافة الشركة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog لتعديل الشركة */}
      {selectedCompanyForEdit && (
        <EditCompanyDialog
          company={selectedCompanyForEdit}
          open={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open);
            if (!open) setSelectedCompanyForEdit(null);
          }}
        />
      )}
    </div>
  );
};

export default CompanySelector;
