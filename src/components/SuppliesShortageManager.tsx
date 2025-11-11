import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { usePharmacyStore, Supply } from '@/store/pharmacyStore';
import { useSuggestionsStore } from '@/store/suggestionsStore';
import { ArrowRight, Plus, Search, AlertCircle, Edit, Save, X, Trash2, RotateCcw, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePDFExport } from '@/hooks/usePDFExport';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import { addArabicFont } from '@/lib/pdf-utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SuppliesShortageManagerProps {
  onBack: () => void;
}

const SuppliesShortageManager: React.FC<SuppliesShortageManagerProps> = ({ onBack }) => {
  const [supplyName, setSupplyName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingSupplyId, setEditingSupplyId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingSupplyName, setPendingSupplyName] = useState('');
  
  const { user, checkPermission } = useAuthStore();
  const { language, t } = useLanguageStore();
  const { supplies, addSupply, updateSupply, deleteSupply, loadSupplies } = usePharmacyStore();
  const { getFilteredSuggestions, deleteSuggestion } = useSuggestionsStore();
  const { toast } = useToast();
  const { exportPDF } = usePDFExport();

  useEffect(() => {
    console.log('🔄 تحميل البيانات الأولية للمستلزمات...');
    loadSupplies().then(() => {
      console.log('✅ تم تحميل البيانات بنجاح، عدد المستلزمات:', supplies.length);
    });
  }, [loadSupplies]);

  useEffect(() => {
    const channel = supabase
      .channel('supplies-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'supplies'
        },
        (payload) => {
          console.log('تم تلقي تحديث في قاعدة البيانات:', payload);
          loadSupplies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadSupplies]);

  const suggestions = getFilteredSuggestions(supplies.map(s => ({ ...s, name: s.name, status: s.status, id: s.id, last_updated: s.last_updated, created_at: s.created_at })), supplyName);

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

    setPendingSupplyName(supplyName);
    setShowConfirmDialog(true);
  };

  const confirmAddSupply = () => {
    addSupply({
      name: pendingSupplyName,
      status: 'shortage',
      notes: null
    });
    
    toast({
      title: language === 'ar' ? "تم الإضافة" : "Added",
      description: language === 'ar' ? `تم إضافة ${pendingSupplyName} كمستلزم ناقص` : `${pendingSupplyName} added as shortage`,
    });

    setSupplyName('');
    setPendingSupplyName('');
    setShowSuggestions(false);
    setShowConfirmDialog(false);
  };

  const toggleStatus = (supply: Supply) => {
    const newStatus = supply.status === 'shortage' ? 'available' : 'shortage';
    updateSupply(supply.id, {
      status: newStatus,
    });
    
    toast({
      title: language === 'ar' ? "تم التحديث" : "Updated",
      description: language === 'ar' 
        ? `تم تحديث حالة ${supply.name} إلى ${newStatus === 'available' ? 'متوفر' : 'ناقص'}`
        : `${supply.name} status updated to ${newStatus}`,
    });
  };

  const handleUpdateName = (supplyId: string) => {
    if (!editedName.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم المستلزم",
        variant: "destructive",
      });
      return;
    }

    if (/^\s/.test(editedName)) {
      toast({
        title: "خطأ",
        description: "اسم المستلزم يجب أن يبدأ بحرف أو رقم",
        variant: "destructive",
      });
      return;
    }
    updateSupply(supplyId, { name: editedName });
    setEditingSupplyId(null);
    setEditedName('');
    toast({
      title: "تم التحديث",
      description: "تم تحديث اسم المستلزم بنجاح",
    });
  };

  const startEditing = (supply: Supply) => {
    setEditingSupplyId(supply.id);
    setEditedName(supply.name);
  };

  const cancelEditing = () => {
    setEditingSupplyId(null);
    setEditedName('');
  };

  const canEditSupplyName = true;
  const canDeleteSupply = checkPermission('manage_users');
  
  const handleDeleteSupply = (supply: Supply) => {
    if (window.confirm(language === 'ar' ? `هل أنت متأكد من حذف ${supply.name}؟` : `Are you sure you want to delete ${supply.name}?`)) {
      deleteSupply(supply.id);
      toast({
        title: language === 'ar' ? "تم الحذف" : "Deleted",
        description: language === 'ar' ? `تم حذف ${supply.name} بنجاح` : `${supply.name} deleted successfully`,
      });
    }
  };

  const exportShortagesPDF = async () => {
    try {
      const doc = new jsPDF();
      
      // Add Arabic font support
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
      
      doc.setFillColor(66, 165, 245);
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
        doc.text(supply.name, 55, yPosition - 2, { align: 'left' }); // Arabic text will now render correctly
        
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
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              {language === 'ar' ? 'تأكيد الإضافة' : 'Confirm Addition'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              {language === 'ar' 
                ? `هل أنت متأكد من إضافة "${pendingSupplyName}" إلى قائمة النواقص؟`
                : `Are you sure you want to add "${pendingSupplyName}" to the shortages list?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction onClick={confirmAddSupply}>
              {language === 'ar' ? 'تأكيد' : 'Confirm'}
            </AlertDialogAction>
            <AlertDialogCancel>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="min-h-screen relative" style={{ backgroundColor: '#E3F2FD' }}>
      <div 
        className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'url(/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png)',
          backgroundSize: '600px 600px',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      <header className="bg-white shadow-sm border-b relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-lg font-bold text-gray-900">تسجيل نواقص المستلزمات</h1>
          </div>
          <div className="pb-4">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 space-x-reverse text-sm"
            >
              <ArrowRight className="w-3 h-3" />
              <span>{t('back')}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1">
            <Card className="shadow-md border border-gray-200">
              <CardHeader className="bg-white rounded-t-lg">
                <CardTitle className="text-sm text-gray-800">
                  إضافة مستلزم ناقص
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      اسم المستلزم
                    </label>
                    <Input
                      value={supplyName}
                      onChange={(e) => {
                        setSupplyName(e.target.value);
                        setShowSuggestions(e.target.value.length >= 2);
                      }}
                      onFocus={() => setShowSuggestions(supplyName.length >= 2)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder="أدخل اسم المستلزم"
                      className="text-right border-gray-300 bg-white"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-right text-sm relative group flex items-center justify-between"
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`هل أنت متأكد من حذف "${suggestion}" من الاقتراحات؟`)) {
                                  deleteSuggestion(suggestion);
                                  toast({
                                    title: "تم الحذف",
                                    description: `تم حذف "${suggestion}" من الاقتراحات`,
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            <span
                              onClick={() => {
                                setSupplyName(suggestion);
                                setShowSuggestions(false);
                              }}
                              className="flex-1"
                            >
                              {suggestion}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full text-white rounded-full" 
                    style={{ backgroundColor: '#42A5F5' }}
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة المستلزم
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4" style={{ color: '#546E7A' }} />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث عن مستلزم..."
                className="pl-10 bg-white border-gray-300"
                style={{ color: '#546E7A' }}
              />
            </div>

            <Card className="shadow-md border border-gray-200" style={{ backgroundColor: '#FAFCFE' }}>
              <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2 space-x-reverse text-sm" style={{ color: '#7986CB' }}>
                      <AlertCircle className="w-4 h-4" />
                      <span>المستلزمات الناقصة ({shortages.length})</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <select 
                        className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="">ترتيب حسب</option>
                        <option value="name">الاسم</option>
                        <option value="date">التاريخ</option>
                        <option value="repeat">التكرار</option>
                      </select>
                      {checkPermission('export_shortages_pdf') && (
                        <Button onClick={exportShortagesPDF} size="sm" className="text-white text-xs px-2 py-1" style={{ backgroundColor: '#42A5F5' }}>
                          <FileText className="w-2 h-2 ml-1" />
                          تصدير PDF
                        </Button>
                      )}
                    </div>
                 </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {shortages.map((supply) => (
                    <div key={supply.id} className="p-3 rounded-lg border-2 bg-white shadow-sm" style={{ borderColor: '#B39DDB' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <AlertCircle className="w-4 h-4" style={{ color: '#7986CB' }} />
                          <div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              {editingSupplyId === supply.id ? (
                                <div className="flex items-center space-x-2">
                                  <Input value={editedName} onChange={e => setEditedName(e.target.value)} className="h-8 text-sm" />
                                  <Button size="icon" className="h-8 w-8" onClick={() => handleUpdateName(supply.id)}><Save className="h-4 w-4" /></Button>
                                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEditing}><X className="h-4 w-4" /></Button>
                                </div>
                              ) : (
                                <>
                                  <h3 className="font-medium text-gray-900 text-sm">{supply.name}</h3>
                                  {canEditSupplyName && (
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEditing(supply)}>
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  )}
                                </>
                              )}
                              {supply.repeat_count && supply.repeat_count > 1 && (
                                <Badge variant="outline" className="flex items-center space-x-1 text-xs">
                                  <RotateCcw className="w-2 h-2" />
                                  <span>{supply.repeat_count}x متكرر</span>
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              آخر تحديث: {new Date(supply.last_updated).toLocaleDateString()} 
                              {' بواسطة '} {supply.updatedBy}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleStatus(supply)}
                            className="bg-green-50 hover:bg-green-100 text-xs px-2 py-1"
                          >
                            تم توفيره
                          </Button>
                          {canDeleteSupply && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-red-600 hover:text-red-700" 
                              onClick={() => handleDeleteSupply(supply)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                   {shortages.length === 0 && (
                     <p className="text-center text-gray-500 py-8 text-sm">
                       لا توجد مستلزمات ناقصة
                     </p>
                   )}
                 </div>

               </CardContent>
             </Card>

          </div>
        </div>
      </main>
      
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-sm text-gray-600 relative z-10">
        <p>Ahmed A Alrjele</p>
        <p>Founder & CEO</p>
        <p>Al-tiryak Al-shafi Pharmacy</p>
      </div>
    </div>
    </>
  );
};

export default SuppliesShortageManager;
