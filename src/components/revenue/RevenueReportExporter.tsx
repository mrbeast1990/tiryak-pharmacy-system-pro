
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Download } from 'lucide-react';

interface RevenueReportExporterProps {
  reportStartDate: string;
  setReportStartDate: (date: string) => void;
  reportEndDate: string;
  setReportEndDate: (date: string) => void;
  generatePeriodReport: () => void;
}

const RevenueReportExporter: React.FC<RevenueReportExporterProps> = ({
  reportStartDate,
  setReportStartDate,
  reportEndDate,
  setReportEndDate,
  generatePeriodReport,
}) => {
  return (
    <Card className="card-shadow">
      <CardContent className="pt-6">
        <h3 className="text-sm font-medium text-gray-700 text-right mb-4">
          إصدار تقرير فترة معينة
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 text-right block">
                من
              </label>
              <Input
                type="date"
                value={reportStartDate}
                onChange={(e) => setReportStartDate(e.target.value)}
                className="text-xs text-right"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 text-right block">
                الى
              </label>
              <Input
                type="date"
                value={reportEndDate}
                onChange={(e) => setReportEndDate(e.target.value)}
                className="text-xs text-right"
              />
            </div>
          </div>
          
          <Button
            onClick={generatePeriodReport}
            className="w-full pharmacy-gradient text-white"
            size="sm"
          >
            <Download className="w-4 h-4 ml-2" />
            تصدير PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueReportExporter;
