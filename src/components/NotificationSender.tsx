
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Send, Loader2 } from 'lucide-react';
import { useLanguageStore } from '@/store/languageStore';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NotificationSenderProps {
  onBack: () => void;
}

const NotificationSender: React.FC<NotificationSenderProps> = ({ onBack }) => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [recipient, setRecipient] = useState('all');
    const [isLoading, setIsLoading] = useState(false);
    const { language } = useLanguageStore();

    const handleSubmit = async () => {
        if (!title || !message) {
            toast({
                title: "خطأ",
                description: "يرجى تعبئة عنوان ونص الإشعار.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        
        const { error } = await supabase.functions.invoke('send-notification', {
            body: { title, message, recipient },
        });

        setIsLoading(false);

        if (error) {
            console.error('Error sending notification:', error);
            toast({
                title: "فشل الإرسال",
                description: "حدث خطأ أثناء إرسال الإشعار. ربما لا تملك الصلاحية الكافية.",
                variant: "destructive",
            });
        } else {
            toast({
                title: "تم الإرسال بنجاح",
                description: "تم إرسال إشعارك بنجاح.",
            });
            setTitle('');
            setMessage('');
            setRecipient('all');
        }
    };

    const roles = [
        { value: 'all', label: 'كافة المستخدمين' },
        { value: 'ahmad_rajili', label: 'أحمد الرجيلي' },
        { value: 'morning_shift', label: 'الفترة الصباحية' },
        { value: 'evening_shift', label: 'الفترة المسائية' },
        { value: 'night_shift', label: 'الفترة الليلية' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="max-w-3xl mx-auto">
                <div className="flex justify-start mb-4">
                    <Button onClick={onBack} variant="outline" className="flex items-center space-x-2 space-x-reverse">
                        <ArrowRight className="w-4 h-4" />
                        <span>العودة</span>
                    </Button>
                </div>
                <Card className="card-shadow">
                    <CardHeader>
                        <CardTitle>إرسال إشعار جديد</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="recipient">إرسال إلى</Label>
                            <Select value={recipient} onValueChange={setRecipient} dir="rtl" disabled={isLoading}>
                                <SelectTrigger id="recipient">
                                    <SelectValue placeholder="اختر المستلمين" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map(role => (
                                        <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="title">عنوان الإشعار</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="اكتب عنوان الإشعار هنا..."
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">نص الإشعار</Label>
                            <Textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="اكتب رسالتك هنا..."
                                rows={6}
                                disabled={isLoading}
                            />
                        </div>
                        <Button onClick={handleSubmit} className="w-full pharmacy-gradient text-white flex items-center space-x-2 space-x-reverse" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            <span>{isLoading ? 'جاري الإرسال...' : 'إرسال الإشعار'}</span>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default NotificationSender;
