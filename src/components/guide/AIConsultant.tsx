import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, User, AlertTriangle, Sparkles, Plus, MessageSquare, Trash2, Menu, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { useAIConversations, AIMessage } from '@/hooks/useAIConversations';
import { cn } from '@/lib/utils';
import AIMessageRenderer from './AIMessageRenderer';

const SUPABASE_URL = 'https://qoyawkfbyocgtyxlpgnp.supabase.co';
const CHAT_URL = `${SUPABASE_URL}/functions/v1/tiryak-ai`;

const AIConsultant: React.FC = () => {
  const {
    conversations,
    currentConversation,
    messages,
    isAdmin,
    setMessages,
    selectConversation,
    createConversation,
    startNewChat,
    addMessage,
    updateLastAssistantMessage,
    saveAssistantMessage,
    deleteConversation,
  } = useAIConversations();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessages: { role: string; content: string }[]) => {
    const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFveWF3a2ZieW9jZ3R5eGxwZ25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MTgyNTcsImV4cCI6MjA2NTQ5NDI1N30.8neVXjoVGgh-bcyL5f5FUZnRkJ4eVfaTvwvItpwmEKI';
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY,
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

    return assistantContent;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userContent = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Create conversation if none exists
      let convId = currentConversation?.id;
      if (!convId) {
        const newConv = await createConversation();
        if (!newConv) {
          setIsLoading(false);
          return;
        }
        convId = newConv.id;
      }

      // Add user message
      await addMessage('user', userContent, convId);

      // Get all messages for context
      const allMessages = [...messages, { role: 'user' as const, content: userContent }];
      const chatMessages = allMessages.map(m => ({ role: m.role, content: m.content }));

      // Stream AI response
      const assistantContent = await streamChat(chatMessages);
      
      // Save assistant message
      if (assistantContent) {
        await saveAssistantMessage(assistantContent);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'خطأ في المحادثة',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
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

  const handleNewChat = () => {
    startNewChat();
    setShowSidebar(false);
  };

  const suggestedQuestions = [
    'ما هي بدائل الباراسيتامول المتوفرة؟',
    'ما هي جرعة الأموكسيسيلين للأطفال؟',
    'ما هي التعارضات الدوائية للأسبرين؟',
    'كيف أحسب جرعة الأيبوبروفين لطفل وزنه 20 كجم؟',
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    return date.toLocaleDateString('ar-SA');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-90px)] min-h-[400px] w-full overflow-hidden">
      {/* Mobile Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 right-0 z-40 w-72 bg-background border-r shadow-xl transition-transform duration-300 flex flex-col",
        "md:relative md:translate-x-0 md:w-64 md:shadow-none md:z-0",
        showSidebar ? "translate-x-0" : "translate-x-full md:hidden"
      )}>
        {/* Sidebar Header */}
        <div className="p-2 border-b flex items-center justify-between">
          <Button 
            onClick={handleNewChat} 
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            size="sm"
          >
            <Plus className="w-4 h-4 ml-2" />
            محادثة جديدة
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 md:hidden"
            onClick={() => setShowSidebar(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                لا توجد محادثات سابقة
              </p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    "group flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors",
                    currentConversation?.id === conv.id && "bg-emerald-100"
                  )}
                  onClick={() => {
                    selectConversation(conv);
                    setShowSidebar(false);
                  }}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{conv.title}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>{formatDate(conv.updated_at)}</span>
                      {isAdmin && conv.user_name && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600">{conv.user_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col w-full min-w-0 overflow-hidden">
        {/* Compact Chat Header */}
        <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 rounded-b-none flex-shrink-0">
          <CardHeader className="py-1.5 px-2">
            <div className="flex items-center gap-2">
              {/* Sidebar Toggle Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-white/20 flex-shrink-0"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <Menu className="w-4 h-4" />
              </Button>
              
              {/* Title */}
              <CardTitle className="text-sm flex items-center gap-1.5 flex-1 min-w-0">
                <Bot className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  {currentConversation ? currentConversation.title : 'مستشار الترياق'}
                </span>
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 flex-shrink-0" />
              </CardTitle>
            </div>
          </CardHeader>
        </Card>

        {/* Chat Messages - Flex Grow */}
        <Card className="flex-1 rounded-t-none border-t-0 overflow-hidden">
          <ScrollArea className="h-full px-2 py-3" ref={scrollRef}>
            {messages.length === 0 && !currentConversation ? (
              <div className="space-y-3 px-1">
                <div className="text-center py-4">
                  <Bot className="w-10 h-10 mx-auto mb-2 text-emerald-300" />
                  <h3 className="font-semibold text-foreground text-sm mb-0.5">مرحباً! كيف يمكنني مساعدتك؟</h3>
                  <p className="text-xs text-muted-foreground">
                    اسألني عن أي دواء أو جرعة أو بديل
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground text-center">أسئلة مقترحة:</p>
                  <div className="grid gap-1.5">
                    {suggestedQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setInput(question);
                          inputRef.current?.focus();
                        }}
                        className="text-right text-xs p-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : messages.length === 0 && currentConversation ? (
              <div className="text-center py-4 px-1">
                <Bot className="w-10 h-10 mx-auto mb-2 text-emerald-300" />
                <h3 className="font-semibold text-foreground text-sm mb-0.5">محادثة فارغة</h3>
                <p className="text-xs text-muted-foreground">
                  ابدأ بكتابة سؤالك
                </p>
              </div>
            ) : (
              <div className="space-y-3 px-1">
                {messages.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`flex gap-2 ${
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user'
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      ) : (
                        <Bot className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      )}
                    </div>
                    <div
                      className={`max-w-[88%] sm:max-w-[85%] rounded-2xl px-2.5 py-2 sm:px-3 sm:py-2.5 ${
                        message.role === 'user'
                          ? 'bg-emerald-600 text-white rounded-tr-sm text-sm'
                          : 'bg-muted rounded-tl-sm'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      ) : (
                        <AIMessageRenderer content={message.content} />
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Compact Input Area */}
        <div className="p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] bg-white border border-t-0 rounded-b-lg shadow-sm flex-shrink-0">
          <div className="flex gap-1.5">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب سؤالك..."
              disabled={isLoading}
              className="flex-1 h-9 text-sm border-emerald-200 focus:border-emerald-400"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 flex-shrink-0 h-9 w-9 p-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-[9px] text-muted-foreground text-center mt-1 opacity-70">
            ⚠️ إرشادي فقط - استشر الطبيب
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIConsultant;
