export interface RegisterInput {
  email: string;
  password: string;
  orgName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
  };
}