
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { LogOut, Pill, TrendingUp, FileText, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ShortageManager from './ShortageManager';
import RevenueManager from './RevenueManager';

const Dashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'shortage' | 'revenue'>('dashboard');
  const { user, logout, checkPermission } = useAuthStore();
  const { medicines, revenues, getTotalDailyRevenue } = usePharmacyStore();
  const { toast } = useToast();

  const shortages = medicines.filter(m => m.status === 'shortage');
  const available = medicines.filter(m => m.status === 'available');
  const today = new Date().toISOString().split('T')[0];
  const todayRevenue = getTotalDailyRevenue(today);

  const handleLogout = () => {
    logout();
    toast({
      title: "تم تسجيل الخروج",
      description: "شكراً لاستخدامك نظام صيدلية الترياق",
    });
  };

  const generateUserReport = () => {
    // This would generate a PDF report of user performance (admin only)
    toast({
      title: "تصدير التقرير",
      description: "سيتم إضافة هذه الميزة قريباً",
    });
  };

  if (activeView === 'shortage') {
    return <ShortageManager onBack={() => setActiveView('dashboard')} />;
  }

  if (activeView === 'revenue') {
    return <RevenueManager onBack={() => setActiveView('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-10 h-10 pharmacy-gradient rounded-lg flex items-center justify-center">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">صيدلية الترياق</h1>
                <p className="text-sm text-gray-500">مرحباً، {user?.name}</p>
              </div>
            </div>
            
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center space-x-2 space-x-reverse"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">النواقص</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{shortages.length}</div>
              <p className="text-xs text-muted-foreground">أصناف ناقصة</p>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المتوفر</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{available.length}</div>
              <p className="text-xs text-muted-foreground">أصناف متوفرة</p>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إيراد اليوم</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{todayRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">ريال سعودي</p>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
              <FileText className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{revenues.length}</div>
              <p className="text-xs text-muted-foreground">سجل إيراد</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="card-shadow hover:shadow-lg transition-shadow cursor-pointer" 
                onClick={() => setActiveView('shortage')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 space-x-reverse">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <span>تسجيل نواقص الأدوية</span>
              </CardTitle>
              <CardDescription>
                إدارة الأدوية الناقصة والمتوفرة في الصيدلية
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setActiveView('revenue')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 space-x-reverse">
                <TrendingUp className="w-6 h-6 text-green-500" />
                <span>تسجيل الإيرادات</span>
              </CardTitle>
              <CardDescription>
                تسجيل الإيرادات والمصروفات حسب الفترات
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Reports Section - Only for Admin and Ahmad */}
        {(checkPermission('export_pdf')) && (
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 space-x-reverse">
                <Users className="w-6 h-6 text-blue-500" />
                <span>التقارير</span>
              </CardTitle>
              <CardDescription>
                تصدير تقارير الأداء (متاح للمدير وأحمد الرجيلي فقط)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={generateUserReport} className="pharmacy-gradient">
                <FileText className="w-4 h-4 ml-2" />
                تصدير تقرير أداء المستخدمين
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
