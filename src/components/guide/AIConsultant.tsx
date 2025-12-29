import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, User, AlertTriangle, Sparkles, Plus, MessageSquare, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { useAIConversations, AIMessage } from '@/hooks/useAIConversations';
import { cn } from '@/lib/utils';

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
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFveWF3a2ZieW9jZ3R5eGxwZ25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MTgyNTcsImV4cCI6MjA2NTQ5NDI1N30.8neVXjoVGgh-bcyL5f5FUZnRkJ4eVfaTvwvItpwmEKI`,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFveWF3a2ZieW9jZ3R5eGxwZ25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MTgyNTcsImV4cCI6MjA2NTQ5NDI1N30.8neVXjoVGgh-bcyL5f5FUZnRkJ4eVfaTvwvItpwmEKI',
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
    <div className="flex h-[calc(100vh-220px)] min-h-[400px] relative">
      {/* Sidebar Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 left-2 z-20 bg-background/80 backdrop-blur-sm"
        onClick={() => setShowSidebar(!showSidebar)}
      >
        {showSidebar ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </Button>

      {/* Sidebar */}
      <div className={cn(
        "absolute inset-y-0 left-0 z-10 w-64 bg-background border-l transition-transform duration-300 flex flex-col",
        showSidebar ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-3 border-b">
          <Button 
            onClick={handleNewChat} 
            className="w-full bg-purple-600 hover:bg-purple-700"
            size="sm"
          >
            <Plus className="w-4 h-4 ml-2" />
            محادثة جديدة
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
                    currentConversation?.id === conv.id && "bg-purple-100"
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
                          <span className="text-purple-600">{conv.user_name}</span>
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
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-b-none">
          <CardHeader className="py-3 pr-12">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="w-5 h-5" />
              {currentConversation ? currentConversation.title : 'مستشار الترياق الذكي'}
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </CardTitle>
            <p className="text-xs text-white/80">
              {currentConversation 
                ? `${messages.length} رسالة` 
                : 'يمكنني مساعدتك في معلومات الأدوية والجرعات والبدائل المتوفرة'
              }
            </p>
          </CardHeader>
        </Card>

        {/* Chat Messages */}
        <Card className="flex-1 rounded-t-none border-t-0 overflow-hidden">
          <ScrollArea className="h-full p-4" ref={scrollRef}>
            {messages.length === 0 && !currentConversation ? (
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
            ) : messages.length === 0 && currentConversation ? (
              <div className="text-center py-6">
                <Bot className="w-12 h-12 mx-auto mb-3 text-purple-300" />
                <h3 className="font-semibold text-foreground mb-1">محادثة فارغة</h3>
                <p className="text-sm text-muted-foreground">
                  ابدأ بكتابة سؤالك
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={message.id || index}
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
    </div>
  );
};

export default AIConsultant;
