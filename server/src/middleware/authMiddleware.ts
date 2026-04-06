import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
         res.status(401).json({ message: 'Not authorized, user not found' });
         return;
      }
      (req as AuthRequest).user = user;
      return next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
      return;
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
    return;
  }
};

export const roleCheck = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    if (!authReq.user || !roles.includes(authReq.user.role)) {
      res.status(403).json({ message: `Role ${authReq.user?.role} is not authorized to access this route` });
      return;
    }
    next();
  };
};
