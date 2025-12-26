export interface Conversation {
  conversationId:  string;
  workspaceId: string;
  userId: string;
  title: string;
  modelId: string;
  systemPrompt?:  string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
}

export interface Message {
  messageId: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens?:  number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface CreateConversationInput {
  title: string;
  modelId:  string;
  systemPrompt?:  string;
}

export interface SendMessageInput {
  conversationId: string;
  content: string;
  modelId: string;
}