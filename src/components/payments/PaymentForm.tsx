import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { usePaymentsStore } from '@/store/paymentsStore';
import { useAuthStore } from '@/store/authStore';
import { usePaymentAttachment } from '@/hooks/usePaymentAttachment';
import CompanySelector from './CompanySelector';
import { 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Camera, 
  Paperclip, 
  X, 
  Loader2,
  Settings2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const PaymentForm: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentType, setPaymentType] = useState<'cash' | 'bank'>('cash');
  const [notes, setNotes] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addPayment } = usePaymentsStore();
  const { user } = useAuthStore();
  const { uploadAttachment, captureFromCamera, selectFile, uploading } = usePaymentAttachment();

  const handleCameraCapture = async () => {
    const file = await captureFromCamera();
    if (file) {
      const url = await uploadAttachment(file);
      if (url) {
        setAttachmentUrl(url);
        setAttachmentName('صورة من الكاميرا');
        toast.success('تم رفع الصورة بنجاح');
      }
    }
  };

  const handleFileSelect = async () => {
    const file = await selectFile();
    if (file) {
      const url = await uploadAttachment(file);
      if (url) {
        setAttachmentUrl(url);
        setAttachmentName(file.name);
        toast.success('تم رفع الملف بنجاح');
      }
    }
  };

  const removeAttachment = () => {
    setAttachmentUrl(null);
    setAttachmentName(null);
  };

  const resetForm = () => {
    setCompanyName('');
    setAmount('');
    setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
    setPaymentType('cash');
    setNotes('');
    setAttachmentUrl(null);
    setAttachmentName(null);
    setShowExtras(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      toast.error('يرجى اختيار الشركة');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }

    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    setIsSubmitting(true);

    const success = await addPayment({
      company_name: companyName.trim(),
      amount: Number(amount),
      payment_date: paymentDate,
      payment_type: paymentType,
      notes: notes.trim() || undefined,
      attachment_url: attachmentUrl || undefined,
      is_deducted: false,
      created_by_id: user.id,
      created_by_name: user.name,
    });

    setIsSubmitting(false);

    if (success) {
      toast.success('تم تسجيل السداد بنجاح');
      resetForm();
      setIsOpen(false);
    } else {
      toast.error('حدث خطأ أثناء تسجيل السداد');
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden border-primary/20">
        <CollapsibleTrigger asChild>
          <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-primary" />
                </div>
                إضافة سداد جديد
              </span>
              {isOpen ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* صف 1: الشركة + المبلغ */}
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-3">
                  <CompanySelector value={companyName} onChange={setCompanyName} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">المبلغ (د.ل)</label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="text-base font-semibold h-10"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* صف 2: التاريخ + نوع السداد */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">التاريخ</label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">نوع السداد</label>
                  <div className="grid grid-cols-2 gap-1">
                    <Button
                      type="button"
                      variant={paymentType === 'cash' ? 'default' : 'outline'}
                      onClick={() => setPaymentType('cash')}
                      className={cn(
                        'h-10 text-sm px-2',
                        paymentType === 'cash' && 'bg-green-600 hover:bg-green-700'
                      )}
                    >
                      💵 كاش
                    </Button>
                    <Button
                      type="button"
                      variant={paymentType === 'bank' ? 'default' : 'outline'}
                      onClick={() => setPaymentType('bank')}
                      className={cn(
                        'h-10 text-sm px-2',
                        paymentType === 'bank' && 'bg-blue-600 hover:bg-blue-700'
                      )}
                    >
                      🏦 مصرف
                    </Button>
                  </div>
                </div>
              </div>

              {/* خيارات إضافية */}
              <Collapsible open={showExtras} onOpenChange={setShowExtras}>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Settings2 className="w-3.5 h-3.5 ml-1" />
                    خيارات إضافية
                    {showExtras ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  {/* الملاحظات */}
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="ملاحظات: رقم الصك، اسم المستلم..."
                    rows={2}
                    className="resize-none text-sm"
                  />

                  {/* المرفقات */}
                  {attachmentUrl ? (
                    <div className="flex items-center gap-2 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                      <Paperclip className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-emerald-700 flex-1 truncate">
                        {attachmentName}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeAttachment}
                        className="h-6 w-6 p-0 text-emerald-600 hover:text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCameraCapture}
                        disabled={uploading}
                        className="h-9 text-sm"
                      >
                        {uploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Camera className="w-4 h-4 ml-1" />
                            تصوير
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleFileSelect}
                        disabled={uploading}
                        className="h-9 text-sm"
                      >
                        {uploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Paperclip className="w-4 h-4 ml-1" />
                            رفع ملف
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* زر الإضافة */}
              <Button
                type="submit"
                className="w-full h-11 text-base bg-primary hover:bg-primary/90"
                disabled={isSubmitting || !companyName || !amount}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    جاري التسجيل...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 ml-2" />
                    تسجيل السداد
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default PaymentForm;
