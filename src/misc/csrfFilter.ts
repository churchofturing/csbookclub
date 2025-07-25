import { csrfSync } from 'csrf-sync';

const { csrfSynchronisedProtection, generateToken } = csrfSync({
  getTokenFromRequest: (req) => {
    return req.body.CSRFToken;
  },
});

export { csrfSynchronisedProtection, generateToken };
