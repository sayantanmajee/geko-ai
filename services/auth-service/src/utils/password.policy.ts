export interface PasswordPolicy {
  minLength: number
  maxLength?: number
  requireUppercase?: boolean
  requireLowercase?: boolean
  requireNumber?: boolean
  requireSymbol?: boolean
  disallowCommonPasswords?: boolean
}

const COMMON_PASSWORDS = new Set([
  'password',
  '123456',
  'qwerty',
  'admin',
  'letmein'
])

export function validatePassword(
  password: string,
  policy: PasswordPolicy
): { ok: true } | { ok: false; reason: string } {
  if (password.length < policy.minLength) {
    return {
      ok: false,
      reason: `Password must be at least ${policy.minLength} characters`
    }
  }

  if (policy.maxLength && password.length > policy.maxLength) {
    return {
      ok: false,
      reason: `Password must be at most ${policy.maxLength} characters`
    }
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    return { ok: false, reason: 'Password must contain an uppercase letter' }
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    return { ok: false, reason: 'Password must contain a lowercase letter' }
  }

  if (policy.requireNumber && !/[0-9]/.test(password)) {
    return { ok: false, reason: 'Password must contain a number' }
  }

  if (policy.requireSymbol && !/[!@#$%^&*()_+[\]{}|;:,.<>?]/.test(password)) {
    return { ok: false, reason: 'Password must contain a symbol' }
  }

  if (policy.disallowCommonPasswords && COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { ok: false, reason: 'Password is too common' }
  }

  return { ok: true }
}
