import type { Request, Response, NextFunction } from 'express';

const parseObject = (obj: Record<string, unknown>) => {
    if (!obj) return;
    Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
            try { obj[key] = JSON.parse(obj[key] as string); }
            catch { }
        }
    });
};

export const parseJsonFields = (req: Request, _res: Response, next: NextFunction) => {
    parseObject(req.body);
    parseObject(req.query as Record<string, unknown>);
    next();
};