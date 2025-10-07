import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { usePharmacyStore, Medicine } from '@/store/pharmacyStore';
import { ArrowRight, Search, CheckCircle, Edit, Save, X, Trash2, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const AvailableMedicines: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMedicineId, setEditingMedicineId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const navigate = useNavigate();
  const { user, checkPermission } = useAuthStore();
  const { language, t } = useLanguageStore();
  const { medicines, updateMedicine, deleteMedicine, loadMedicines } = usePharmacyStore();
  const { toast } = useToast();

  useEffect(() => {
    loadMedicines();
  }, [loadMedicines]);

  useEffect(() => {
    const channel = supabase
      .channel('medicines-changes-available')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medicines'
        },
        () => {
          loadMedicines();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadMedicines]);

  const filteredMedicines = useMemo(() => {
    return medicines.filter(medicine =>
      medicine.status === 'available' &&
      medicine.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [medicines, searchTerm]);

  const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage);
  
  const availableMedicines = filteredMedicines.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleStatus = (medicine: Medicine) => {
    updateMedicine(medicine.id, {
      status: 'shortage',
    });
    
    toast({
      title: language === 'ar' ? "تم التحديث" : "Updated",
      description: language === 'ar' 
        ? `تم تحديث حالة ${medicine.name} إلى ناقص`
        : `${medicine.name} status updated to shortage`,
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return language === 'ar' ? 'الآن' : 'Now';
    if (diffMins < 60) return language === 'ar' ? `منذ ${diffMins} دقيقة` : `${diffMins} min ago`;
    if (diffHours < 24) return language === 'ar' ? `منذ ${diffHours} ساعة` : `${diffHours} hours ago`;
    if (diffDays < 7) return language === 'ar' ? `منذ ${diffDays} يوم` : `${diffDays} days ago`;
    
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 relative">
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
            <h1 className="text-lg font-bold text-gray-900">الأصناف التي تم توفيرها</h1>
          </div>
          <div className="pb-4">
            <Button
              onClick={() => navigate('/')}
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
        <div className="relative mb-6">
          <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'ar' ? 'البحث عن دواء...' : 'Search for medicine...'}
            className="pl-10"
          />
        </div>

        <Card className="card-shadow">
          <CardHeader className="py-3">
            <CardTitle className="flex items-center space-x-2 space-x-reverse text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>الأصناف المتوفرة ({filteredMedicines.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {availableMedicines.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {availableMedicines.map((medicine) => (
                  <div
                    key={medicine.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3 space-x-reverse flex-1">
                      {editingMedicineId === medicine.id ? (
                        <div className="flex items-center space-x-2 space-x-reverse flex-1">
                          <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="text-right flex-1"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdateName(medicine.id)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEditing}
                            className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <div className="flex-1 text-right">
                            <p className="text-sm font-medium text-gray-900">{medicine.name}</p>
                            <p className="text-xs text-gray-500">
                              {language === 'ar' ? 'آخر تحديث:' : 'Last updated:'} {formatDate(medicine.last_updated)}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {editingMedicineId !== medicine.id && (
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleStatus(medicine)}
                          className="text-xs border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <RotateCcw className="w-3 h-3 ml-1" />
                          إرجاع للنواقص
                        </Button>
                        
                        {canEditMedicineName && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditing(medicine)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteMedicine(medicine)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                {language === 'ar' ? 'لا توجد أصناف متوفرة' : 'No available medicines'}
              </div>
            )}
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  صفحة {currentPage} من {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <footer className="mt-8 text-center text-xs text-gray-500">
          <p>صيدلية الترياق الشافي</p>
          <p className="mt-1">تل رفعت - دوار الخطيب - 0949333323</p>
        </footer>
      </main>
    </div>
  );
};

export default AvailableMedicines;
