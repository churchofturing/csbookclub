import request from 'supertest';
import app from '../src/server.js';
import { adminUser, normalUser } from './misc/User.js';
import {
  THREAD_BODY_REQUIRED,
  THREAD_TITLE_REQUIRED,
  BODY_MAX_LENGTH,
  TITLE_MAX_LENGTH,
} from '../src/misc/strings.js';
import { topicBody, topicTitle, topicSlug, threadTitle, threadBody } from './misc/values.js';

const topicTests = () => {
  it('Should validate that an admin can create a topic.', async () => {
    await request(app)
      .post('/topic')
      .send({
        title: topicTitle,
        body: topicBody,
        slug: topicSlug,
      })
      .set('Cookie', [adminUser.cookie])
      .expect(302)
      .expect('Location', `/${topicSlug}`);
  });

  it('Should validate that a topic exists.', async () => {
    const res = await request(app).get(`/${topicSlug}`);
    expect(res.status).toBe(200);
  });

  it('Should validate a thread needs a title and body.', async () => {
    // A user making a request without a session will be redirected.
    const missingTitle = await request(app)
      .post(`/${topicSlug}`)
      .send({
        body: 'Example body.',
      })
      .set('Cookie', [normalUser.cookie]);

    expect(missingTitle.text).toContain(THREAD_TITLE_REQUIRED);

    const missingBody = await request(app)
      .post(`/${topicSlug}`)
      .send({
        title: 'Example title.',
      })
      .set('Cookie', [normalUser.cookie]);

    expect(missingBody.text).toContain(THREAD_BODY_REQUIRED);
  });

  it('Should validate a thread has a body of less than 5k characters.', async () => {
    const res = await request(app)
      .post(`/${topicSlug}`)
      .send({
        title: 'Example title.',
        body: 'x'.repeat(5001),
      })
      .set('Cookie', [normalUser.cookie]);

    expect(res.text).toContain(BODY_MAX_LENGTH);
  });

  it('Should validate a thread has a title of less than 200 characters.', async () => {
    const res = await request(app)
      .post(`/${topicSlug}`)
      .send({
        title: 'x'.repeat(201),
        body: 'Example body.',
      })
      .set('Cookie', [normalUser.cookie]);

    expect(res.text).toContain(TITLE_MAX_LENGTH);
  });

  it('Should validate a thread can be created.', async () => {
    const createdThread = await request(app)
      .post(`/${topicSlug}`)
      .send({
        title: threadTitle,
        body: threadBody,
      })
      .set('Cookie', [normalUser.cookie])
      .expect(302);

    expect(createdThread.header.location).toContain(`${topicSlug}`);
  });
};

export default topicTests;
