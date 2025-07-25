import { Request, Response, NextFunction } from 'express';

const hasRole = (role: string) => (req: Request, res: Response, next: NextFunction) => {
  if (req.session.user && req.session.user.role.split(',').includes(role)) {
    return next();
  }

  return res.redirect('/');
};

export default hasRole;
