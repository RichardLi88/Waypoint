import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: string;
    role?: string;
  }
}

const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.sendStatus(401);
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, `${process.env.JWT_ACCESS_SECRET}`, (err, decoded) => {
    if (err) {
      return res.sendStatus(403);
    }
    const decodedPayload = decoded as jwt.JwtPayload;
    req.user = decodedPayload.user;
    req.role = decodedPayload.role;
    next();
  });
};

export default verifyJWT;
