import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { usePharmacyStore, Supply } from '@/store/pharmacyStore';
import { ArrowRight, Plus, Search, AlertCircle, FileText, FileSpreadsheet } from 'lucide-react';
import { useShortagesExcel } from '@/hooks/useShortagesExcel';
import { useToast } from '@/hooks/use-toast';
import { usePDFExport } from '@/hooks/usePDFExport';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import { addArabicFont } from '@/lib/pdf-utils';
import SwipeableSupplyCard from './shortage/SwipeableSupplyCard';
import AddSupplyDialog from './shortage/AddSupplyDialog';

interface SuppliesShortageManagerProps {
  onBack: () => void;
}

const SuppliesShortageManager: React.FC<SuppliesShortageManagerProps> = ({ onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const { checkPermission } = useAuthStore();
  const { language, t } = useLanguageStore();
  const { supplies, updateSupply, deleteSupply, loadSupplies } = usePharmacyStore();
  const { toast } = useToast();
  const { exportPDF } = usePDFExport();
  const { exportSuppliesExcel } = useShortagesExcel();

  useEffect(() => {
    loadSupplies();
  }, [loadSupplies]);

  useEffect(() => {
    const channel = supabase
      .channel('supplies-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'supplies' },
        () => loadSupplies()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadSupplies]);

  const filteredSupplies = useMemo(() => {
    return supplies.filter(supply =>
      supply.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [supplies, searchTerm]);

  const shortages = useMemo(() => {
    const allShortages = filteredSupplies.filter(s => s.status === 'shortage');
    
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
  }, [filteredSupplies, sortBy]);

  const canDeleteSupply = checkPermission('manage_users');

  const handleMarkAvailable = (supply: Supply) => {
    updateSupply(supply.id, { status: 'available' });
    toast({
      title: language === 'ar' ? "تم التحديث" : "Updated",
      description: language === 'ar' 
        ? `تم تحديث حالة ${supply.name} إلى متوفر`
        : `${supply.name} status updated to available`,
    });
  };

  const handleDelete = (supply: Supply) => {
    deleteSupply(supply.id);
    toast({
      title: language === 'ar' ? "تم الحذف" : "Deleted",
      description: language === 'ar' ? `تم حذف ${supply.name} بنجاح` : `${supply.name} deleted successfully`,
    });
  };

  const handleUpdateName = (id: string, name: string) => {
    updateSupply(id, { name });
    toast({
      title: "تم التحديث",
      description: "تم تحديث اسم المستلزم بنجاح",
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
      doc.text('Supplies Shortages List', 105, 30, { align: 'center' });
      
      const currentDate = new Date().toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
      
      doc.setFontSize(12);
      doc.text(`Date: ${currentDate}`, 105, 40, { align: 'center' });
      
      let yPosition = 60;
      
      // Blue header for supplies
      doc.setFillColor(59, 130, 246);
      doc.rect(30, yPosition - 6, 20, 10, 'F');
      doc.rect(50, yPosition - 6, 80, 10, 'F');
      doc.rect(130, yPosition - 6, 40, 10, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text('No.', 40, yPosition, { align: 'center' });
      doc.text('Supply Name', 90, yPosition, { align: 'center' });
      doc.text('Quantity', 150, yPosition, { align: 'center' });
      
      doc.setTextColor(0, 0, 0);
      yPosition += 15;
      
      const uniqueShortages = shortages.reduce((acc, supply) => {
        const existingSupply = acc.find(s => s.name.toLowerCase() === supply.name.toLowerCase());
        if (!existingSupply) {
          acc.push(supply);
        }
        return acc;
      }, [] as typeof shortages);
      
      uniqueShortages.forEach((supply, index) => {
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
        doc.text(supply.name, 55, yPosition - 2, { align: 'left' });
        
        yPosition += 10;
        
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
      });
      
      await exportPDF(doc, `supplies-shortages-list-${new Date().toISOString().split('T')[0]}.pdf`);
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
      <AddSupplyDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative">
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
        <header className="bg-card shadow-sm border-b border-border sticky top-0 z-20 safe-area-top">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              <h1 className="text-base font-bold text-foreground">
                {language === 'ar' ? 'نواقص المستلزمات' : 'Supplies Shortages'}
              </h1>
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

        {/* Sticky Search and Controls */}
        <div className="sticky top-14 z-10 bg-gradient-to-br from-blue-50 to-indigo-100 pt-3 pb-2 px-4">
          <div className="max-w-3xl mx-auto space-y-3">
            {/* Shortages Count */}
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-foreground">
                {language === 'ar' ? 'النواقص' : 'Shortages'} ({shortages.length})
              </span>
            </div>
            
            {/* Search Bar - Full width */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'ar' ? 'البحث عن مستلزم...' : 'Search for supply...'}
                className="pr-10 bg-card h-10 rounded-xl"
              />
            </div>
            
            {/* Sort and Export - Separate row */}
            <div className="flex items-center justify-end gap-2">
              <select 
                className="border border-input rounded-lg px-3 py-1.5 text-xs bg-card"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="">{language === 'ar' ? 'ترتيب حسب' : 'Sort by'}</option>
                <option value="name">{language === 'ar' ? 'الاسم' : 'Name'}</option>
                <option value="date">{language === 'ar' ? 'التاريخ' : 'Date'}</option>
                <option value="repeat">{language === 'ar' ? 'التكرار' : 'Repeat'}</option>
              </select>
              {checkPermission('export_shortages_pdf') && (
                <>
                  <Button onClick={exportShortagesPDF} size="sm" variant="outline" className="text-xs rounded-lg">
                    <FileText className="w-3 h-3 ml-1" />
                    PDF
                  </Button>
                  <Button onClick={() => exportSuppliesExcel(shortages)} size="sm" variant="outline" className="text-xs rounded-lg">
                    <FileSpreadsheet className="w-3 h-3 ml-1" />
                    Excel
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <main className="max-w-3xl mx-auto px-4 pb-24 relative z-10 pt-2">
          {/* Supply List */}
          <div className="space-y-2">
            {shortages.map((supply) => (
              <SwipeableSupplyCard
                key={supply.id}
                supply={supply}
                onMarkAvailable={handleMarkAvailable}
                onDelete={handleDelete}
                onUpdateName={handleUpdateName}
                canEdit={true}
                canDelete={canDeleteSupply}
              />
            ))}
            {shortages.length === 0 && (
              <Card>
                <CardContent className="py-12">
                  <p className="text-center text-muted-foreground text-sm">
                    {language === 'ar' ? 'لا توجد مستلزمات ناقصة' : 'No supplies in shortage'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>

        {/* Floating Action Button - Blue/Purple gradient */}
        <button
          onClick={() => setShowAddDialog(true)}
          className="fixed bottom-6 left-6 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform z-30"
          aria-label={language === 'ar' ? 'إضافة مستلزم' : 'Add supply'}
        >
          <Plus className="w-6 h-6" />
        </button>
        
        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-blue-50 to-transparent py-4 pointer-events-none z-10">
          <div className="text-center text-xs text-muted-foreground">
            <p>Ahmed A Alrjele • Al-tiryak Al-shafi Pharmacy</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SuppliesShortageManager;
