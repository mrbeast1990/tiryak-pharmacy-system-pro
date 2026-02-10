import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { usePaymentsStore, Company } from '@/store/paymentsStore';
import { Plus, Building2, User, Phone, CreditCard, Pencil, ChevronsUpDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import EditCompanyDialog from './EditCompanyDialog';

interface CompanySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const CompanySelector: React.FC<CompanySelectorProps> = ({ value, onChange }) => {
  const { companies, addCompany } = usePaymentsStore();
  const [open, setOpen] = useState(false);
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
    setNewCompanyData({ name: '', representative_name: '', phone: '', account_number: '' });
  };

  const handleAddCompany = async () => {
    if (!newCompanyData.name.trim()) {
      toast.error('يرجى إدخال اسم الشركة');
      return;
    }
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
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between bg-background font-normal"
            >
              {value ? value : 'اختر الشركة...'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50" align="start">
            <Command>
              <CommandInput placeholder="ابحث عن شركة..." className="text-right" />
              <CommandList>
                <CommandEmpty>لا توجد شركة بهذا الاسم</CommandEmpty>
                <CommandGroup>
                  {companies.map((company) => (
                    <CommandItem
                      key={company.id}
                      value={`${company.name} ${company.representative_name || ''}`}
                      onSelect={() => {
                        onChange(company.name);
                        setOpen(false);
                      }}
                      className="text-right"
                    >
                      <Check className={cn("mr-2 h-4 w-4", value === company.name ? "opacity-100" : "opacity-0")} />
                      <div className="flex-1 text-right">
                        <span>{company.name}</span>
                        {company.representative_name && (
                          <span className="text-xs text-muted-foreground mr-2">
                            ({company.representative_name})
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

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
      <Dialog open={showAddDialog} onOpenChange={(o) => { setShowAddDialog(o); if (!o) resetForm(); }}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              إضافة شركة جديدة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                اسم الشركة <span className="text-destructive">*</span>
              </label>
              <Input value={newCompanyData.name} onChange={(e) => setNewCompanyData({ ...newCompanyData, name: e.target.value })} placeholder="اسم الشركة..." className="text-right" autoFocus />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                اسم المندوب
              </label>
              <Input value={newCompanyData.representative_name} onChange={(e) => setNewCompanyData({ ...newCompanyData, representative_name: e.target.value })} placeholder="اسم مندوب الشركة..." className="text-right" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                رقم الهاتف
              </label>
              <Input value={newCompanyData.phone} onChange={(e) => setNewCompanyData({ ...newCompanyData, phone: e.target.value })} placeholder="رقم هاتف المندوب..." className="text-right" dir="ltr" type="tel" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                رقم الحساب البنكي
              </label>
              <Input value={newCompanyData.account_number} onChange={(e) => setNewCompanyData({ ...newCompanyData, account_number: e.target.value })} placeholder="رقم الحساب البنكي..." className="text-right" dir="ltr" />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>إلغاء</Button>
            <Button onClick={handleAddCompany} disabled={isAdding || !newCompanyData.name.trim()} className="bg-primary hover:bg-primary/90">
              {isAdding ? 'جاري الإضافة...' : 'إضافة الشركة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedCompanyForEdit && (
        <EditCompanyDialog
          company={selectedCompanyForEdit}
          open={showEditDialog}
          onOpenChange={(o) => { setShowEditDialog(o); if (!o) setSelectedCompanyForEdit(null); }}
        />
      )}
    </div>
  );
};

export default CompanySelector;
