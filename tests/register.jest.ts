import request from 'supertest';
import app from '../src/server.js';
import { adminUser, normalUser } from './misc/User.js';
import {
  DIFFERENT_PASSWORDS,
  USERNAME_REQUIRED,
  CONFIRMATION_REQUIRED,
  PASSWORD_REQUIRED,
  USERNAME_MIN_MAX_LEN,
  PASSWORD_MIN_MAX_LEN,
  USER_EXISTS,
} from '../src/misc/strings.js';

const registerTests = () => {
  it('Should reject registering with fields missing.', async () => {
    const usernameMissing = await request(app).post('/user/register').send({
      password: normalUser.password,
      confirmPassword: 'intentionallybroken',
      referralCode: normalUser.referralCode,
    });

    expect(usernameMissing.text).toContain(USERNAME_REQUIRED);

    const passwordMissing = await request(app).post('/user/register').send({
      username: normalUser.username,
      confirmPassword: 'intentionallybroken',
      referralCode: normalUser.referralCode,
    });

    expect(passwordMissing.text).toContain(PASSWORD_REQUIRED);

    const confirmPasswordMissing = await request(app).post('/user/register').send({
      username: normalUser.username,
      password: normalUser.password,
      referralCode: normalUser.referralCode,
    });

    expect(confirmPasswordMissing.text).toContain(CONFIRMATION_REQUIRED);
  });

  it('Should reject registering with two different passwords', async () => {
    const res = await request(app).post('/user/register').send({
      username: normalUser.username,
      password: normalUser.password,
      confirmPassword: 'intentionallybroken',
      referralCode: normalUser.referralCode,
    });

    expect(res.text).toContain(DIFFERENT_PASSWORDS);
  });

  it('Should reject registering with invalid field lengths', async () => {
    const longUsername = await request(app).post('/user/register').send({
      username: 'verrrrrrrrrrryyylongusername',
      password: normalUser.password,
      confirmPassword: normalUser.password,
      referralCode: normalUser.referralCode,
    });

    expect(longUsername.text).toContain(USERNAME_MIN_MAX_LEN);

    const shortPassword = await request(app).post('/user/register').send({
      username: 'examplename',
      password: 'short',
      confirmPassword: 'short',
      referralCode: normalUser.referralCode,
    });

    expect(shortPassword.text).toContain(PASSWORD_MIN_MAX_LEN);
  });

  it('Should register and log in a new user.', async () => {
    // Example details to register user.
    const res = await request(app)
      .post('/user/register')
      .send({
        username: normalUser.username,
        password: normalUser.password,
        confirmPassword: normalUser.confirmPassword,
        referralCode: normalUser.referralCode,
      })
      .expect(302)
      .expect('Location', '/');

    // Capture session cookie
    const setCookie = res.headers['set-cookie'];

    const cookies = Array.isArray(setCookie)
      ? setCookie.pop()?.split(';')[0]
      : setCookie?.split(';')[0];

    normalUser.setCookie(cookies);

    const newRes = await request(app).get('/').set('Cookie', [normalUser.cookie]).expect(200);

    expect(newRes.text).toContain(normalUser.username);
    expect(newRes.text).toContain('Logout');
  });

  it('Should reject registering with an existing username', async () => {
    const existingUsername = await request(app).post('/user/register').send({
      username: normalUser.username,
      password: normalUser.password,
      confirmPassword: normalUser.password,
      referralCode: adminUser.referralCode,
    });

    expect(existingUsername.text).toContain(USER_EXISTS);
  });
};

export default registerTests;
