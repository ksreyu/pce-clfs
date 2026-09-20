import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const ALLOWED_DEPARTMENTS = [
  'Computer Engineering',
  'Information Technology',
  'Electronics & Computer Science',
  'Electronics & Telecommunication',
  'Mechanical Engineering',
  'Automobile Engineering',
  'Applied Science and Mathematics',
  'Administration',
];

const ALLOWED_EMAIL_DOMAINS = ['@student.mes.ac.in', '@mes.ac.in'];

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').refine(
    (email) => ALLOWED_EMAIL_DOMAINS.some(domain => email.endsWith(domain)),
    { message: 'Email must be @student.mes.ac.in or @mes.ac.in' }
  ),
  studentId: z.string().regex(
    /^(FAC|20\d{2}[A-Z]{2}\d{4})$/,
    'Admission number must be in format: YYYYXX0000 (e.g., 2023PE0080) or FAC### for faculty'
  ),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Phone must be a valid 10-digit Indian number').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  department: z.enum(ALLOWED_DEPARTMENTS as [string, ...string[]], {
    errorMap: () => ({ message: 'Please select a valid department' }),
  }).optional().or(z.literal('')),
  year: z.string().optional().or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

function generateToken(userId: string, role: string): string {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN as any || '7d' }
  );
}

function sanitizeUser(user: any) {
  const { passwordHash, ...rest } = user;
  return rest;
}

// POST /register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const existingStudentId = await prisma.user.findUnique({ where: { studentId: data.studentId } });
    if (existingStudentId) {
      return res.status(400).json({ error: 'Student ID already registered' });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        studentId: data.studentId,
        phone: data.phone,
        passwordHash,
        department: data.department,
        year: data.year,
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    const token = generateToken(user.id, user.role);

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'REGISTER',
        entityType: 'USER',
        details: `User ${user.email} registered`,
      },
    });

    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id, user.role);

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entityType: 'USER',
        details: `User ${user.email} logged in`,
      },
    });

    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const data = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    // Generate a short-lived reset token (1 hour)
    const resetToken = jwt.sign(
      { userId: user.id, purpose: 'password-reset' },
      process.env.JWT_SECRET!,
      { expiresIn: 3600 }
    );

    // In production, you'd send an email with this token
    // For demo purposes, we'll log it and return it
    console.log(`Password reset token for ${user.email}: ${resetToken}`);

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'FORGOT_PASSWORD',
        entityType: 'User',
        entityId: user.id,
        details: `Password reset requested for ${user.email}`,
      },
    });

    res.json({ message: 'If the email exists, a reset link has been sent', resetToken });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const data = resetPasswordSchema.parse(req.body);

    // Verify the reset token
    let decoded: { userId: string; purpose: string };
    try {
      decoded = jwt.verify(data.token, process.env.JWT_SECRET!) as { userId: string; purpose: string };
    } catch {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'RESET_PASSWORD',
        entityType: 'User',
        entityId: user.id,
        details: `Password reset completed for ${user.email}`,
      },
    });

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, department, year } = req.body;

    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(department !== undefined && { department }),
        ...(year !== undefined && { year }),
      },
    });

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /change-password
router.put('/change-password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 10);

    await prisma.user.update({
      where: { id: req.userId! },
      data: { passwordHash },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
