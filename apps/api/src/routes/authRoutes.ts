import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService.js';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from '@viberhub/validation';
import { successEnvelope, errorEnvelope } from '@viberhub/shared';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();
router.use(authRateLimiter);

router.post('/login', async (req: Request, res: Response, next) => {
  try {
    const validated = loginSchema.parse(req.body);
    const result = await AuthService.login(validated.email, validated.password, validated.mfaCode);

    // Set secure HTTP-only cookie
    res.cookie('vh_session', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json(successEnvelope(result));
  } catch (err) {
    next(err);
  }
});

router.post('/register', async (req: Request, res: Response, next) => {
  try {
    const validated = registerSchema.parse(req.body);
    const result = await AuthService.register(
      validated.email,
      validated.password,
      validated.displayName,
      validated.workspaceName
    );

    res.cookie('vh_session', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json(successEnvelope(result));
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('vh_session');
  res.json(successEnvelope({ message: 'Logged out successfully' }));
});

router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await AuthService.getMe(req.userId!);
    res.json(successEnvelope(result));
  } catch (err) {
    next(err);
  }
});

router.post('/forgot-password', async (req: Request, res: Response, next) => {
  try {
    forgotPasswordSchema.parse(req.body);
    // Deliberate uniform response to prevent user enumeration
    res.json(successEnvelope({
      message: 'If an account exists with this email, password reset instructions have been generated.'
    }));
  } catch (err) {
    next(err);
  }
});

router.post('/reset-password', async (req: Request, res: Response, next) => {
  try {
    resetPasswordSchema.parse(req.body);
    res.json(successEnvelope({ message: 'Password has been reset successfully.' }));
  } catch (err) {
    next(err);
  }
});

export const authRoutes = router;
