export interface User {
  userId: string;
  tenantId: string;
  email: string;
  firstName?:  string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JWTPayload {
  userId:  string;
  tenantId:  string;
  workspaceId:  string;
  email: string;
  role: string;
  iat: number;
  exp:  number;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName?:  string;
  lastName?: string;
}

export interface LoginInput {
  email: string;
  password:  string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken:  string;
  user: User;
}