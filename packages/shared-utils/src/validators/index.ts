/**
 * Input Validation Functions
 * 
 * Centralized validation logic to prevent duplication
 * Used in controllers + services
 */

/**
 * Email validation
 * 
 * Simple regex for most use cases
 * More strict validation done via send test email
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Password strength validation
 * 
 * Rules:
 * - 8+ characters
 * - At least 1 uppercase
 * - At least 1 lowercase
 * - At least 1 number
 */
export function isStrongPassword(password: string): boolean {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
}

/**
 * UUID validation (PostgreSQL uuid type)
 */
export function isValidUUID(uuid: string): boolean {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

/**
 * Slug validation (for workspace URLs, etc.)
 * 
 * Allows:  lowercase, numbers, hyphens
 * Example: "my-workspace-123"
 */
export function isValidSlug(slug: string): boolean {
  const regex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  return regex.test(slug) && slug.length >= 3 && slug.length <= 63;
}

/**
 * Validate email
 * Returns validation result with message
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (! email?. trim()) {
    return { valid: false, error: 'Email is required' };
  }
  if (!isValidEmail(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  return { valid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  if (!isStrongPassword(password)) {
    return {
      valid: false,
      error: 'Password must contain uppercase, lowercase, and numbers',
    };
  }
  return { valid: true };
}