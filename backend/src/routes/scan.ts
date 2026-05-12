import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { lookupHash, scanUrl as vtScanUrl } from '../services/virustotal';
import { submitUrlScan, getUrlScanResult } from '../services/urlscan';
import { scanFile } from '../services/clamav';
import { prisma } from '../db/prisma';

const router = Router();
const upload = multer({ dest: path.join(__dirname, '../../uploads/') });

function getVerdict(score: number): 'CLEAN' | 'SUSPICIOUS' | 'MALICIOUS' | 'CRITICAL' {
  if (score === 0) return 'CLEAN';
  if (score < 10) return 'SUSPICIOUS';
  if (score < 50) return 'MALICIOUS';
  return 'CRITICAL';
}

// POST /api/scan/file — ClamAV file scan
router.post('/file', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const result = await scanFile(req.file.path);
    const verdict = result.clean ? 'CLEAN' : 'MALICIOUS';

    await prisma.scanResult.create({
      data: {
        type: 'FILE',
        target: req.file.originalname,
        verdict: verdict as any,
        score: result.clean ? 0 : 100,
        metadata: { virus: result.virus, raw: result.raw },
      },
    });

    return res.json({
      file: req.file.originalname,
      clean: result.clean,
      virus: result.virus,
      verdict,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/scan/url — URLScan.io scan
router.post('/url', async (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    const submission = await submitUrlScan(url);
    const result = await getUrlScanResult(submission.uuid);
    const score = result.score || 0;
    const verdict = getVerdict(score);

    await prisma.scanResult.create({
      data: {
        type: 'URL',
        target: url,
        verdict: verdict as any,
        score,
        metadata: result,
      },
    });

    return res.json({ ...result, verdict });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/scan/hash — VirusTotal hash lookup
router.post('/hash', async (req: Request, res: Response) => {
  const { hash } = req.body;
  if (!hash) return res.status(400).json({ error: 'Hash required' });

  try {
    const result = await lookupHash(hash);
    const verdict = getVerdict(result.score);

    await prisma.scanResult.create({
      data: {
        type: 'HASH',
        target: hash,
        verdict: verdict as any,
        score: result.score,
        engineCount: result.total,
        positives: result.malicious,
        metadata: result,
      },
    });

    return res.json({ ...result, verdict });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/scan/history — recent scans
router.get('/history', async (_req: Request, res: Response) => {
  const results = await prisma.scanResult.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return res.json(results);
});

export default router;
