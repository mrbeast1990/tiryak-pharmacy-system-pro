import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Edit, Trash2 } from 'lucide-react';
import { Revenue } from '@/store/pharmacyStore';
import EditRevenueDialog from './EditRevenueDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

interface DailyRevenueDetailsProps {
  onBack: () => void;
  selectedDate: string;
  dailyRevenue: number;
  dailyRevenues: Revenue[];
  language: 'ar' | 'en';
  updateRevenue: (id: string, updates: Partial<Omit<Revenue, 'id' | 'created_at' | 'createdBy' | 'date'>>) => Promise<void>;
  deleteRevenue: (id: string) => Promise<void>;
  checkPermission: (permission: string) => boolean;
}

const DailyRevenueDetails: React.FC<DailyRevenueDetailsProps> = ({
  onBack,
  selectedDate,
  dailyRevenue,
  dailyRevenues,
  language,
  updateRevenue,
  deleteRevenue,
  checkPermission,
}) => {
  const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null);
  const { toast } = useToast();
  const canManage = checkPermission('manage_users');

  const handleUpdateRevenue = async (id: string, updates: Partial<Omit<Revenue, 'id' | 'created_at' | 'createdBy' | 'date'>>) => {
    await updateRevenue(id, updates);
    toast({ title: 'تم التحديث', description: 'تم تحديث السجل بنجاح' });
  };

  const handleDeleteRevenue = async (id: string) => {
    await deleteRevenue(id);
    toast({ title: 'تم الحذف', description: 'تم حذف السجل بنجاح' });
  };
  
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
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
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4 space-x-reverse">
                <Button
                  onClick={onBack}
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2 space-x-reverse text-sm"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>العودة</span>
                </Button>
                <h1 className="text-lg font-bold text-gray-900">إيراد {selectedDate}</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8 relative z-10">
          <Card className="card-shadow mb-6">
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">إجمالي إيراد اليوم</p>
                <p className="text-2xl font-bold text-green-600">{dailyRevenue.toFixed(2)} دينار</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {dailyRevenues
              .map((revenue) => (
              <Card key={revenue.id} className="card-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {revenue.period === 'morning' ? 'صباحية' : 
                         revenue.period === 'evening' ? 'مسائية' : 
                         revenue.period === 'night' ? 'ليلية' : 'احمد الرجيلي'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        المبلغ: {revenue.amount} دينار
                      </p>
                      {revenue.notes && (
                        <p className="text-sm text-gray-500 mt-1">{revenue.notes.replace('- Income', '').replace('- Cash Disbursement', '').trim()}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                       <Badge variant={revenue.type === 'income' ? 'default' : 'destructive'}>
                        {revenue.type === 'income' ? 'إيراد' : 'صرف'}
                       </Badge>
                       {canManage && (
                         <>
                          <Button variant="ghost" size="icon" onClick={() => setEditingRevenue(revenue)} className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 h-8 w-8">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف هذا السجل نهائيًا.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteRevenue(revenue.id)} className="bg-red-600 hover:bg-red-700">
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                         </>
                       )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {dailyRevenues.length === 0 && (
              <Card className="card-shadow">
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">لا توجد عمليات في هذا التاريخ</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
      <EditRevenueDialog
        isOpen={!!editingRevenue}
        onClose={() => setEditingRevenue(null)}
        revenue={editingRevenue}
        onSave={handleUpdateRevenue}
      />
    </>
  );
};

export default DailyRevenueDetails;
