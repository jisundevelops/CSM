import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authRepository } from './auth.repository';
import { RegisterInput, LoginInput, AuthResponse } from './auth.types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const authService = {
  register: async (data: RegisterInput): Promise<AuthResponse> => {
    const existingUser = await authRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await authRepository.createUserWithOrg(
      data.email,
      passwordHash,
      data.orgName
    );

    const token = jwt.sign(
      { id: user.id, organizationId: user.organizationId, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { token, user };
  },

  login: async (data: LoginInput): Promise<AuthResponse> => {
    const user = await authRepository.findUserByEmail(data.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign(
      { id: user.id, organizationId: user.organizationId, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash, ...safeUser } = user;

    return { token, user: safeUser };
  }
};