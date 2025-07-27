class User {
  username: string;
  password: string;
  confirmPassword: string;
  cookie: string;
  referralCode: string;

  constructor({
    username,
    password,
    confirmPassword,
  }: {
    username: string;
    password: string;
    confirmPassword: string;
  }) {
    this.username = username;
    this.password = password;
    this.confirmPassword = confirmPassword;
    this.cookie = '';
    this.referralCode = '';
  }

  setCookie(cookie: string) {
    this.cookie = cookie;
  }

  setReferralCode(code: string) {
    this.referralCode = code;
  }
}

// Just setting up some example users.
const normalUser = new User({
  username: 'gitgood',
  password: 'gitgoodgitgoodgitgood',
  confirmPassword: 'gitgoodgitgoodgitgood',
});

// TODO: need to link these details with those in seed.ts
const adminUser = new User({
  username: 'admin',
  password: 'exampleadminpassword',
  confirmPassword: 'exampleadminpassword',
});

export { normalUser, adminUser };
