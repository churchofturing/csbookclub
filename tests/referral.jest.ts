import request from 'supertest';
import app from '../src/server.js';
import { normalUser, adminUser } from './misc/User.js';

const referralTests = () => {
  it('Should log in the admin user.', async () => {
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

    // Get a referral code.
    const referralRes = await request(app)
      .post('/api/admin/referral')
      .set('Cookie', [adminUser.cookie])
      .expect(200);

    normalUser.setReferralCode(referralRes.body.referralCode);

    const referralRes2 = await request(app)
      .post('/api/admin/referral')
      .set('Cookie', [adminUser.cookie])
      .expect(200);

    adminUser.setReferralCode(referralRes2.body.referralCode);
  });
};

export default referralTests;
