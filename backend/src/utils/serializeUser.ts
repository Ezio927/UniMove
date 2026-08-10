import { IUser } from '../models/User';

type PublicUser = Pick<IUser, 'username' | 'email' | 'avatar' | 'phone' | 'role'> & {
  id: IUser['_id'];
  createdAt?: Date;
};

export const serializeUser = (user: IUser, includeCreatedAt = false): PublicUser => ({
  id: user._id,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
  phone: user.phone,
  role: user.role,
  ...(includeCreatedAt ? { createdAt: user.createdAt } : {})
});
