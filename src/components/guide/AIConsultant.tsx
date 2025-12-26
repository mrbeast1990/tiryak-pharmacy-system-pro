import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, User, AlertTriangle, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tiryak-ai`;

const AIConsultant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessages: Message[]) => {
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: userMessages }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'فشل في الاتصال بالمستشار الذكي');
    }

    if (!response.body) {
      throw new Error('لا توجد استجابة من الخادم');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let assistantContent = '';

    const updateAssistantMessage = (content: string) => {
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content } : m
          );
        }
        return [...prev, { role: 'assistant', content }];
      });
    };

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
            updateAssistantMessage(assistantContent);
          }
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }

    return assistantContent;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      await streamChat(newMessages);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'خطأ في المحادثة',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
      // Remove the user message if there was an error
      setMessages(messages);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    'ما هي بدائل الباراسيتامول المتوفرة؟',
    'ما هي جرعة الأموكسيسيلين للأطفال؟',
    'ما هي التعارضات الدوائية للأسبرين؟',
    'كيف أحسب جرعة الأيبوبروفين لطفل وزنه 20 كجم؟',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[400px]">
      {/* Chat Header */}
      <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-b-none">
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="w-5 h-5" />
            مستشار الترياق الذكي
            <Sparkles className="w-4 h-4 text-yellow-300" />
          </CardTitle>
          <p className="text-xs text-white/80">
            يمكنني مساعدتك في معلومات الأدوية والجرعات والبدائل المتوفرة
          </p>
        </CardHeader>
      </Card>

      {/* Chat Messages */}
      <Card className="flex-1 rounded-t-none border-t-0 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center py-6">
                <Bot className="w-12 h-12 mx-auto mb-3 text-purple-300" />
                <h3 className="font-semibold text-foreground mb-1">مرحباً! كيف يمكنني مساعدتك؟</h3>
                <p className="text-sm text-muted-foreground">
                  اسألني عن أي دواء أو جرعة أو بديل
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center">أسئلة مقترحة:</p>
                <div className="grid gap-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setInput(question);
                        inputRef.current?.focus();
                      }}
                      className="text-right text-sm p-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user'
                        ? 'bg-purple-100 text-purple-600'
                        : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={`flex-1 rounded-2xl px-4 py-2 text-sm ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white rounded-tr-sm'
                        : 'bg-muted rounded-tl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </Card>

      {/* Input Area */}
      <div className="p-3 bg-white border border-t-0 rounded-b-lg shadow-sm">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب سؤالك هنا..."
            disabled={isLoading}
            className="flex-1 border-purple-200 focus:border-purple-400"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          المعلومات المقدمة إرشادية ولا تغني عن استشارة الطبيب
        </p>
      </div>
    </div>
  );
};

export default AIConsultant;
