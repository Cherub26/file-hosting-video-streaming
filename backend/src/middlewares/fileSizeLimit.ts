import { Request, Response, NextFunction } from 'express';

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "524288000", 10); // 500MB default

export function fileSizeLimit(req: Request, res: Response, next: NextFunction) {
  if (req.file && req.file.size > MAX_FILE_SIZE) {
    return res.status(413).json({ error: `File too large. Max size is ${MAX_FILE_SIZE} bytes.` });
  }
  next();
} 