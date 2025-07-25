import request from 'supertest';
import app from '../src/server.js';
import { normalUser } from './misc/User.js';
import { REPLY_BODY_REQUIRED, BODY_MAX_LENGTH } from '../src/misc/strings.js';
import { topicSlug, threadTitle, replyBody } from './misc/values.js';
import stringToSlug from '../src/misc/slugGenerator.js';

const threadUrl = `/${topicSlug}/1/${stringToSlug(threadTitle)}`;

const threadTests = () => {
  it('Should validate that a thread exists.', async () => {
    const res = await request(app).get(threadUrl);
    expect(res.status).toBe(200);
  });

  it('Should validate that a thread does not exist.', async () => {
    const res = await request(app).get(`/${topicSlug}/2/example-slug`);
    expect(res.status).toBe(404);
  });

  it('Should validate that the thread redirect works.', async () => {
    // If you try to access a thread without the slug it should redirect to the url with a slug.
    const res = await request(app).get(`/${topicSlug}/1`).redirects(1);
    expect(res.status).toBe(200);
    expect(res.request.url).toContain(`${stringToSlug(threadTitle)}`);
  });

  it('Should validate a reply needs a body.', async () => {
    // A user making a request without a session will be redirected.
    const res = await request(app)
      .post(`/${topicSlug}/1`)
      .send({})
      .set('Cookie', [normalUser.cookie]);
    expect(res.text).toContain(REPLY_BODY_REQUIRED);
  });

  it('Should validate a reply needs a body of less than 5k characters.', async () => {
    // A user making a request without a session will be redirected.
    const res = await request(app)
      .post(`/${topicSlug}/1`)
      .send({
        body: 'x'.repeat(5001),
      })
      .set('Cookie', [normalUser.cookie]);

    expect(res.text).toContain(BODY_MAX_LENGTH);
  });

  it('Should validate a thread can be replied to.', async () => {
    // A user making a request without a session will be redirected.
    const res = await request(app)
      .post(`/${topicSlug}/1`)
      .send({
        body: replyBody,
      })
      .set('Cookie', [normalUser.cookie])
      .redirects(1);

    expect(res.status).toBe(200);
    expect(res.text).toContain('Reply.1');
  });

  it('Should validate thread replies increment sequentially.', async () => {
    // A user making a request without a session will be redirected.
    const first = await request(app)
      .post(`/${topicSlug}/1`)
      .send({
        body: replyBody,
      })
      .set('Cookie', [normalUser.cookie])
      .redirects(1);

    expect(first.status).toBe(200);
    expect(first.text).toContain('Reply.2');
    expect(first.text).not.toContain('Reply.3');

    const second = await request(app)
      .post(`/${topicSlug}/1`)
      .send({
        body: replyBody,
      })
      .set('Cookie', [normalUser.cookie])
      .redirects(1);

    expect(second.status).toBe(200);
    expect(second.text).toContain('Reply.3');
    expect(second.text).not.toContain('Reply.4');
  });
};

export default threadTests;
