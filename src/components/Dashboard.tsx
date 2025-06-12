import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { LogOut, TrendingUp, Users, Globe, Pill } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ShortageManager from './ShortageManager';
import RevenueManager from './RevenueManager';
import ProfileModal from './ProfileModal';
import jsPDF from 'jspdf';

const Dashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'shortage' | 'revenue'>('dashboard');
  const [showProfile, setShowProfile] = useState(false);
  const { user, logout, checkPermission } = useAuthStore();
  const { language, toggleLanguage, t } = useLanguageStore();
  const { medicines, revenues, getTotalDailyRevenue } = usePharmacyStore();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: language === 'ar' ? "تم تسجيل الخروج" : "Logged Out",
      description: language === 'ar' ? "شكراً لاستخدامك نظام صيدلية الترياق الشافي" : "Thank you for using Al-Tiryak Al-Shafi System",
    });
  };

  const generateUserReport = () => {
    if (!checkPermission('export_pdf')) {
      toast({
        title: language === 'ar' ? "غير مصرح" : "Unauthorized",
        description: language === 'ar' ? "لا يمكنك تصدير التقارير" : "Cannot export reports",
        variant: "destructive",
      });
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Add logo
      const logoSize = 20;
      doc.addImage('/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png', 'PNG', 15, 10, logoSize, logoSize);
      
      // Header
      doc.setFontSize(16);
      doc.text('Al-Tiryak Al-Shafi Pharmacy', 105, 18, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text('Staff Performance Report', 105, 28, { align: 'center' });
      
      // Current Date
      const currentDate = new Date().toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
      
      doc.setFontSize(12);
      doc.text(`Generated: ${currentDate}`, 105, 38, { align: 'center' });
      
      // Calculate user performance
      const userStats: Record<string, { shortages: number, revenues: number }> = {};
      
      medicines.forEach(medicine => {
        if (medicine.updatedBy) {
          if (!userStats[medicine.updatedBy]) {
            userStats[medicine.updatedBy] = { shortages: 0, revenues: 0 };
          }
          userStats[medicine.updatedBy].shortages++;
        }
      });
      
      revenues.forEach(revenue => {
        if (revenue.createdBy) {
          if (!userStats[revenue.createdBy]) {
            userStats[revenue.createdBy] = { shortages: 0, revenues: 0 };
          }
          userStats[revenue.createdBy].revenues++;
        }
      });
      
      // Table headers
      let yPosition = 55;
      
      // Draw header background
      doc.setFillColor(65, 105, 225);
      doc.rect(20, yPosition - 8, 50, 15, 'F');
      doc.rect(70, yPosition - 8, 50, 15, 'F');
      doc.rect(120, yPosition - 8, 50, 15, 'F');
      
      // Table headers text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text('Staff Name', 45, yPosition, { align: 'center' });
      doc.text('Shortage Records', 95, yPosition, { align: 'center' });
      doc.text('Revenue Records', 145, yPosition, { align: 'center' });
      
      // Table content
      doc.setTextColor(0, 0, 0);
      yPosition += 20;
      
      // Draw table data
      Object.entries(userStats).forEach(([userName, stats], index) => {
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.1);
        doc.line(20, yPosition - 10, 170, yPosition - 10);
        doc.line(20, yPosition + 5, 170, yPosition + 5);
        doc.line(20, yPosition - 10, 20, yPosition + 5);
        doc.line(70, yPosition - 10, 70, yPosition + 5);
        doc.line(120, yPosition - 10, 120, yPosition + 5);
        doc.line(170, yPosition - 10, 170, yPosition + 5);
        
        doc.setFontSize(11);
        doc.text(userName, 45, yPosition - 2, { align: 'center' });
        doc.text(stats.shortages.toString(), 95, yPosition - 2, { align: 'center' });
        doc.text(stats.revenues.toString(), 145, yPosition - 2, { align: 'center' });
        
        yPosition += 15;
        
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
      });
      
      // Summary
      yPosition += 15;
      doc.setFontSize(12);
      doc.text('Performance Summary:', 20, yPosition);
      yPosition += 10;
      doc.setFontSize(10);
      doc.text(`Total Staff: ${Object.keys(userStats).length}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Total Shortage Records: ${medicines.length}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Total Revenue Records: ${revenues.length}`, 20, yPosition);
      
      doc.save(`staff-performance-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: language === 'ar' ? "تم التصدير" : "Exported",
        description: language === 'ar' ? "تم تصدير تقرير الأداء بنجاح" : "Performance report exported successfully",
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? "خطأ في التصدير" : "Export Error",
        description: language === 'ar' ? "حدث خطأ أثناء تصدير التقرير" : "Error occurred while exporting report",
        variant: "destructive",
      });
    }
  };

  if (activeView === 'shortage') {
    return <ShortageManager onBack={() => setActiveView('dashboard')} />;
  }

  if (activeView === 'revenue') {
    return <RevenueManager onBack={() => setActiveView('dashboard')} />;
  }

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
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div 
                className="cursor-pointer"
                onClick={() => setShowProfile(true)}
              >
                <img 
                  src="/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png" 
                  alt="Al-Tiryak Logo" 
                  className="w-16 h-16"
                />
              </div>
              <div>
                <h1 className="text-xs font-bold text-gray-900">{t('pharmacy.name')}</h1>
                <p className="text-xs text-gray-500">{t('welcome')} {user?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button
                onClick={toggleLanguage}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1 text-xs px-1 py-1"
              >
                <Globe className="w-2 h-2" />
                <span className="text-xs">{t('language')}</span>
              </Button>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1 space-x-reverse text-xs px-1 py-1"
              >
                <LogOut className="w-2 h-2" />
                <span className="text-xs">{t('logout')}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="card-shadow hover:shadow-lg transition-shadow cursor-pointer" 
                onClick={() => setActiveView('shortage')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 space-x-reverse">
                <Pill className="w-6 h-6 text-red-500" />
                <span>{t('dashboard.registerShortage')}</span>
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'إدارة الأدوية الناقصة والمتوفرة في الصيدلية' : 'Manage shortage and available medicines in pharmacy'}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setActiveView('revenue')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 space-x-reverse">
                <TrendingUp className="w-6 h-6 text-green-500" />
                <span>{t('dashboard.registerRevenue')}</span>
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'تسجيل الإيرادات والمصروفات حسب الفترات' : 'Register revenues and expenses by shifts'}
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
                <span>{t('dashboard.reports')}</span>
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'تصدير تقارير الأداء (متاح للمدير وأحمد الرجيلي فقط)' : 'Export performance reports (Available for admin and Ahmad Rajili only)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={generateUserReport} className="pharmacy-gradient">
                <Users className="w-4 h-4 ml-2" />
                {t('dashboard.exportUserReport')}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
      
      {/* Profile Modal */}
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
      
      {/* Footer */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-sm text-gray-600 relative z-10">
        <p>Ahmed A Alrjele</p>
        <p>Founder & CEO</p>
        <p>Al-tiryak Al-shafi Pharmacy</p>
      </div>
    </div>
  );
};

export default Dashboard;
