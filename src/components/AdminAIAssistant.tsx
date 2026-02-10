import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/integrations/supabase/client';
import { useAIConversations, AIConversation } from '@/hooks/useAIConversations';
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
  Send, 
  Loader2,
  Bot,
  ArrowRight,
  Plus,
  Trash2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ANALYTICS_URL = `https://qoyawkfbyocgtyxlpgnp.supabase.co/functions/v1/tiryak-analytics-ai`;

const AdminAIAssistant: React.FC = () => {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    conversations,
    currentConversation,
    messages,
    fetchConversations,
    selectConversation,
    createConversation,
    startNewChat,
    addMessage,
    updateLastAssistantMessage,
    saveAssistantMessage,
    deleteConversation,
  } = useAIConversations();

  const isAdmin = user?.role === 'admin' || user?.role === 'ahmad_rajili';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen, fetchConversations]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    setInput('');
    setIsLoading(true);

    try {
      // Create conversation if none exists
      let convId = currentConversation?.id;
      if (!convId) {
        const newConv = await createConversation();
        if (!newConv) { setIsLoading(false); return; }
        convId = newConv.id;
      }

      // Save user message
      await addMessage('user', messageText.trim(), convId);

      // Build messages for API
      const apiMessages = [...messages, { role: 'user' as const, content: messageText.trim() }]
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch(ANALYTICS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        if (response.status === 403) throw new Error('غير مصرح لك بالوصول');
        if (response.status === 429) throw new Error('تم تجاوز الحد الأقصى للطلبات');
        throw new Error('حدث خطأ في الاتصال');
      }

      // Stream response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      updateLastAssistantMessage('');

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
                updateLastAssistantMessage(assistantContent);
              }
            } catch {
              textBuffer = line + '\n' + textBuffer;
              break;
            }
          }
        }
      }

      // Save final assistant message
      if (assistantContent) {
        await saveAssistantMessage(assistantContent);
      }
    } catch (error) {
      console.error('Error:', error);
      updateLastAssistantMessage(error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleNewChat = () => {
    startNewChat();
    setShowSessions(false);
  };

  const handleSelectConversation = async (conv: AIConversation) => {
    await selectConversation(conv);
    setShowSessions(false);
  };

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

      <SheetContent side="left" className="w-full sm:max-w-md p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-4 py-3 bg-gradient-to-l from-emerald-600 to-teal-600 text-white">
          <SheetTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              مساعد الترياق التحليلي
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 h-8 w-8">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </SheetTitle>
        </SheetHeader>

        {/* Sessions Bar */}
        <div className="border-b bg-muted/30 px-4 py-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleNewChat} className="h-7 text-xs flex-shrink-0">
              <Plus className="w-3 h-3 ml-1" />
              جديدة
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSessions(!showSessions)}
              className="h-7 text-xs flex-1 justify-between"
            >
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {currentConversation ? currentConversation.title : 'محادثة جديدة'}
              </span>
              {showSessions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          </div>

          {/* Sessions List */}
          {showSessions && (
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
              {conversations.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">لا توجد محادثات سابقة</p>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv.id}
                    className={`flex items-center justify-between rounded-md px-2 py-1.5 text-xs cursor-pointer hover:bg-muted ${
                      currentConversation?.id === conv.id ? 'bg-muted border border-border' : ''
                    }`}
                    onClick={() => handleSelectConversation(conv)}
                  >
                    <span className="truncate flex-1">{conv.title}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm text-emerald-800 font-medium">
                  مرحباً! أنا مساعدك التحليلي لصيدلية الترياق. اسألني عن أي تحليل مالي أو إحصائي.
                </p>
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
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AdminAIAssistant;
