/**
 * Conversation Management
 * 
 * Conversation:  Thread between user and AI
 * Message: Individual message in conversation
 * 
 * Stored in MongoDB (via LibreChat)
 */

import type { UUID, Timestamp } from './common';

/**
 * Conversation (thread)
 */
export interface Conversation {
  conversationId:  string;
  workspaceId: string;
  userId: string;
  
  title: string;
  modelId: string;
  systemPrompt?:  string;
  
  messageCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessageAt?: Timestamp;
}

/**
 * Individual message
 */
export interface Message {
  messageId: string;
  conversationId: string;
  userId: string;
  
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens?:  number;
  
  createdAt: Timestamp;
}

/**
 * Create conversation request
 */
export interface CreateConversationInput {
  title: string;
  modelId:  string;
  systemPrompt?:  string;
}

/**
 * Send message request
 */
export interface SendMessageInput {
  conversationId: string;
  content: string;
}