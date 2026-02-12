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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100" dir="rtl">
      {/* Compact Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md safe-area-top">
        <div className="w-full px-3 py-1.5">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-white/90 hover:text-white transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              <span className="text-sm">رجوع</span>
            </button>
            <h1 className="text-base font-bold">دليل الترياق</h1>
            <div className="w-12" />
          </div>
        </div>
      </header>

      {/* Full Width Main Content */}
      <main className="w-full px-2 py-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-2 bg-white/80 backdrop-blur-sm rounded-lg p-0.5 shadow-sm">
            <TabsTrigger 
              value="search" 
              className="flex items-center gap-1 text-xs py-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-md transition-all"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">البحث</span>
            </TabsTrigger>
            <TabsTrigger 
              value="calculator"
              className="flex items-center gap-1 text-xs py-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-md transition-all"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">الجرعات</span>
            </TabsTrigger>
            <TabsTrigger 
              value="ai"
              className="flex items-center gap-1 text-xs py-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-md transition-all"
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">المستشار</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger 
                value="upload"
                className="flex items-center gap-1 text-xs py-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-md transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
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
