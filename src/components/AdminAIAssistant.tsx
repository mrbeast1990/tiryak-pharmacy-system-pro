import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw, 
  Send, 
  Loader2,
  Bot,
  X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const ANALYTICS_URL = `https://qoyawkfbyocgtyxlpgnp.supabase.co/functions/v1/tiryak-analytics-ai`;

const suggestedQuestions = [
  { icon: TrendingUp, text: 'ما صافي الربح لهذا الشهر؟', color: 'text-emerald-600' },
  { icon: AlertTriangle, text: 'هل يوجد خلل في المصاريف؟', color: 'text-orange-500' },
  { icon: RefreshCw, text: 'ما الأصناف المتكررة في النواقص؟', color: 'text-blue-500' },
  { icon: BarChart3, text: 'أعطني ملخصاً مالياً شاملاً', color: 'text-purple-500' },
];

const AdminAIAssistant: React.FC = () => {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // التحقق من صلاحيات المستخدم
  const isAdmin = user?.role === 'admin' || user?.role === 'ahmad_rajili';

  // التمرير للأسفل عند إضافة رسائل جديدة
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // إعادة تعيين المحادثة عند إغلاق الـ Sheet
  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setInput('');
    }
  }, [isOpen]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(ANALYTICS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFveWF3a2ZieW9jZ3R5eGxwZ25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MTgyNTcsImV4cCI6MjA2NTQ5NDI1N30.8neVXjoVGgh-bcyL5f5FUZnRkJ4eVfaTvwvItpwmEKI`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('غير مصرح لك بالوصول إلى هذه الخدمة');
        }
        if (response.status === 429) {
          throw new Error('تم تجاوز الحد الأقصى للطلبات، يرجى المحاولة لاحقاً');
        }
        throw new Error('حدث خطأ في الاتصال');
      }

      // Stream the response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      const assistantId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

      if (reader) {
        let textBuffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantId ? { ...m, content: assistantContent } : m
                  )
                );
              }
            } catch {
              textBuffer = line + '\n' + textBuffer;
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestedQuestion = (text: string) => {
    sendMessage(text);
  };

  // لا يظهر المكون إلا للمسؤولين
  if (!isAdmin) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-20 left-4 z-50 h-14 w-14 rounded-full shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white"
          size="icon"
        >
          <BarChart3 className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent 
        side="left" 
        className="w-full sm:max-w-md p-0 flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="px-4 py-3 bg-gradient-to-l from-emerald-600 to-teal-600 text-white">
          <SheetTitle className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            مساعد الترياق التحليلي
          </SheetTitle>
        </SheetHeader>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="space-y-4">
              {/* Welcome Message */}
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-emerald-800 font-medium">
                      مرحباً! أنا مساعدك التحليلي لصيدلية الترياق الشافي. 
                    </p>
                    <p className="text-sm text-emerald-700">
                      يمكنني مساعدتك في:
                    </p>
                    <ul className="text-sm text-emerald-700 list-disc list-inside space-y-1">
                      <li>تحليل الأرباح والخسائر</li>
                      <li>كشف الخلل المالي</li>
                      <li>تحليل أنماط النواقص المتكررة</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Suggested Questions */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">اقتراحات سريعة:</p>
                <div className="grid gap-2">
                  {suggestedQuestions.map((q, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="justify-start h-auto py-3 px-4 text-right"
                      onClick={() => handleSuggestedQuestion(q.text)}
                      disabled={isLoading}
                    >
                      <q.icon className={`w-5 h-5 ml-3 shrink-0 ${q.color}`} />
                      <span className="text-sm">{q.text}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none text-foreground">
                        <ReactMarkdown>{message.content || '...'}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span className="text-sm text-muted-foreground">جاري التحليل...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="اسأل عن أي تحليل..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AdminAIAssistant;
