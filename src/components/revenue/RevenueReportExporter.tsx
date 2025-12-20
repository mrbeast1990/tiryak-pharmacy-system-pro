
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Download, FileText } from 'lucide-react';

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
    <Card className="bg-white border-0 shadow-md rounded-xl overflow-hidden">
      <div className="flex">
        <div className="w-1.5 bg-orange-500" />
        <CardContent className="p-4 flex-1">
          <h3 className="text-sm font-bold text-foreground text-right mb-3 flex items-center justify-end gap-2">
            <span>إصدار تقرير PDF</span>
            <FileText className="w-4 h-4 text-orange-500" />
          </h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground text-right block">من</label>
                <Input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="text-xs text-right h-9 border-border/50 focus:border-orange-500 bg-muted/30 rounded-lg"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground text-right block">إلى</label>
                <Input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="text-xs text-right h-9 border-border/50 focus:border-orange-500 bg-muted/30 rounded-lg"
                />
              </div>
            </div>
            
            <Button
              onClick={generatePeriodReport}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold h-10 rounded-lg shadow-sm"
              size="sm"
            >
              <Download className="w-4 h-4 ml-2" />
              تصدير PDF
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default RevenueReportExporter;
