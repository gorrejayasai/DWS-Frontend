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

// Refresh endpoint returns a different shape than login — note the field is
// `accessToken` here, not `jwt`. Keep this separate from LoginResponse so the
// type system catches the mismatch.
export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
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
