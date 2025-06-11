
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { usePharmacyStore, Medicine } from '@/store/pharmacyStore';
import { ArrowRight, Plus, Search, AlertCircle, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShortageManagerProps {
  onBack: () => void;
}

const ShortageManager: React.FC<ShortageManagerProps> = ({ onBack }) => {
  const [medicineName, setMedicineName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const { user, checkPermission } = useAuthStore();
  const { medicines, addMedicine, updateMedicine, deleteMedicine } = usePharmacyStore();
  const { toast } = useToast();

  const filteredMedicines = useMemo(() => {
    return medicines.filter(medicine =>
      medicine.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [medicines, searchTerm]);

  const existingMedicineNames = medicines.map(m => m.name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!medicineName.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم الدواء",
        variant: "destructive",
      });
      return;
    }

    if (editingId) {
      updateMedicine(editingId, {
        name: medicineName,
        notes,
        lastUpdated: new Date().toISOString(),
        updatedBy: user?.name || ''
      });
      toast({
        title: "تم التحديث",
        description: `تم تحديث ${medicineName} بنجاح`,
      });
      setEditingId(null);
    } else {
      const existingMedicine = medicines.find(m => m.name.toLowerCase() === medicineName.toLowerCase());
      
      if (existingMedicine) {
        updateMedicine(existingMedicine.id, {
          status: 'shortage',
          notes,
          lastUpdated: new Date().toISOString(),
          updatedBy: user?.name || ''
        });
        toast({
          title: "تم التحديث",
          description: `تم تحديث حالة ${medicineName} إلى ناقص`,
        });
      } else {
        addMedicine({
          name: medicineName,
          status: 'shortage',
          notes,
          lastUpdated: new Date().toISOString(),
          updatedBy: user?.name || ''
        });
        toast({
          title: "تم الإضافة",
          description: `تم إضافة ${medicineName} كدواء ناقص`,
        });
      }
    }

    setMedicineName('');
    setNotes('');
  };

  const handleEdit = (medicine: Medicine) => {
    if (!checkPermission('edit_all') && medicine.updatedBy !== user?.name) {
      toast({
        title: "غير مصرح",
        description: "لا يمكنك تعديل هذا السجل",
        variant: "destructive",
      });
      return;
    }

    setEditingId(medicine.id);
    setMedicineName(medicine.name);
    setNotes(medicine.notes || '');
  };

  const handleDelete = (medicine: Medicine) => {
    if (!checkPermission('delete_all') && medicine.updatedBy !== user?.name) {
      toast({
        title: "غير مصرح",
        description: "لا يمكنك حذف هذا السجل",
        variant: "destructive",
      });
      return;
    }

    deleteMedicine(medicine.id);
    toast({
      title: "تم الحذف",
      description: `تم حذف ${medicine.name} من القائمة`,
    });
  };

  const toggleStatus = (medicine: Medicine) => {
    const newStatus = medicine.status === 'shortage' ? 'available' : 'shortage';
    updateMedicine(medicine.id, {
      status: newStatus,
      lastUpdated: new Date().toISOString(),
      updatedBy: user?.name || ''
    });
    
    toast({
      title: "تم التحديث",
      description: `تم تحديث حالة ${medicine.name} إلى ${newStatus === 'available' ? 'متوفر' : 'ناقص'}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              onClick={onBack}
              variant="ghost"
              className="flex items-center space-x-2 space-x-reverse"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة للرئيسية</span>
            </Button>
            <h1 className="text-xl font-bold text-gray-900 mr-4">إدارة نواقص الأدوية</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Add/Edit Medicine Form */}
          <div className="lg:col-span-1">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle>
                  {editingId ? 'تعديل الدواء' : 'إضافة دواء ناقص'}
                </CardTitle>
                <CardDescription>
                  {editingId ? 'تعديل بيانات الدواء' : 'أدخل اسم الدواء الناقص'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      اسم الدواء
                    </label>
                    <Input
                      value={medicineName}
                      onChange={(e) => setMedicineName(e.target.value)}
                      placeholder="أدخل اسم الدواء"
                      list="medicine-suggestions"
                      className="text-right"
                    />
                    <datalist id="medicine-suggestions">
                      {existingMedicineNames.map((name, index) => (
                        <option key={index} value={name} />
                      ))}
                    </datalist>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      ملاحظات (اختياري)
                    </label>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="أدخل ملاحظات إضافية"
                      className="text-right"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full pharmacy-gradient">
                    <Plus className="w-4 h-4 ml-2" />
                    {editingId ? 'تحديث الدواء' : 'إضافة الدواء'}
                  </Button>
                  
                  {editingId && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setEditingId(null);
                        setMedicineName('');
                        setNotes('');
                      }}
                    >
                      إلغاء التعديل
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Medicine List */}
          <div className="lg:col-span-2">
            <Card className="card-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                  <div>
                    <CardTitle>قائمة الأدوية</CardTitle>
                    <CardDescription>
                      إجمالي الأدوية: {medicines.length} | 
                      ناقص: {medicines.filter(m => m.status === 'shortage').length} | 
                      متوفر: {medicines.filter(m => m.status === 'available').length}
                    </CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="البحث عن دواء..."
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredMedicines.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">لا توجد أدوية مسجلة</p>
                  ) : (
                    filteredMedicines.map((medicine) => (
                      <div
                        key={medicine.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          medicine.status === 'shortage'
                            ? 'border-red-200 bg-red-50'
                            : 'border-green-200 bg-green-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            {medicine.status === 'shortage' ? (
                              <AlertCircle className="w-5 h-5 text-red-500" />
                            ) : (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                            <div>
                              <h3 className="font-medium text-gray-900">{medicine.name}</h3>
                              <p className="text-sm text-gray-500">
                                آخر تحديث: {new Date(medicine.lastUpdated).toLocaleDateString('ar-SA')} بواسطة {medicine.updatedBy}
                              </p>
                              {medicine.notes && (
                                <p className="text-sm text-gray-600 mt-1">ملاحظة: {medicine.notes}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Badge
                              variant={medicine.status === 'shortage' ? 'destructive' : 'default'}
                              className={medicine.status === 'available' ? 'bg-green-500' : ''}
                            >
                              {medicine.status === 'shortage' ? 'ناقص' : 'متوفر'}
                            </Badge>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleStatus(medicine)}
                            >
                              {medicine.status === 'shortage' ? 'تم توفيره' : 'نفد'}
                            </Button>
                            
                            {(checkPermission('edit_all') || medicine.updatedBy === user?.name) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(medicine)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            
                            {(checkPermission('delete_all') || medicine.updatedBy === user?.name) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(medicine)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ShortageManager;
