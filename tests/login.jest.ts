import request from 'supertest';
import app from '../src/server.js';
import { normalUser, adminUser } from './misc/User.js';
import {
  USERNAME_REQUIRED,
  PASSWORD_REQUIRED,
  USER_NOT_FOUND,
  INCORRECT_PASSWORD,
} from '../src/misc/strings.js';

const loginTests = () => {
  it('Should validate login fields exist.', async () => {
    const usernameRequired = await request(app).post('/user/login').send({
      password: normalUser.password,
    });

    expect(usernameRequired.text).toContain(USERNAME_REQUIRED);

    const passwordRequired = await request(app).post('/user/login').send({
      username: normalUser.username,
    });

    expect(passwordRequired.text).toContain(PASSWORD_REQUIRED);
  });

  it('Should validate user exists.', async () => {
    const nonExistantUser = await request(app).post('/user/login').send({
      username: 'non-existant',
      password: normalUser.password,
    });

    expect(nonExistantUser.text).toContain(USER_NOT_FOUND);
  });

  it('Should validate the password is correct.', async () => {
    const incorrectPassword = await request(app).post('/user/login').send({
      username: normalUser.username,
      password: 'Intentionally_wrong',
    });

    expect(incorrectPassword.text).toContain(INCORRECT_PASSWORD);
  });

  it('Should log out a currently logged in user.', async () => {
    // Log the user out.
    await request(app)
      .post('/user/logout')
      .set('Cookie', [normalUser.cookie])
      .expect(302)
      .expect('Location', '/');

    // Make sure they're logged out.
    const newRes = await request(app).get('/').set('Cookie', [normalUser.cookie]).expect(200);

    expect(newRes.text).not.toContain(normalUser.username);
  });

  it('Should log in a currently registered user.', async () => {
    // Log the user in.
    const res = await request(app)
      .post('/user/login')
      .send({
        username: normalUser.username,
        password: normalUser.password,
      })
      .expect(302)
      .expect('Location', '/');

    const setCookie = res.headers['set-cookie'];

    const cookies = Array.isArray(setCookie)
      ? setCookie.pop()?.split(';')[0]
      : setCookie?.split(';')[0];

    normalUser.setCookie(cookies);

    // Make sure they're logged in.
    const newRes = await request(app).get('/').set('Cookie', [normalUser.cookie]).expect(200);

    expect(newRes.text).toContain(normalUser.username);
  });

  it('Should log in the admin user.', async () => {
    // Log the user in.
    const res = await request(app).post('/user/login').send({
      username: adminUser.username,
      password: adminUser.password,
    });

    const setCookie = res.headers['set-cookie'];

    const cookies = Array.isArray(setCookie)
      ? setCookie.pop()?.split(';')[0]
      : setCookie?.split(';')[0];

    adminUser.setCookie(cookies);

    // Make sure they're logged in.
    const newRes = await request(app).get('/').set('Cookie', [adminUser.cookie]).expect(200);

    expect(newRes.text).toContain(adminUser.username);
  });
};

export default loginTests;
