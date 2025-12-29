-- Create ai_conversations table
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'محادثة جديدة',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ai_messages table
CREATE TABLE public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_conversations

-- Users can view their own conversations
CREATE POLICY "Users can view their own conversations"
ON public.ai_conversations
FOR SELECT
USING (user_id = auth.uid());

-- Admins can view all conversations
CREATE POLICY "Admins can view all conversations"
ON public.ai_conversations
FOR SELECT
USING (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

-- Users can create their own conversations
CREATE POLICY "Users can create their own conversations"
ON public.ai_conversations
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own conversations
CREATE POLICY "Users can update their own conversations"
ON public.ai_conversations
FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own conversations
CREATE POLICY "Users can delete their own conversations"
ON public.ai_conversations
FOR DELETE
USING (user_id = auth.uid());

-- Admins can delete any conversation
CREATE POLICY "Admins can delete any conversation"
ON public.ai_conversations
FOR DELETE
USING (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

-- RLS Policies for ai_messages

-- Users can view messages from their own conversations
CREATE POLICY "Users can view messages from their conversations"
ON public.ai_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM ai_conversations 
    WHERE ai_conversations.id = ai_messages.conversation_id 
    AND ai_conversations.user_id = auth.uid()
  )
);

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
ON public.ai_messages
FOR SELECT
USING (get_my_role() = ANY (ARRAY['admin'::app_role, 'ahmad_rajili'::app_role]));

-- Users can insert messages to their own conversations
CREATE POLICY "Users can insert messages to their conversations"
ON public.ai_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ai_conversations 
    WHERE ai_conversations.id = ai_messages.conversation_id 
    AND ai_conversations.user_id = auth.uid()
  )
);

-- Create trigger to update updated_at on conversations
CREATE TRIGGER update_ai_conversations_updated_at
BEFORE UPDATE ON public.ai_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);