import loginTests from './login.jest.js';
import registerTests from './register.jest.js';
import threadTests from './thread.jest.js';
import topicTests from './topic.jest.js';
import adminTests from './admin.jest.js';
import generalTests from './general.jest.js';
import referralTests from './referral.jest.js';

// The order here matters.
// Cannot test "authenticate" without having first registered a user.
describe('Referral', referralTests);
describe('Register', registerTests);
describe('Login', loginTests);
describe('General', generalTests);
describe('Topics', topicTests);
describe('Threads', threadTests);
describe('Admin', adminTests);
