# [csbook.club](https://csbook.club/)

> **A minimal textboard for Computer Science enthusiasts** — Inspired by the legendary textboard BBS culture of the 2000s

[![Made with Bun](https://img.shields.io/badge/Made%20with-Bun-black?style=flat-square&logo=bun)](https://bun.sh/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-blue?style=flat-square&logo=sqlite)](https://sqlite.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

## Features

- Anonymous posting with optional accounts
- Thread-based discussions
- Minimal UI focused on readability
- Usable without Javascript
- Fast and lightweight
- Mobile-friendly responsive design
- Markdown and Mathjax support

## Getting Started

### Prerequisites

- [Bun](https://bun.com/)


### Installation

1. Clone the repository:
```bash
git clone https://github.com/churchofturing/csbookclub.git
cd csbookclub
```

2. Install [bun](https://bun.com/):
```bash
curl -fsSL https://bun.sh/install | bash
```

or

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

3. Install dependencies:
```bash
bun install --ignore-scripts
```

We use `--ignore-scripts` because without it Prisma tries to run a postinstall script that checks the Node version.
As we're not using Node it creates a big serious looking error that doesn't actually matter. 

4. Generate the Prisma client:
```bash
bunx prisma generate client
```

5. Configure:
```bash
cp .env.example .env
```

You'll also want to change the password of the default admin user. This can be found in `./prisma/seed.ts`:

```javascript
const adminEncryptedPass = await bcrypt.hash('exampleadminpassword', 10);
```

6. Set up the database:
```bash
bunx prisma migrate dev
```

This creates the SQLite database, applies all the migrations and seeds it with dummy data.

7. Start the development server:
```bash
bun run dev
```

8. Finish:

Visit `http://localhost:5000` to access the textboard.

## Configuration

Key configuration options are in `.env`:

```
PORT=5000
SECRET=randomsecretisrandomornot
NODE_ENV=development
FLOOD_TIME_MIN=2
FLOOD_TIME_REFRESH=120
COOKIE_NAME=cookie.sid
DATABASE_URL=file:./dev.db
REFER_LIMIT=8
SITEMAP_GENERATE_INTERVAL=120
```

- `PORT` is the port that the server runs on.
- `SECRET` is the session secret. **KEEP THIS SAFE**.
- `NODE_ENV` is the Node environment running. `production`, `development` or `test`.
- `FLOOD_TIME_MIN` is the time a user must wait between posts in minutes. For example, wait 2 minutes before posting again.
- `FLOOD_TIME_REFRESH` is the time in minutes between checking and removing all of the outdated post times.
- `COOKIE_NAME` is the name of the session cookie.
- `DATABASE_URL` is the url to the SQLite database file. 
- `REFER_LIMIT` is the amount of other users a registered user can refer.
- `SITEMAP_GENERATE_INTERVAL` is how often in minutes the sitemap will be generated.


## Testing

```bash
bun run test
```

This command creates a database, seeds it with users and then proceeds to execute all the tests.
The tests are all integration tests, we should probably include unit tests in the future.

## Technology Stack

- **Backend**: Bun with Express
- **Database**: SQLite with Prisma
- **Frontend**: HTML and CSS (very minimal JS)
- **Templating**: EJS

## Directory Structure

```
csbookclub/
│
├── .vscode/            # Configuration files for VSCode
│
├── node_modules/       # Project dependencies
│
├── prisma/             # Prisma configuration files and database
│
├── public/             # Static assets
│
├── src/                # Main source code directory
│   ├── controllers/    # Functions that handle requests
│   ├── misc/           # Miscellaneous helper functions 
│   ├── routes/         # Code that routes requests to controllers
│   ├── index.ts        # Initialises the server
│   └── server.ts       # Configures the server before initialisation
│
├── tests/              # Test files and test utilities
│
├── types/              # Global Typescript Types
│
└──views/               # EJS template files
```

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/churchofturing/csbookclub/blob/master/LICENCE) file for details.

## Support

If you encounter issues or have questions:

- Check the [Issues](https://github.com/churchofturing/csbookclub/issues) page
- Create a new issue with detailed information
- Join #daclub on [irc.csbook.club](irc.csbook.club) port 6697 (SSL only)
- For urgent matters, contact: churchofturing@gmail.com

---

*Words, words, words*