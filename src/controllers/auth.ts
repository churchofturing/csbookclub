import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import { User } from '@prisma/client';

import prisma from '../misc/db.js';
import * as strings from '../misc/strings.js';

import { generateToken } from '../misc/csrfFilter.js';
import { buildPageMetadata } from '../misc/buildPageMetadata.js';
import fivehundred from '../misc/500.js';

class ValidationError extends Error {
  constructor(public errors: string[]) {
    super('Validation failed');
  }
}

const validateLoginInput = (username: string, password: string) => {
  const errors: string[] = [];

  if (!username) errors.push(strings.USERNAME_REQUIRED);
  if (!password) errors.push(strings.PASSWORD_REQUIRED);
  if (password && (password.length < 10 || password.length > 30)) {
    errors.push(strings.PASSWORD_MIN_MAX_LEN);
  }
  if (username && (username.length <= 1 || username.length > 25)) {
    errors.push(strings.USERNAME_MIN_MAX_LEN);
  }

  if (errors.length > 0) throw new ValidationError(errors);
};

const validateRegistrationInput = async (
  username: string,
  password: string,
  confirmPassword: string,
  referralCode: string,
) => {
  const errors: string[] = [];

  if (!username) errors.push(strings.USERNAME_REQUIRED);
  if (!password) errors.push(strings.PASSWORD_REQUIRED);
  if (!confirmPassword) errors.push(strings.CONFIRMATION_REQUIRED);
  if (!referralCode) errors.push(strings.REFERRAL_REQUIRED);

  if (errors.length > 0) throw new ValidationError(errors);

  if (password !== confirmPassword) errors.push(strings.DIFFERENT_PASSWORDS);
  if (password.length < 10 || password.length > 30) {
    errors.push(strings.PASSWORD_MIN_MAX_LEN);
  }
  if (confirmPassword.length < 10 || confirmPassword.length > 30) {
    errors.push(strings.CONFIRM_PASSWORD_MIN_MAX_LEN);
  }
  if (username.length <= 1 || username.length > 25) errors.push(strings.USERNAME_MIN_MAX_LEN);

  // Check if referral code exists
  const referralCodeExists = await prisma.referralCode.findUnique({
    where: { code: referralCode, active: true },
    include: { user: true },
  });

  if (!referralCodeExists) errors.push(strings.REFERRAL_INVALID);

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({ where: { username } });
  if (existingUser) errors.push(strings.USER_EXISTS);

  if (errors.length > 0) throw new ValidationError(errors);

  return referralCodeExists;
};

const handleUserBan = async (user: User) => {
  if (!user.bannedAt) return null;

  const now = new Date();
  const bannedAt = new Date(user.bannedAt);
  const differenceInMinutes = (bannedAt.getTime() - now.getTime()) / 1000 / 60;

  if (differenceInMinutes > 0) {
    return strings.bannedFor(String(Math.ceil(differenceInMinutes)));
  }

  // Ban has expired, clear it
  await prisma.user.update({
    where: { id: user.id },
    data: { bannedAt: null },
  });

  return null;
};

const logSpecialUserLogin = async (user: User, req: Request) => {
  const auditData = {
    title: req.ip,
    body: req.ip,
    postedBy: req.ip,
    createdBy: { connect: { id: user.id } },
  };

  if (user.username === 'admin') {
    await prisma.modAudit.create({
      data: {
        ...auditData,
        reason: 'Admin has logged in.',
        action: 'ADMIN LOGIN',
      },
    });
  } else if (user.username === 'Anonymous') {
    await prisma.modAudit.create({
      data: {
        ...auditData,
        reason: 'Anonymous has logged in? What the fuck.',
        action: 'ANONYMOUS LOGIN',
      },
    });
    return strings.ANONYMOUS_LOGIN;
  }

  return null;
};

const renderLoginPage = (
  req: Request,
  res: Response,
  loginErrors: string[] = [],
  registerErrors: string[] = [],
) => {
  const loginToken = generateToken(req);

  // I need to set these or else the rate limiter doesn't work.
  if (loginErrors.length > 0) {
    res.status(401);
  } else if (registerErrors.length > 1) {
    res.status(400);
  }

  return res.render('login', {
    user: req.session.user,
    loginErrors,
    registerErrors,
    startTime: req.startTime,
    loginCsrfToken: loginToken,
    registerCsrfToken: generateToken(req),
    page: buildPageMetadata(req, 'Log in/register'),
  });
};

export const getLoginPage = async (
  req: Request,
  res: Response,
  next: NextFunction,
  loginErrors: string[] = [],
  registerErrors: string[] = [],
) => {
  return renderLoginPage(req, res, loginErrors, registerErrors);
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    validateLoginInput(username, password);

    const user = await prisma.user.findFirst({ where: { username } });
    if (!user) {
      return renderLoginPage(req, res, [strings.USER_NOT_FOUND]);
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return renderLoginPage(req, res, [strings.INCORRECT_PASSWORD]);
    }

    const banError = await handleUserBan(user);
    if (banError) {
      return renderLoginPage(req, res, [banError]);
    }

    const specialLoginError = await logSpecialUserLogin(user, req);
    if (specialLoginError) {
      return renderLoginPage(req, res, [specialLoginError]);
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    return res.redirect('/');
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(401);
      return renderLoginPage(req, res, error.errors);
    }
    return fivehundred(req, res);
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, confirmPassword, referralCode } = req.body;

    const validReferralCode = await validateRegistrationInput(
      username,
      password,
      confirmPassword,
      referralCode,
    );

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        referredBy: { connect: { id: validReferralCode?.user?.id } },
      },
    });

    await prisma.referralCode.update({
      where: { id: validReferralCode?.id },
      data: { active: false },
    });

    const auditData = {
      title: req.ip,
      body: req.ip,
      postedBy: req.ip,
      createdBy: { connect: { id: user.id } },
    };

    await prisma.modAudit.create({
      data: {
        ...auditData,
        reason: 'User has registered.',
        action: 'USER REGISTER',
      },
    });

    // We can just pass the req/res to login and it'll automatically log the user in.
    return login(req, res);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400);
      return renderLoginPage(req, res, [], error.errors);
    }
  }
};

export const logout = async (req: Request, res: Response) => {
  req.session.destroy(() => {});
  res.clearCookie(process.env.COOKIE_NAME || 'cookie.sid');
  return res.redirect('/');
};
