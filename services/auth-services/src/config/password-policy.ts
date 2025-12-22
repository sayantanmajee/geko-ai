import { PasswordPolicy } from "../utils/password.policy";

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
    minLength: 5,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSymbol: false,
    disallowCommonPasswords: true
}