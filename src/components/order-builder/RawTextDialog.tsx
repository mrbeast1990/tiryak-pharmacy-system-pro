import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface RawTextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawText: string;
  totalPages?: number;
  extractedCount?: number;
  confidence?: string;
}

const RawTextDialog: React.FC<RawTextDialogProps> = ({
  open,
  onOpenChange,
  rawText,
  totalPages,
  extractedCount,
  confidence,
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(rawText);
    toast.success('تم نسخ النص');
  };

  const getConfidenceLabel = (conf?: string) => {
    switch (conf) {
      case 'high': return { text: 'عالية', color: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30' };
      case 'medium': return { text: 'متوسطة', color: 'text-warning bg-warning/20' };
      case 'low': return { text: 'منخفضة', color: 'text-destructive bg-destructive/20' };
      default: return { text: 'غير محددة', color: 'text-muted-foreground bg-muted' };
    }
  };

  const confidenceInfo = getConfidenceLabel(confidence);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5 text-primary" />
            النص الخام المستخرج
          </DialogTitle>
          <DialogDescription>
            هذا النص تم استخراجه من ملف PDF. يمكنك استخدامه للتحقق من صحة البيانات.
          </DialogDescription>
        </DialogHeader>

        {/* Stats */}
        <div className="flex flex-wrap gap-3 text-sm">
          {totalPages && (
            <div className="bg-muted px-3 py-1 rounded-full">
              <span className="text-muted-foreground">الصفحات:</span>{' '}
              <span className="font-medium text-foreground">{totalPages}</span>
            </div>
          )}
          {extractedCount !== undefined && (
            <div className="bg-muted px-3 py-1 rounded-full">
              <span className="text-muted-foreground">الأصناف:</span>{' '}
              <span className="font-medium text-foreground">{extractedCount}</span>
            </div>
          )}
          {confidence && (
            <div className={`px-3 py-1 rounded-full ${confidenceInfo.color}`}>
              <span>الدقة:</span>{' '}
              <span className="font-medium">{confidenceInfo.text}</span>
            </div>
          )}
        </div>

        {/* Raw Text */}
        <div className="relative">
          <Textarea
            value={rawText || 'لا يوجد نص مستخرج'}
            readOnly
            className="min-h-[300px] font-mono text-sm text-foreground"
            dir="auto"
          />
          <Button
            size="icon"
            variant="outline"
            className="absolute top-2 left-2"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RawTextDialog;
