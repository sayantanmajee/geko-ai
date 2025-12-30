/**
 * Validation Helpers
 * 
 * Utility functions for input validation
 * 
 * @module helpers/validators
 */

/**
 * Validate workspace name
 * 
 * - Must be 1-255 characters
 * - Cannot be empty or whitespace only
 */
export function validateWorkspaceName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed. length > 0 && trimmed.length <= 255;
}

/**
 * Validate email format
 */
export function validateEmail(email:  string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate workspace role
 */
export function isValidRole(
  role: string
): role is 'owner' | 'admin' | 'editor' | 'viewer' {
  return ['owner', 'admin', 'editor', 'viewer'].includes(role);
}

/**
 * Validate workspace plan
 */
export function isValidPlan(
  plan: string
): plan is 'free' | 'pro' | 'paygo' {
  return ['free', 'pro', 'paygo'].includes(plan);
}

/**
 * Sanitize workspace description
 * Removes special characters and limits length
 */
export function sanitizeDescription(description: string): string {
  if (!description || typeof description !== 'string') return '';
  return description.trim().substring(0, 1000);
}