import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/hooks/use-toast';

export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export const useAIConversations = () => {
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<AIConversation | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();

  const isAdmin = user?.role === 'admin' || user?.role === 'ahmad_rajili';

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    try {
      let query = supabase
        .from('ai_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // If admin, fetch user names
      if (isAdmin && data && data.length > 0) {
        const userIds = [...new Set(data.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);
        
        setConversations(data.map(conv => ({
          ...conv,
          user_name: profileMap.get(conv.user_id) || 'غير معروف'
        })));
      } else {
        setConversations(data || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, [isAdmin]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as AIMessage[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  }, []);

  // Select a conversation
  const selectConversation = useCallback(async (conversation: AIConversation) => {
    setCurrentConversation(conversation);
    await fetchMessages(conversation.id);
  }, [fetchMessages]);

  // Create new conversation
  const createConversation = useCallback(async (): Promise<AIConversation | null> => {
    // التحقق من جلسة Supabase الحقيقية
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      toast({
        title: 'خطأ',
        description: 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: session.user.id, // استخدام ID الجلسة الحقيقية
          title: 'محادثة جديدة'
        })
        .select()
        .single();

      if (error) throw error;

      const newConv = data as AIConversation;
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversation(newConv);
      setMessages([]);
      
      return newConv;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء محادثة جديدة',
        variant: 'destructive',
      });
      return null;
    }
  }, []);

  // Start new chat (clear current and prepare for new)
  const startNewChat = useCallback(() => {
    setCurrentConversation(null);
    setMessages([]);
  }, []);

  // Add message to current conversation
  const addMessage = useCallback(async (
    role: 'user' | 'assistant',
    content: string,
    conversationId?: string
  ): Promise<AIMessage | null> => {
    const convId = conversationId || currentConversation?.id;
    if (!convId) return null;

    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: convId,
          role,
          content
        })
        .select()
        .single();

      if (error) throw error;

      const newMessage = data as AIMessage;
      setMessages(prev => [...prev, newMessage]);

      // Update conversation title if it's the first user message
      if (role === 'user' && messages.length === 0) {
        const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
        await supabase
          .from('ai_conversations')
          .update({ title, updated_at: new Date().toISOString() })
          .eq('id', convId);
        
        setConversations(prev => 
          prev.map(c => c.id === convId ? { ...c, title } : c)
        );
        if (currentConversation?.id === convId) {
          setCurrentConversation(prev => prev ? { ...prev, title } : null);
        }
      } else {
        // Just update the updated_at timestamp
        await supabase
          .from('ai_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', convId);
      }

      return newMessage;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }, [currentConversation?.id, messages.length]);

  // Update last assistant message (for streaming)
  const updateLastAssistantMessage = useCallback((content: string) => {
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last?.role === 'assistant') {
        return prev.map((m, i) => 
          i === prev.length - 1 ? { ...m, content } : m
        );
      }
      return [...prev, { 
        id: 'temp-' + Date.now(), 
        conversation_id: currentConversation?.id || '', 
        role: 'assistant' as const, 
        content, 
        created_at: new Date().toISOString() 
      }];
    });
  }, [currentConversation?.id]);

  // Save final assistant message
  const saveAssistantMessage = useCallback(async (content: string) => {
    if (!currentConversation?.id) return;

    // Remove temp message and add real one
    setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
    
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: currentConversation.id,
          role: 'assistant',
          content
        })
        .select()
        .single();

      if (error) throw error;
      
      setMessages(prev => [...prev.filter(m => !m.id.startsWith('temp-')), data as AIMessage]);
    } catch (error) {
      console.error('Error saving assistant message:', error);
    }
  }, [currentConversation?.id]);

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }

      toast({
        title: 'تم الحذف',
        description: 'تم حذف المحادثة بنجاح',
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حذف المحادثة',
        variant: 'destructive',
      });
    }
  }, [currentConversation?.id]);

  // Initial fetch
  useEffect(() => {
    if (user?.id) {
      fetchConversations();
    }
  }, [user?.id, fetchConversations]);

  return {
    conversations,
    currentConversation,
    messages,
    isLoading,
    isAdmin,
    setMessages,
    fetchConversations,
    selectConversation,
    createConversation,
    startNewChat,
    addMessage,
    updateLastAssistantMessage,
    saveAssistantMessage,
    deleteConversation,
  };
};
