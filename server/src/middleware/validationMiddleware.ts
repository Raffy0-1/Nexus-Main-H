import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';

export const validateRequest = (schema: z.ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Clean request body using sanitize-html before validation
      const sanitizedBody: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(req.body)) {
        if (typeof value === 'string') {
          sanitizedBody[key] = sanitizeHtml(value, {
            allowedTags: [], // Strip all HTML
            allowedAttributes: {}
          });
        } else {
          sanitizedBody[key] = value;
        }
      }
      
      req.body = sanitizedBody;
      
      // Validate schema
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation failed', errors: error.issues });
      } else {
        res.status(500).json({ message: 'Server validation error' });
      }
    }
  };
};

// Common schemas
export const registerSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['investor', 'entrepreneur'])
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const updateProfileSchema = z.object({
  bio: z.string().optional(),
  title: z.string().optional(),
  company: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  location: z.string().optional(),
  socialLinks: z.any().optional(),
  preferences: z.any().optional(),
  history: z.string().optional()
});

export const paymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).optional()
});
