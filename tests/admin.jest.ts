import request from 'supertest';
import app from '../src/server.js';
import { adminUser, normalUser } from './misc/User.js';
import { topicSlug } from './misc/values.js';

const adminTests = () => {
  it('Should validate that non-admin cannot access the admin page.', async () => {
    const res = await request(app).get('/admin');
    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/');
  });

  it('Should validate that an admin can access the admin page.', async () => {
    const res = await request(app).get('/admin').set('Cookie', [adminUser.cookie]);
    expect(res.status).toBe(200);
  });

  it('Should validate that a non admin cannot ban a user.', async () => {
    const res = await request(app).delete('/api/admin/user/1?days=30&reason=off topic');
    expect(res.status).toBe(302);
  });

  it('Should validate that an admin can ban a user.', async () => {
    const res = await request(app)
      .delete('/api/admin/user/4?days=30&reason=off topic')
      .set('Cookie', [adminUser.cookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('Should validate that a banned user cannot post.', async () => {
    // This is a valid request.
    const createdThread = await request(app)
      .post(`/${topicSlug}`)
      .send({
        title: 'Example title. Less than 200 chars.',
        body: 'Example body. Less than 5k chars.',
      })
      .set('Cookie', [normalUser.cookie]);

    // That fails because the test user has been IP banned.
    expect(createdThread.text).toContain('You are IP banned');
  });

  it('Should validate that a non admin cannot unban a user.', async () => {
    // Try with a user with no session (entirely unauthed).
    const unauthRes = await request(app).delete('/api/admin/user/1?reason=he a good boy');
    expect(unauthRes.status).toBe(302);

    // Try with an authenticated user that isn't an admin.
    const authRes = await request(app)
      .delete('/api/admin/user/1?reason=he a good boy')
      .set('Cookie', [normalUser.cookie]);
    expect(authRes.status).toBe(302);
  });

  it('Should validate that an admin can unban a user.', async () => {
    const res = await request(app)
      .post('/api/admin/user/1?reason=he a good boy')
      .set('Cookie', [adminUser.cookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('Should validate that an admin can create a topic.', async () => {
    const createdTopic = await request(app)
      .post('/topic')
      .send({
        slug: 'slugger',
        title: 'Example title. Less than 200 chars.',
        body: 'Example body. Less than 5k chars.',
      })
      .set('Cookie', [adminUser.cookie])
      .expect(302);

    expect(createdTopic.header.location).toContain('slugger');
  });

  it('Should validate that a non-admin cannot create a topic.', async () => {
    const createdTopic = await request(app)
      .post('/topic')
      .send({
        slug: 'slugger',
        title: 'Example title. Less than 200 chars.',
        body: 'Example body. Less than 5k chars.',
      })
      .set('Cookie', [normalUser.cookie]);

    expect(createdTopic.status).toBe(302);
    expect(createdTopic.header.location).toBe('/');
  });

  it('Should validate that a normal user cannot delete a reply.', async () => {
    const unauthRes = await request(app).delete('/api/admin/1?reason=stupid&type=REPLY');

    expect(unauthRes.status).toBe(302);

    const authRes = await request(app)
      .delete('/api/admin/1?reason=stupid&type=REPLY')
      .set('Cookie', [normalUser.cookie]);

    expect(authRes.status).toBe(302);
  });

  it('Should validate that an admin can delete a reply.', async () => {
    const res = await request(app)
      .delete('/api/admin/1?reason=stupid&type=REPLY')
      .set('Cookie', [adminUser.cookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('Should validate that a normal user cannot delete a thread.', async () => {
    const unauthRes = await request(app).delete('/api/admin/1?reason=stupid&type=THREAD');

    expect(unauthRes.status).toBe(302);

    const authRes = await request(app)
      .delete('/api/admin/1?reason=stupid&type=THREAD')
      .set('Cookie', [normalUser.cookie]);

    expect(authRes.status).toBe(302);
  });

  it('Should validate that an admin can delete a thread.', async () => {
    const res = await request(app)
      .delete('/api/admin/1?reason=stupid&type=THREAD')
      .set('Cookie', [adminUser.cookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('Should validate that a normal user cannot delete a topic.', async () => {
    const unauthRes = await request(app).delete('/api/admin/1?reason=stupid&type=TOPIC');

    expect(unauthRes.status).toBe(302);

    const authRes = await request(app)
      .delete('/api/admin/1?reason=stupid&type=TOPIC')
      .set('Cookie', [normalUser.cookie]);

    expect(authRes.status).toBe(302);
  });

  it('Should validate that an admin can delete a topic.', async () => {
    const res = await request(app)
      .delete('/api/admin/1?reason=stupid&type=TOPIC')
      .set('Cookie', [adminUser.cookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
};

export default adminTests;
