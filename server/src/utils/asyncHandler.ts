import type { Response, NextFunction, Request } from "express";

type TAsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void | Response>;

const asyncHandler = (func: TAsyncHandler) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await func(req, res, next);
        } catch (error) {
            next(error);
        }
    };
};

export default asyncHandler;