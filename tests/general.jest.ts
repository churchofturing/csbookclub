import request from 'supertest';
import app from '../src/server.js';

const generalTests = () => {
  it('Should validate that a non-existent topic 404s.', async () => {
    const res = await request(app).get('/doesnotexist');
    expect(res.status).toBe(404);
  });

  it('Should validate that a thread with just a globalCount redirects.', async () => {
    const res = await request(app).get('/seed-1/99999');
    expect(res.status).toBe(302);
  });

  it('Should validate that a non-existent thread 404s.', async () => {
    const res = await request(app).get('/seed-1/99999/this-should-fail');
    expect(res.status).toBe(404);
  });
};

export default generalTests;
