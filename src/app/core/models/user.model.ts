export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  jwt: string;           // backend field name
  refreshToken: string;
  userId: number;
  username: string;
  email: string;
  role: string;
  status: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  message: string;
  username: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface UpdateProfileRequest {
  username: string;
  email: string;
}

export interface JwtValidationResponse {
  userId: number;
  username: string;
  role: string;
  valid: boolean;
}
