import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Wrench, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FixLog {
  id: string;
  description: string;
  type: 'fixed' | 'info';
}

const DataFixButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<FixLog[]>([]);
  const [done, setDone] = useState(false);

  const runFix = async () => {
    setRunning(true);
    setLogs([]);
    setDone(false);
    const newLogs: FixLog[] = [];

    try {
      // 1. Fetch all revenues
      const { data: revenues, error: revErr } = await supabase
        .from('revenues')
        .select('*')
        .limit(5000);
      if (revErr) throw revErr;

      let fixedCount = 0;

      for (const rev of revenues || []) {
        const updates: Record<string, any> = {};
        const issues: string[] = [];

        // Issue 1: is_note_only with non-zero amount → reset amount to 0
        if (rev.is_note_only && Number(rev.amount) !== 0) {
          updates.amount = 0;
          issues.push(`ملاحظة لها مبلغ (${rev.amount}) → تم ضبطه إلى 0`);
        }

        // Issue 2: amount = 0 and not is_note_only and has notes/voice/attachment → mark as note_only
        if (
          !rev.is_note_only &&
          Number(rev.amount) === 0 &&
          (rev.notes || rev.voice_note_url || rev.attachment_url)
        ) {
          updates.is_note_only = true;
          issues.push('سجل بدون مبلغ ويحتوي ملاحظة → تم تحويله إلى ملاحظة مستقلة');
        }

        // Issue 3: banking_services without service_name
        if (rev.type === 'banking_services' && !rev.service_name) {
          updates.service_name = 'other';
          issues.push('خدمة مصرفية بدون اسم → تم تعيينها كـ "أخرى"');
        }

        // Issue 4: income with service_name (should be null)
        if (rev.type === 'income' && rev.service_name) {
          updates.service_name = null;
          issues.push(`نقدي مع اسم خدمة (${rev.service_name}) → تم إزالته`);
        }

        // Issue 5: adjustment but no adjustment_note
        if (rev.adjustment && Number(rev.adjustment) !== 0 && !rev.adjustment_note) {
          updates.adjustment_note = 'بدون ملاحظة';
          issues.push(`فرق مسجل بدون سبب → تم وضع "بدون ملاحظة"`);
        }

        // Issue 6: created_by_name contains stray comma like "صباحيه،"
        if (rev.created_by_name && /^صباحي?ة?،?$/.test(rev.created_by_name.trim())) {
          updates.created_by_name = 'الفترة الصباحية';
          issues.push(`اسم المستخدم "${rev.created_by_name}" → "الفترة الصباحية"`);
        }
        if (rev.created_by_name && /^مسائي?ة?،?$/.test(rev.created_by_name.trim())) {
          updates.created_by_name = 'الفترة المسائية';
          issues.push(`اسم المستخدم "${rev.created_by_name}" → "الفترة المسائية"`);
        }
        if (rev.created_by_name && /^ليلي?ة?،?$/.test(rev.created_by_name.trim())) {
          updates.created_by_name = 'الفترة الليلية';
          issues.push(`اسم المستخدم "${rev.created_by_name}" → "الفترة الليلية"`);
        }

        if (Object.keys(updates).length > 0) {
          const { error: upErr } = await supabase
            .from('revenues')
            .update(updates)
            .eq('id', rev.id);
          if (upErr) {
            newLogs.push({
              id: rev.id,
              description: `❌ فشل إصلاح سجل ${rev.id.slice(0, 8)}: ${upErr.message}`,
              type: 'info',
            });
          } else {
            fixedCount++;
            issues.forEach(issue =>
              newLogs.push({
                id: rev.id,
                description: `✅ ${rev.date} (${rev.period}) - ${issue}`,
                type: 'fixed',
              })
            );
          }
        }
      }

      if (fixedCount === 0) {
        newLogs.push({
          id: 'ok',
          description: '✨ لم يتم العثور على أي بيانات تحتاج إصلاح. كل شيء سليم.',
          type: 'info',
        });
      } else {
        newLogs.unshift({
          id: 'summary',
          description: `🛠️ تم إصلاح ${fixedCount} سجل بنجاح`,
          type: 'fixed',
        });
      }

      setLogs(newLogs);
      setDone(true);
      toast.success(`تم الفحص — ${fixedCount} إصلاح`);
    } catch (err: any) {
      console.error('Data fix error:', err);
      toast.error(`فشل الفحص: ${err?.message || 'خطأ'}`);
      newLogs.push({
        id: 'err',
        description: `❌ خطأ: ${err?.message || 'خطأ غير معروف'}`,
        type: 'info',
      });
      setLogs(newLogs);
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => { setOpen(true); setLogs([]); setDone(false); }}
        className="gap-1.5 h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
      >
        <Wrench className="w-3.5 h-3.5" />
        <span>إصلاح البيانات</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[80vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-600" />
              <span>فحص وإصلاح البيانات</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 py-2">
            {!done && !running && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  سيتم فحص جميع سجلات الإيرادات وإصلاح الأخطاء التالية:
                </p>
                <ul className="list-disc pr-4 space-y-0.5">
                  <li>ملاحظات لها مبالغ (يجب أن تكون 0)</li>
                  <li>سجلات بمبلغ 0 ولها مرفقات (يجب تحويلها لملاحظات)</li>
                  <li>خدمات مصرفية بدون اسم خدمة</li>
                  <li>إيرادات نقدية مع اسم خدمة (خطأ)</li>
                  <li>أسماء فترات بصيغ خاطئة (صباحية، مسائية، ليلية)</li>
                  <li>فروقات مسجلة بدون ملاحظات</li>
                </ul>
              </div>
            )}

            {running && (
              <div className="text-center py-6">
                <Wrench className="w-8 h-8 text-amber-600 animate-pulse mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">جاري الفحص والإصلاح...</p>
              </div>
            )}

            {logs.length > 0 && (
              <ScrollArea className="h-[300px] border rounded-lg p-2 bg-muted/30">
                <div className="space-y-1">
                  {logs.map((log, idx) => (
                    <div
                      key={`${log.id}-${idx}`}
                      className={`text-[11px] p-1.5 rounded ${
                        log.type === 'fixed'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-card text-muted-foreground'
                      }`}
                    >
                      {log.description}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <DialogFooter className="gap-2">
            {!done ? (
              <Button onClick={runFix} disabled={running} className="w-full gap-2">
                {running ? 'جاري الفحص...' : (
                  <>
                    <Wrench className="w-4 h-4" />
                    بدء الفحص والإصلاح
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={() => { setOpen(false); window.location.reload(); }} className="w-full gap-2">
                <CheckCircle2 className="w-4 h-4" />
                تم — تحديث الصفحة
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DataFixButton;
