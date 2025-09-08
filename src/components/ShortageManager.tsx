import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { usePharmacyStore, Medicine } from '@/store/pharmacyStore';
import { useSuggestionsStore } from '@/store/suggestionsStore';
import { ArrowRight, Plus, Search, AlertCircle, CheckCircle, FileText, RotateCcw, Pill, Edit, Save, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePDFExport } from '@/hooks/usePDFExport';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';

interface ShortageManagerProps {
  onBack: () => void;
}

const ShortageManager: React.FC<ShortageManagerProps> = ({ onBack }) => {
  const [medicineName, setMedicineName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingMedicineId, setEditingMedicineId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [currentShortagesPage, setCurrentShortagesPage] = useState(1);
  const [currentAvailablePage, setCurrentAvailablePage] = useState(1);
  const [sortBy, setSortBy] = useState('');
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const itemsPerPage = 50;
  const availableItemsPerPage = 10;
  
  const { user, checkPermission } = useAuthStore();
  const { language, t } = useLanguageStore();
  const { medicines, addMedicine, updateMedicine, deleteMedicine, loadMedicines } = usePharmacyStore();
  const { getFilteredSuggestions, deleteSuggestion, addCustomSuggestion } = useSuggestionsStore();
  const { toast } = useToast();
  const { exportPDF } = usePDFExport();

  // تحميل البيانات عند بداية فتح الصفحة
  useEffect(() => {
    console.log('🔄 تحميل البيانات الأولية للأدوية...');
    loadMedicines().then(() => {
      console.log('✅ تم تحميل البيانات بنجاح، عدد الأدوية:', medicines.length);
    });
  }, [loadMedicines]);

  // إضافة الاستماع للتحديثات المباشرة
  useEffect(() => {
    const channel = supabase
      .channel('medicines-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medicines'
        },
        (payload) => {
          console.log('تم تلقي تحديث في قاعدة البيانات:', payload);
          // إعادة تحميل البيانات عند حدوث أي تغيير
          loadMedicines();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadMedicines]);

  const suggestions = getFilteredSuggestions(medicines, medicineName);

  const filteredMedicines = useMemo(() => {
    return medicines.filter(medicine =>
      medicine.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [medicines, searchTerm]);

  // First filter by status, then sort ALL items, then paginate
  const sortedShortages = useMemo(() => {
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
  
  const allAvailable = filteredMedicines.filter(m => m.status === 'available');
  
  // Reset to first page when sorting changes
  useEffect(() => {
    setCurrentShortagesPage(1);
  }, [sortBy]);
  
  // Pagination logic - now based on sorted results
  const totalShortagesPages = Math.ceil(sortedShortages.length / itemsPerPage);
  const totalAvailablePages = Math.ceil(allAvailable.length / availableItemsPerPage);
  
  const shortages = sortedShortages.slice(
    (currentShortagesPage - 1) * itemsPerPage,
    currentShortagesPage * itemsPerPage
  );
  
  const available = allAvailable.slice(
    (currentAvailablePage - 1) * availableItemsPerPage,
    currentAvailablePage * availableItemsPerPage
  );

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

    // التحقق من أن الاسم لا يبدأ بمسافة
    if (/^\s/.test(medicineName)) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "اسم الدواء يجب أن يبدأ بحرف أو رقم" : "Medicine name must start with a letter or number",
        variant: "destructive",
      });
      return;
    }

    addMedicine({
      name: medicineName,
      status: 'shortage',
      notes: null
    });
    
    toast({
      title: language === 'ar' ? "تم الإضافة" : "Added",
      description: language === 'ar' ? `تم إضافة ${medicineName} كدواء ناقص` : `${medicineName} added as shortage`,
    });

    setMedicineName('');
    setShowSuggestions(false);
  };

  const toggleStatus = (medicine: Medicine) => {
    const newStatus = medicine.status === 'shortage' ? 'available' : 'shortage';
    updateMedicine(medicine.id, {
      status: newStatus,
    });
    
    toast({
      title: language === 'ar' ? "تم التحديث" : "Updated",
      description: language === 'ar' 
        ? `تم تحديث حالة ${medicine.name} إلى ${newStatus === 'available' ? 'متوفر' : 'ناقص'}`
        : `${medicine.name} status updated to ${newStatus}`,
    });
  };

  const handleUpdateName = (medicineId: string) => {
    if (!editedName.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم الدواء",
        variant: "destructive",
      });
      return;
    }

    // التحقق من أن الاسم لا يبدأ بمسافة
    if (/^\s/.test(editedName)) {
      toast({
        title: "خطأ",
        description: "اسم الدواء يجب أن يبدأ بحرف أو رقم",
        variant: "destructive",
      });
      return;
    }
    updateMedicine(medicineId, { name: editedName });
    setEditingMedicineId(null);
    setEditedName('');
    toast({
      title: "تم التحديث",
      description: "تم تحديث اسم الدواء بنجاح",
    });
  };

  const startEditing = (medicine: Medicine) => {
    setEditingMedicineId(medicine.id);
    setEditedName(medicine.name);
  };

  const cancelEditing = () => {
    setEditingMedicineId(null);
    setEditedName('');
  };

  const canEditMedicineName = checkPermission('manage_users');
  
  const handleDeleteMedicine = (medicine: Medicine) => {
    if (window.confirm(language === 'ar' ? `هل أنت متأكد من حذف ${medicine.name}؟` : `Are you sure you want to delete ${medicine.name}?`)) {
      deleteMedicine(medicine.id);
      toast({
        title: language === 'ar' ? "تم الحذف" : "Deleted",
        description: language === 'ar' ? `تم حذف ${medicine.name} بنجاح` : `${medicine.name} deleted successfully`,
      });
    }
  };

  const exportShortagesPDF = async () => {
    try {
      const doc = new jsPDF();
      
      // Add logo - much larger size
      const logoSize = 30;
      doc.addImage('/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png', 'PNG', 15, 10, logoSize, logoSize);
      
      // Header - larger font
      doc.setFontSize(16);
      doc.text('Al-Tiryak Al-Shafi Pharmacy', 105, 20, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text('Medicine Shortages List', 105, 30, { align: 'center' });
      
      // Current Date
      const currentDate = new Date().toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
      
      doc.setFontSize(12);
      doc.text(`Date: ${currentDate}`, 105, 40, { align: 'center' });
      
      // Table headers - smaller table, bigger fonts
      let yPosition = 60;
      
      // Draw header background - smaller table
      doc.setFillColor(65, 105, 225);
      doc.rect(30, yPosition - 6, 20, 10, 'F');
      doc.rect(50, yPosition - 6, 80, 10, 'F');
      doc.rect(130, yPosition - 6, 40, 10, 'F');
      
      // Table headers text - bigger font
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text('No.', 40, yPosition, { align: 'center' });
      doc.text('Drug Name', 90, yPosition, { align: 'center' });
      doc.text('Quantity', 150, yPosition, { align: 'center' });
      
      // Table content
      doc.setTextColor(0, 0, 0);
      yPosition += 15;
      
      // Use sorted shortages for export to maintain consistent order
      const uniqueShortages = sortedShortages.reduce((acc, medicine) => {
        const existingMedicine = acc.find(m => m.name.toLowerCase() === medicine.name.toLowerCase());
        if (!existingMedicine) {
          acc.push(medicine);
        }
        return acc;
      }, [] as typeof sortedShortages);
      
      // Draw table data - smaller rows
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
        
        yPosition += 10; // Smaller row height
        
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
      <header className="bg-white shadow-sm border-b relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-lg font-bold text-gray-900">{t('shortages.title')}</h1>
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
          
          {/* Add Medicine Form */}
          <div className="lg:col-span-1">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-sm">
                  {t('shortages.addShortage')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      {t('shortages.medicineName')}
                    </label>
                    <Input
                      value={medicineName}
                      onChange={(e) => {
                        setMedicineName(e.target.value);
                        setShowSuggestions(e.target.value.length >= 2);
                      }}
                      onFocus={() => setShowSuggestions(medicineName.length >= 2)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder={language === 'ar' ? 'أدخل اسم الدواء' : 'Enter medicine name'}
                      className="text-right"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-right text-sm relative group"
                            onClick={() => {
                              setMedicineName(suggestion);
                              setShowSuggestions(false);
                            }}
                            onMouseDown={(e) => {
                              if (e.button === 0) { // Left click only
                                const timer = setTimeout(() => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (window.confirm(`هل أنت متأكد من حذف "${suggestion}" من الاقتراحات؟`)) {
                                    deleteSuggestion(suggestion);
                                    toast({
                                      title: "تم الحذف",
                                      description: `تم حذف "${suggestion}" من الاقتراحات`,
                                      variant: "destructive",
                                    });
                                  }
                                }, 800); // 800ms for long press
                                setLongPressTimer(timer);
                              }
                            }}
                            onMouseUp={() => {
                              if (longPressTimer) {
                                clearTimeout(longPressTimer);
                                setLongPressTimer(null);
                              }
                            }}
                            onMouseLeave={() => {
                              if (longPressTimer) {
                                clearTimeout(longPressTimer);
                                setLongPressTimer(null);
                              }
                            }}
                            onTouchStart={(e) => {
                              const timer = setTimeout(() => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (window.confirm(`هل أنت متأكد من حذف "${suggestion}" من الاقتراحات؟`)) {
                                  deleteSuggestion(suggestion);
                                  toast({
                                    title: "تم الحذف",
                                    description: `تم حذف "${suggestion}" من الاقتراحات`,
                                    variant: "destructive",
                                  });
                                }
                              }, 800);
                              setLongPressTimer(timer);
                            }}
                            onTouchEnd={() => {
                              if (longPressTimer) {
                                clearTimeout(longPressTimer);
                                setLongPressTimer(null);
                              }
                            }}
                          >
                            <span>{suggestion}</span>
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              اضغط مطولاً للحذف
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Button type="submit" className="w-full pharmacy-gradient">
                    <Plus className="w-4 h-4 ml-2" />
                    {t('shortages.addMedicine')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Medicine Lists */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'ar' ? 'البحث عن دواء...' : 'Search for medicine...'}
                className="pl-10"
              />
            </div>

            {/* Shortages List */}
            <Card className="card-shadow">
              <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2 space-x-reverse text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{t('dashboard.shortages')} ({sortedShortages.length})</span>
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
                        <Button onClick={exportShortagesPDF} size="sm" className="pharmacy-gradient text-xs px-2 py-1">
                          <FileText className="w-2 h-2 ml-1" />
                          {t('shortages.exportPdf')}
                        </Button>
                      )}
                    </div>
                 </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {shortages.map((medicine) => (
                    <div key={medicine.id} className="p-3 rounded-lg border-2 border-red-200 bg-red-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              {editingMedicineId === medicine.id ? (
                                <div className="flex items-center space-x-2">
                                  <Input value={editedName} onChange={e => setEditedName(e.target.value)} className="h-8 text-sm" />
                                  <Button size="icon" className="h-8 w-8" onClick={() => handleUpdateName(medicine.id)}><Save className="h-4 w-4" /></Button>
                                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEditing}><X className="h-4 w-4" /></Button>
                                </div>
                              ) : (
                                <>
                                  <h3 className="font-medium text-gray-900 text-sm">{medicine.name}</h3>
                                  {canEditMedicineName && (
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEditing(medicine)}>
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  )}
                                </>
                              )}
                              {medicine.repeat_count && medicine.repeat_count > 1 && (
                                <Badge variant="outline" className="flex items-center space-x-1 text-xs">
                                  <RotateCcw className="w-2 h-2" />
                                  <span>{medicine.repeat_count}x {t('shortages.repeated')}</span>
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {language === 'ar' ? 'آخر تحديث:' : 'Last updated:'} {new Date(medicine.last_updated).toLocaleDateString()} 
                              {language === 'ar' ? ' بواسطة ' : ' by '} {medicine.updatedBy}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleStatus(medicine)}
                            className="bg-green-50 hover:bg-green-100 text-xs px-2 py-1"
                          >
                            {t('shortages.provided')}
                          </Button>
                          {canEditMedicineName && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-red-600 hover:text-red-700" 
                              onClick={() => handleDeleteMedicine(medicine)}
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
                       {language === 'ar' ? 'لا توجد أدوية ناقصة' : 'No medicines in shortage'}
                     </p>
                   )}
                 </div>

                 {/* Pagination for Shortages */}
                 {totalShortagesPages > 1 && (
                   <div className="flex items-center justify-between mt-4 px-4 pb-4">
                     <div className="text-sm text-gray-500">
                       {language === 'ar' 
                         ? `صفحة ${currentShortagesPage} من ${totalShortagesPages}` 
                         : `Page ${currentShortagesPage} of ${totalShortagesPages}`
                       }
                     </div>
                     <div className="flex items-center space-x-2">
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => setCurrentShortagesPage(prev => Math.max(1, prev - 1))}
                         disabled={currentShortagesPage === 1}
                       >
                         <ChevronRight className="w-4 h-4" />
                       </Button>
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => setCurrentShortagesPage(prev => Math.min(totalShortagesPages, prev + 1))}
                         disabled={currentShortagesPage === totalShortagesPages}
                       >
                         <ChevronLeft className="w-4 h-4" />
                       </Button>
                     </div>
                   </div>
                 )}
               </CardContent>
             </Card>

            {/* Available List */}
            <Card className="card-shadow">
               <CardHeader className="py-3">
                 <CardTitle className="flex items-center space-x-2 space-x-reverse text-green-600 text-sm">
                   <CheckCircle className="w-4 h-4" />
                   <span>{t('dashboard.available')} ({allAvailable.length})</span>
                 </CardTitle>
               </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {available.map((medicine) => (
                    <div key={medicine.id} className="p-3 rounded-lg border-2 border-green-200 bg-green-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              {editingMedicineId === medicine.id ? (
                                <div className="flex items-center space-x-2">
                                  <Input value={editedName} onChange={e => setEditedName(e.target.value)} className="h-8 text-sm" />
                                  <Button size="icon" className="h-8 w-8" onClick={() => handleUpdateName(medicine.id)}><Save className="h-4 w-4" /></Button>
                                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEditing}><X className="h-4 w-4" /></Button>
                                </div>
                              ) : (
                                 <>
                                   <h3 className="font-medium text-gray-900 text-sm">{medicine.name}</h3>
                                   <div className="flex items-center space-x-1">
                                     {canEditMedicineName && (
                                       <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEditing(medicine)}>
                                         <Edit className="h-3 w-3" />
                                       </Button>
                                     )}
                                     {canEditMedicineName && (
                                       <Button variant="ghost" size="icon" className="h-6 w-6 text-red-600 hover:text-red-700" onClick={() => handleDeleteMedicine(medicine)}>
                                         <Trash2 className="h-3 w-3" />
                                       </Button>
                                     )}
                                   </div>
                                 </>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {language === 'ar' ? 'آخر تحديث:' : 'Last updated:'} {new Date(medicine.last_updated).toLocaleDateString()} 
                              {language === 'ar' ? ' بواسطة ' : ' by '} {medicine.updatedBy}
                            </p>
                          </div>
                         </div>
                         
                           <div className="flex items-center">
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={() => toggleStatus(medicine)}
                               className="bg-red-50 hover:bg-red-100 text-xs px-2 py-1"
                             >
                               {t('shortages.shortage')}
                             </Button>
                           </div>
                       </div>
                     </div>
                   ))}
                   {available.length === 0 && (
                     <p className="text-center text-gray-500 py-8 text-sm">
                       {language === 'ar' ? 'لا توجد أدوية متوفرة' : 'No available medicines'}
                     </p>
                   )}
                 </div>

                 {/* Pagination for Available */}
                 {totalAvailablePages > 1 && (
                   <div className="flex items-center justify-between mt-4 px-4 pb-4">
                     <div className="text-sm text-gray-500">
                       {language === 'ar' 
                         ? `صفحة ${currentAvailablePage} من ${totalAvailablePages}` 
                         : `Page ${currentAvailablePage} of ${totalAvailablePages}`
                       }
                     </div>
                     <div className="flex items-center space-x-2">
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => setCurrentAvailablePage(prev => Math.max(1, prev - 1))}
                         disabled={currentAvailablePage === 1}
                       >
                         <ChevronRight className="w-4 h-4" />
                       </Button>
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => setCurrentAvailablePage(prev => Math.min(totalAvailablePages, prev + 1))}
                         disabled={currentAvailablePage === totalAvailablePages}
                       >
                         <ChevronLeft className="w-4 h-4" />
                       </Button>
                     </div>
                   </div>
                 )}
               </CardContent>
             </Card>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-sm text-gray-600 relative z-10">
        <p>Ahmed A Alrjele</p>
        <p>Founder & CEO</p>
        <p>Al-tiryak Al-shafi Pharmacy</p>
      </div>
    </div>
  );
};

export default ShortageManager;
