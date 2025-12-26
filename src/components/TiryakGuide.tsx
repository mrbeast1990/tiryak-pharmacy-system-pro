import React, { useState } from 'react';
import { ArrowRight, Search, Calculator, Bot, Upload } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import DrugSearch from './guide/DrugSearch';
import DosageCalculator from './guide/DosageCalculator';
import AIConsultant from './guide/AIConsultant';
import DrugUploader from './guide/DrugUploader';

interface TiryakGuideProps {
  onBack: () => void;
}

const TiryakGuide: React.FC<TiryakGuideProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('search');
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'ahmad_rajili';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-fuchsia-100" dir="rtl">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
              <span>رجوع</span>
            </button>
            <div className="text-center flex-1">
              <h1 className="text-xl font-bold">دليل الترياق</h1>
              <p className="text-sm text-white/80">Al-Tiryak Guide</p>
            </div>
            <div className="w-16" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4 bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-sm">
            <TabsTrigger 
              value="search" 
              className="flex items-center gap-1.5 text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg transition-all"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">البحث</span>
            </TabsTrigger>
            <TabsTrigger 
              value="calculator"
              className="flex items-center gap-1.5 text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg transition-all"
            >
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">الجرعات</span>
            </TabsTrigger>
            <TabsTrigger 
              value="ai"
              className="flex items-center gap-1.5 text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg transition-all"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">المستشار</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger 
                value="upload"
                className="flex items-center gap-1.5 text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg transition-all"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">التحديث</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="search" className="mt-0">
            <DrugSearch />
          </TabsContent>

          <TabsContent value="calculator" className="mt-0">
            <DosageCalculator />
          </TabsContent>

          <TabsContent value="ai" className="mt-0">
            <AIConsultant />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="upload" className="mt-0">
              <DrugUploader />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default TiryakGuide;
