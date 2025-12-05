import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { usePharmacyStore, Medicine } from '@/store/pharmacyStore';
import { ArrowRight, Plus, Search, AlertCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePDFExport } from '@/hooks/usePDFExport';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import { addArabicFont } from '@/lib/pdf-utils';
import SwipeableMedicineCard from './shortage/SwipeableMedicineCard';
import AddMedicineDialog from './shortage/AddMedicineDialog';

interface ShortageManagerProps {
  onBack: () => void;
}

const ShortageManager: React.FC<ShortageManagerProps> = ({ onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const { checkPermission } = useAuthStore();
  const { language, t } = useLanguageStore();
  const { medicines, updateMedicine, deleteMedicine, loadMedicines } = usePharmacyStore();
  const { toast } = useToast();
  const { exportPDF } = usePDFExport();

  useEffect(() => {
    loadMedicines();
  }, [loadMedicines]);

  useEffect(() => {
    const channel = supabase
      .channel('medicines-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'medicines' },
        () => loadMedicines()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadMedicines]);

  const filteredMedicines = useMemo(() => {
    return medicines.filter(medicine =>
      medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((medicine as any).company || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [medicines, searchTerm]);

  const shortages = useMemo(() => {
    const allShortages = filteredMedicines.filter(m => m.status === 'shortage');
    
    switch (sortBy) {
      case 'name':
        return allShortages.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
      case 'date':
        return allShortages.sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime());
      case 'repeat':
        return allShortages.sort((a, b) => (b.repeat_count || 0) - (a.repeat_count || 0));
      default:
        return allShortages;
    }
  }, [filteredMedicines, sortBy]);

  const canDeleteMedicine = checkPermission('manage_users');

  const handleMarkAvailable = (medicine: Medicine) => {
    updateMedicine(medicine.id, { status: 'available' });
    toast({
      title: language === 'ar' ? "تم التحديث" : "Updated",
      description: language === 'ar' 
        ? `تم تحديث حالة ${medicine.name} إلى متوفر`
        : `${medicine.name} status updated to available`,
    });
  };

  const handleDelete = (medicine: Medicine) => {
    deleteMedicine(medicine.id);
    toast({
      title: language === 'ar' ? "تم الحذف" : "Deleted",
      description: language === 'ar' ? `تم حذف ${medicine.name} بنجاح` : `${medicine.name} deleted successfully`,
    });
  };

  const handleUpdateName = (id: string, name: string) => {
    updateMedicine(id, { name });
    toast({
      title: "تم التحديث",
      description: "تم تحديث اسم الدواء بنجاح",
    });
  };

  const exportShortagesPDF = async () => {
    try {
      const doc = new jsPDF();
      await addArabicFont(doc);
      
      const logoSize = 30;
      doc.addImage('/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png', 'PNG', 15, 10, logoSize, logoSize);
      
      doc.setFontSize(16);
      doc.text('Al-Tiryak Al-Shafi Pharmacy', 105, 20, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text('Medicine Shortages List', 105, 30, { align: 'center' });
      
      const currentDate = new Date().toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
      
      doc.setFontSize(12);
      doc.text(`Date: ${currentDate}`, 105, 40, { align: 'center' });
      
      let yPosition = 60;
      
      doc.setFillColor(65, 105, 225);
      doc.rect(30, yPosition - 6, 20, 10, 'F');
      doc.rect(50, yPosition - 6, 80, 10, 'F');
      doc.rect(130, yPosition - 6, 40, 10, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text('No.', 40, yPosition, { align: 'center' });
      doc.text('Drug Name', 90, yPosition, { align: 'center' });
      doc.text('Quantity', 150, yPosition, { align: 'center' });
      
      doc.setTextColor(0, 0, 0);
      yPosition += 15;
      
      const uniqueShortages = shortages.reduce((acc, medicine) => {
        const existingMedicine = acc.find(m => m.name.toLowerCase() === medicine.name.toLowerCase());
        if (!existingMedicine) {
          acc.push(medicine);
        }
        return acc;
      }, [] as typeof shortages);
      
      uniqueShortages.forEach((medicine, index) => {
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.1);
        doc.line(30, yPosition - 8, 170, yPosition - 8);
        doc.line(30, yPosition + 2, 170, yPosition + 2);
        doc.line(30, yPosition - 8, 30, yPosition + 2);
        doc.line(50, yPosition - 8, 50, yPosition + 2);
        doc.line(130, yPosition - 8, 130, yPosition + 2);
        doc.line(170, yPosition - 8, 170, yPosition + 2);
        
        doc.setFontSize(10);
        doc.text((index + 1).toString(), 40, yPosition - 2, { align: 'center' });
        doc.text(medicine.name, 55, yPosition - 2, { align: 'left' });
        
        yPosition += 10;
        
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
      });
      
      await exportPDF(doc, `shortages-list-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      toast({
        title: language === 'ar' ? "خطأ في التصدير" : "Export Error",
        description: language === 'ar' ? "حدث خطأ أثناء تصدير التقرير" : "Error occurred while exporting report",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <AddMedicineDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 relative">
        {/* Background Logo */}
        <div 
          className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none"
          style={{
            backgroundImage: 'url(/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png)',
            backgroundSize: '600px 600px',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />

        {/* Header */}
        <header className="bg-card shadow-sm border-b sticky top-0 z-20">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center justify-between h-12">
              <h1 className="text-base font-bold text-foreground">{t('shortages.title')}</h1>
              <Button
                onClick={onBack}
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 text-sm"
              >
                <ArrowRight className="w-4 h-4" />
                <span>{t('back')}</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Sticky Search Bar */}
        <div className="sticky top-12 z-10 bg-gradient-to-br from-emerald-50 to-teal-100 py-3 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'ar' ? 'البحث عن دواء أو شركة...' : 'Search for medicine or company...'}
                className="pr-10 bg-card"
              />
            </div>
          </div>
        </div>

        <main className="max-w-3xl mx-auto px-4 pb-24 relative z-10">
          {/* Sort and Export */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-foreground">
                {language === 'ar' ? 'النواقص' : 'Shortages'} ({shortages.length})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select 
                className="border border-input rounded-md px-2 py-1.5 text-xs bg-card"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="">{language === 'ar' ? 'ترتيب حسب' : 'Sort by'}</option>
                <option value="name">{language === 'ar' ? 'الاسم' : 'Name'}</option>
                <option value="date">{language === 'ar' ? 'التاريخ' : 'Date'}</option>
                <option value="repeat">{language === 'ar' ? 'التكرار' : 'Repeat'}</option>
              </select>
              {checkPermission('export_shortages_pdf') && (
                <Button onClick={exportShortagesPDF} size="sm" variant="outline" className="text-xs">
                  <FileText className="w-3 h-3 ml-1" />
                  PDF
                </Button>
              )}
            </div>
          </div>

          {/* Medicine List */}
          <div className="space-y-2">
            {shortages.map((medicine) => (
              <SwipeableMedicineCard
                key={medicine.id}
                medicine={medicine}
                onMarkAvailable={handleMarkAvailable}
                onDelete={handleDelete}
                onUpdateName={handleUpdateName}
                canEdit={true}
                canDelete={canDeleteMedicine}
              />
            ))}
            {shortages.length === 0 && (
              <Card>
                <CardContent className="py-12">
                  <p className="text-center text-muted-foreground text-sm">
                    {language === 'ar' ? 'لا توجد أدوية ناقصة' : 'No medicines in shortage'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>

        {/* Floating Action Button */}
        <button
          onClick={() => setShowAddDialog(true)}
          className="fixed bottom-6 left-6 w-14 h-14 rounded-full pharmacy-gradient shadow-lg flex items-center justify-center text-primary-foreground hover:scale-105 transition-transform z-30"
          aria-label={language === 'ar' ? 'إضافة صنف' : 'Add item'}
        >
          <Plus className="w-6 h-6" />
        </button>
        
        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-50 to-transparent py-4 pointer-events-none z-10">
          <div className="text-center text-xs text-muted-foreground">
            <p>Ahmed A Alrjele • Al-tiryak Al-shafi Pharmacy</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShortageManager;
