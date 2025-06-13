
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { usePharmacyStore } from '@/store/pharmacyStore';
import { ArrowRight, Users, BarChart3, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ReportsPageProps {
  onBack: () => void;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ onBack }) => {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const { medicines, revenues } = usePharmacyStore();

  // Calculate user statistics
  const userStats = React.useMemo(() => {
    const stats: Record<string, { shortages: number; revenues: number }> = {};
    
    medicines.forEach(medicine => {
      if (medicine.updatedBy) {
        if (!stats[medicine.updatedBy]) {
          stats[medicine.updatedBy] = { shortages: 0, revenues: 0 };
        }
        stats[medicine.updatedBy].shortages++;
      }
    });
    
    revenues.forEach(revenue => {
      if (revenue.createdBy) {
        if (!stats[revenue.createdBy]) {
          stats[revenue.createdBy] = { shortages: 0, revenues: 0 };
        }
        stats[revenue.createdBy].revenues++;
      }
    });
    
    return Object.entries(stats).map(([name, data]) => ({
      name,
      shortages: data.shortages,
      revenues: data.revenues,
      total: data.shortages + data.revenues
    }));
  }, [medicines, revenues]);

  const chartData = userStats.map(user => ({
    name: user.name,
    النواقص: user.shortages,
    الإيرادات: user.revenues
  }));

  const pieData = userStats.map(user => ({
    name: user.name,
    value: user.total
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
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
                <span>العودة للرئيسية</span>
              </Button>
              <h1 className="text-lg font-bold text-gray-900">تقارير الأداء</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        {/* User Statistics Table */}
        <Card className="card-shadow mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 space-x-reverse text-right">
              <Users className="w-6 h-6 text-blue-500" />
              <span>إحصائيات المستخدمين</span>
            </CardTitle>
            <CardDescription className="text-right">
              عرض تفصيلي لأداء كل مستخدم في النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4 font-medium text-gray-700">اسم المستخدم</th>
                    <th className="py-3 px-4 font-medium text-gray-700">سجلات النواقص</th>
                    <th className="py-3 px-4 font-medium text-gray-700">سجلات الإيرادات</th>
                    <th className="py-3 px-4 font-medium text-gray-700">إجمالي السجلات</th>
                    <th className="py-3 px-4 font-medium text-gray-700">التقييم</th>
                  </tr>
                </thead>
                <tbody>
                  {userStats.map((userStat, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{userStat.name}</td>
                      <td className="py-3 px-4">{userStat.shortages}</td>
                      <td className="py-3 px-4">{userStat.revenues}</td>
                      <td className="py-3 px-4 font-semibold">{userStat.total}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          userStat.total > 20 ? 'bg-green-100 text-green-800' :
                          userStat.total > 10 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {userStat.total > 20 ? 'ممتاز' : userStat.total > 10 ? 'جيد' : 'متوسط'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bar Chart */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 space-x-reverse text-right">
                <BarChart3 className="w-6 h-6 text-green-500" />
                <span>مخطط الأداء التفصيلي</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="النواقص" fill="#8884d8" />
                    <Bar dataKey="الإيرادات" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 space-x-reverse text-right">
                <FileText className="w-6 h-6 text-purple-500" />
                <span>توزيع الأنشطة</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="card-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{userStats.length}</p>
                <p className="text-sm text-gray-600">إجمالي المستخدمين النشطين</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{medicines.length}</p>
                <p className="text-sm text-gray-600">إجمالي سجلات النواقص</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{revenues.length}</p>
                <p className="text-sm text-gray-600">إجمالي سجلات الإيرادات</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;
