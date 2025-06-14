import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { usePharmacyStore, Medicine } from '@/store/pharmacyStore';
import { ArrowRight, Plus, Search, AlertCircle, CheckCircle, FileText, RotateCcw, Pill } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

interface ShortageManagerProps {
  onBack: () => void;
}

const ShortageManager: React.FC<ShortageManagerProps> = ({ onBack }) => {
  const [medicineName, setMedicineName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const { user, checkPermission } = useAuthStore();
  const { language, t } = useLanguageStore();
  const { medicines, addMedicine, updateMedicine, deleteMedicine, getMedicineSuggestions } = usePharmacyStore();
  const { toast } = useToast();

  const suggestions = getMedicineSuggestions(medicineName);

  const filteredMedicines = useMemo(() => {
    return medicines.filter(medicine =>
      medicine.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [medicines, searchTerm]);

  const shortages = filteredMedicines.filter(m => m.status === 'shortage');
  const available = filteredMedicines.filter(m => m.status === 'available');

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

  const exportShortagesPDF = () => {
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
      
      // Draw table data - smaller rows
      shortages.forEach((medicine, index) => {
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
      
      doc.save(`shortages-list-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: language === 'ar' ? "تم التصدير" : "Exported",
        description: language === 'ar' ? "تم تصدير تقرير النواقص بنجاح" : "Shortages report exported successfully",
      });
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
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-right text-sm"
                            onClick={() => {
                              setMedicineName(suggestion);
                              setShowSuggestions(false);
                            }}
                          >
                            {suggestion}
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
                    <span>{t('dashboard.shortages')} ({shortages.length})</span>
                  </CardTitle>
                  <Button onClick={exportShortagesPDF} size="sm" className="pharmacy-gradient text-xs px-2 py-1">
                    <FileText className="w-2 h-2 ml-1" />
                    {t('shortages.exportPdf')}
                  </Button>
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
                              <h3 className="font-medium text-gray-900 text-sm">{medicine.name}</h3>
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
                        
                        <div className="flex items-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleStatus(medicine)}
                            className="bg-green-50 hover:bg-green-100 text-xs px-2 py-1"
                          >
                            {t('shortages.provided')}
                          </Button>
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
              </CardContent>
            </Card>

            {/* Available List */}
            <Card className="card-shadow">
              <CardHeader className="py-3">
                <CardTitle className="flex items-center space-x-2 space-x-reverse text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>{t('dashboard.available')} ({available.length})</span>
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
                            <h3 className="font-medium text-gray-900 text-sm">{medicine.name}</h3>
                            <p className="text-xs text-gray-500">
                              {language === 'ar' ? 'آخر تحديث:' : 'Last updated:'} {new Date(medicine.last_updated).toLocaleDateString()} 
                              {language === 'ar' ? ' بواسطة ' : ' by '} {medicine.updatedBy}
                            </p>
                          </div>
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
