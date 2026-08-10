import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';
import { getJwtExpiresIn, getJwtSecret } from './env';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (user: IUser): string => {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: getJwtExpiresIn()
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, getJwtSecret()) as TokenPayload;
};

export const generateRefreshToken = (user: IUser): string => {
  const payload = {
    userId: user._id.toString(),
    type: 'refresh'
  };

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: '30d'
  } as jwt.SignOptions);
};
