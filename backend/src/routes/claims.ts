import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import { z } from 'zod';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only image or PDF files are allowed'));
  }
});

const router = Router();

const createClaimSchema = z.object({
  itemId: z.string().min(1),
  explanation: z.string().min(10),
  lostDate: z.string().optional(),
  lostLocation: z.string().optional(),
  identifyingDetails: z.string().min(5),
  proofUrl: z.string().optional(),
});

const updateClaimStatusSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED']),
  reviewComment: z.string().optional(),
});

const requireAdmin = (req: AuthRequest, res: Response, next: Function) => {
  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

router.post('/', authenticate, upload.single('proof'), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createClaimSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const { itemId, explanation, lostDate, lostLocation, identifyingDetails } = parsed.data;

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.reportedById === req.userId) {
      return res.status(400).json({ error: 'You cannot claim your own reported item' });
    }

    const existingClaim = await prisma.claim.findFirst({
      where: {
        claimantId: req.userId!,
        itemId,
        status: { in: ['PENDING', 'UNDER_REVIEW'] },
      },
    });
    if (existingClaim) {
      return res.status(400).json({ error: 'You already have an active claim for this item' });
    }

    const proofUrl = req.file ? `/uploads/${req.file.filename}` : parsed.data.proofUrl;

    const claim = await prisma.claim.create({
      data: {
        claimantId: req.userId!,
        itemId,
        explanation,
        lostDate: lostDate ? new Date(lostDate) : undefined,
        lostLocation,
        identifyingDetails,
        proofUrl,
        status: 'PENDING',
      },
    });

    if (item.type === 'FOUND') {
      await prisma.item.update({
        where: { id: itemId },
        data: { status: 'CLAIMED' },
      });
    }

    await prisma.notification.create({
      data: {
        userId: item.reportedById,
        title: 'New Claim Submitted',
        message: 'Someone has submitted a claim on your found item',
        type: 'CLAIM_RECEIVED',
        relatedItemId: item.id,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'SUBMIT_CLAIM',
        entityType: 'Claim',
        entityId: claim.id,
        details: `Submitted claim for item: ${item.name} (${item.itemCode})`,
      },
    });

    const claimWithItem = await prisma.claim.findUnique({
      where: { id: claim.id },
      include: {
        item: {
          select: { id: true, itemCode: true, name: true, category: true, imageUrl: true, status: true },
        },
      },
    });

    res.status(201).json(claimWithItem);
  } catch (error) {
    console.error('Submit claim error:', error);
    res.status(500).json({ error: 'Failed to submit claim' });
  }
});

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const [claims, total] = await Promise.all([
      prisma.claim.findMany({
        where: { claimantId: req.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          item: {
            select: { id: true, itemCode: true, name: true, category: true, imageUrl: true, status: true },
          },
          reviewedBy: {
            select: { name: true },
          },
        },
      }),
      prisma.claim.count({ where: { claimantId: req.userId } }),
    ]);

    res.json({
      claims,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get user claims error:', error);
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

router.get('/all', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;
    const { status, search } = req.query;

    const where: any = {};

    if (status) {
      where.status = status as string;
    }

    if (search) {
      where.OR = [
        { item: { name: { contains: search as string } } },
        { claimant: { name: { contains: search as string } } },
      ];
    }

    const [claims, total] = await Promise.all([
      prisma.claim.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          item: {
            select: { id: true, itemCode: true, name: true, category: true, imageUrl: true, status: true, type: true },
          },
          claimant: {
            select: { id: true, name: true, email: true, studentId: true, department: true },
          },
          reviewedBy: {
            select: { name: true },
          },
        },
      }),
      prisma.claim.count({ where }),
    ]);

    res.json({
      claims,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get all claims error:', error);
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
        item: true,
        claimant: {
          select: { id: true, name: true, email: true, studentId: true, department: true, phone: true },
        },
        reviewedBy: {
          select: { name: true },
        },
      },
    });

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    if (claim.claimantId !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to view this claim' });
    }

    if (claim.claimantId !== req.userId) {
      const { phone, ...claimantPublic } = claim.claimant;
      return res.json({ ...claim, claimant: claimantPublic });
    }

    res.json(claim);
  } catch (error) {
    console.error('Get claim error:', error);
    res.status(500).json({ error: 'Failed to fetch claim' });
  }
});

router.patch('/:id/status', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const parsed = updateClaimStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const { status, reviewComment } = parsed.data;

    const claim = await prisma.claim.findUnique({
      where: { id },
      include: { item: true },
    });
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    const updatedClaim = await prisma.claim.update({
      where: { id },
      data: {
        status,
        reviewComment,
        reviewedById: req.userId,
      },
      include: {
        item: {
          select: { id: true, itemCode: true, name: true, category: true, imageUrl: true, status: true },
        },
        claimant: {
          select: { id: true, name: true, email: true, studentId: true, department: true },
        },
        reviewedBy: {
          select: { name: true },
        },
      },
    });

    let notificationMessage = '';
    let notificationType = 'CLAIM_UPDATE';

    switch (status) {
      case 'APPROVED':
        notificationMessage = 'Your claim has been approved!';
        notificationType = 'CLAIM_APPROVED';
        await prisma.item.update({
          where: { id: claim.itemId },
          data: { status: 'VERIFIED' },
        });
        break;
      case 'REJECTED':
        notificationMessage = `Your claim has been rejected${reviewComment ? `: ${reviewComment}` : ''}`;
        notificationType = 'CLAIM_REJECTED';
        break;
      case 'UNDER_REVIEW':
        notificationMessage = 'Your claim is under review';
        notificationType = 'CLAIM_UNDER_REVIEW';
        break;
      case 'COMPLETED':
        notificationMessage = 'Claim completed - item has been handed over';
        notificationType = 'CLAIM_COMPLETED';
        await prisma.item.update({
          where: { id: claim.itemId },
          data: { status: 'RECOVERED' },
        });
        break;
    }

    await prisma.notification.create({
      data: {
        userId: claim.claimantId,
        title: 'Claim Status Updated',
        message: notificationMessage,
        type: notificationType,
        relatedItemId: claim.itemId,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'UPDATE_CLAIM_STATUS',
        entityType: 'Claim',
        entityId: id,
        details: `Claim status changed from ${claim.status} to ${status} for item: ${claim.item.name} (${claim.item.itemCode})`,
      },
    });

    res.json(updatedClaim);
  } catch (error) {
    console.error('Update claim status error:', error);
    res.status(500).json({ error: 'Failed to update claim status' });
  }
});

export default router;
