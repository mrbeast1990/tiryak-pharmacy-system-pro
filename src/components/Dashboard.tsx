
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
      const logoSize = 15;
      doc.addImage('/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png', 'PNG', 15, 10, logoSize, logoSize);
      
      // Header
      doc.setFontSize(12);
      doc.text('Al-Tiryak Al-Shafi Pharmacy', 105, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text('Staff Performance Report - Medicine Shortages', 105, 22, { align: 'center' });
      
      // Current Date
      const currentDate = new Date().toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
      
      doc.setFontSize(9);
      doc.text(`Generated: ${currentDate}`, 105, 29, { align: 'center' });
      
      // Calculate user shortage statistics
      const userStats: Record<string, number> = {};
      
      medicines.forEach(medicine => {
        if (medicine.updatedBy) {
          if (!userStats[medicine.updatedBy]) {
            userStats[medicine.updatedBy] = 0;
          }
          userStats[medicine.updatedBy]++;
        }
      });
      
      // Table headers
      let yPosition = 45;
      
      // Draw smaller header background
      doc.setFillColor(65, 105, 225);
      doc.rect(30, yPosition - 6, 35, 10, 'F');
      doc.rect(65, yPosition - 6, 65, 10, 'F');
      doc.rect(130, yPosition - 6, 40, 10, 'F');
      
      // Table headers text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text('Staff Name', 47.5, yPosition - 1, { align: 'center' });
      doc.text('Shortage Records', 97.5, yPosition - 1, { align: 'center' });
      doc.text('Performance', 150, yPosition - 1, { align: 'center' });
      
      // Table content
      doc.setTextColor(0, 0, 0);
      yPosition += 15;
      
      // Draw table data
      Object.entries(userStats).forEach(([userName, shortageCount], index) => {
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.1);
        doc.line(30, yPosition - 8, 170, yPosition - 8);
        doc.line(30, yPosition + 3, 170, yPosition + 3);
        doc.line(30, yPosition - 8, 30, yPosition + 3);
        doc.line(65, yPosition - 8, 65, yPosition + 3);
        doc.line(130, yPosition - 8, 130, yPosition + 3);
        doc.line(170, yPosition - 8, 170, yPosition + 3);
        
        doc.setFontSize(8);
        doc.text(userName, 47.5, yPosition - 2, { align: 'center' });
        doc.text(shortageCount.toString(), 97.5, yPosition - 2, { align: 'center' });
        
        // Performance rating
        let performance = 'Low';
        if (shortageCount > 10) performance = 'High';
        else if (shortageCount > 5) performance = 'Medium';
        
        doc.text(performance, 150, yPosition - 2, { align: 'center' });
        
        yPosition += 12;
        
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
      });
      
      // Chart section (simple text-based chart)
      yPosition += 10;
      doc.setFontSize(10);
      doc.text('Performance Chart:', 30, yPosition);
      yPosition += 8;
      
      Object.entries(userStats).forEach(([userName, shortageCount]) => {
        doc.setFontSize(8);
        const chartBar = '█'.repeat(Math.min(Math.floor(shortageCount / 2), 20));
        doc.text(`${userName}: ${chartBar} (${shortageCount})`, 30, yPosition);
        yPosition += 6;
      });
      
      // Summary
      yPosition += 10;
      doc.setFontSize(9);
      doc.text('Summary:', 30, yPosition);
      yPosition += 6;
      doc.setFontSize(8);
      doc.text(`Total Staff: ${Object.keys(userStats).length}`, 30, yPosition);
      yPosition += 5;
      doc.text(`Total Shortage Records: ${medicines.length}`, 30, yPosition);
      yPosition += 5;
      doc.text(`Average Records per Staff: ${Math.round(medicines.length / Object.keys(userStats).length)}`, 30, yPosition);
      
      doc.save(`staff-shortage-performance-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: language === 'ar' ? "تم التصدير" : "Exported",
        description: language === 'ar' ? "تم تصدير تقرير أداء النواقص بنجاح" : "Shortage performance report exported successfully",
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
          backgroundSize: '800px 800px',
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
                  className="w-20 h-20"
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
        {/* Instruction Text */}
        <div className="mb-4 text-center">
          <p className="text-lg font-bold text-gray-800">
            {language === 'ar' ? 'الترتيب يبدأ من هنا.' : 'The order starts from here.'}
          </p>
        </div>

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
