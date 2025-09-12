# EdWeb API

Basic Node.js + Express project scaffold.

## Scripts

- `npm start` - Run the server normally (production mode)
- `npm run dev` - Run the server with nodemon (auto-reload)

## Environment Variables

Copy `.env.example` to `.env` and adjust:

```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=changeme # or use DB_PASS
DB_NAME=example_db
JWT_SECRET=supersecretjwtkey
BCRYPT_SALT_ROUNDS=10
```

## Dependencies

- express: Web framework
- mysql2: MySQL client (supports promises)
- dotenv: Loads environment variables
- bcrypt: Password hashing
- jsonwebtoken: JWT auth tokens
- multer: Handling multipart/form-data (file uploads)
- csv-parser: Streaming CSV parsing
- cors: Enable Cross-Origin Resource Sharing

## Dev Dependencies

- nodemon: Auto-restart server on code changes

## Health Check

`GET /health` returns JSON health status.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env file:
   ```bash
   copy .env.example .env   # Windows PowerShell: cp .env.example .env also works
   ```
3. Start dev server:
   ```bash
   npm run dev
   ```
4. Visit: http://localhost:3000/health

## Database Usage

`db.js` exports two functions:

```js
const { getPool, testConnection } = require('./db');

async function example() {
   const pool = getPool();
   const [rows] = await pool.query('SELECT 1 AS ok');
   console.log(rows);
}
```

Environment variable names:

- `DB_HOST` (default localhost)
- `DB_USER` (default root)
- `DB_PASSWORD` or `DB_PASS`
- `DB_NAME`
- `DB_PORT` (default 3306)
- `DB_CONNECTION_LIMIT` (default 10)

Test connectivity (temporary script example):

```bash
node -e "require('./db').testConnection().then(()=>console.log('DB OK')).catch(e=>console.error(e))"
```

## Next Steps

- Implement auth routes (register/login) using bcrypt + JWT
- Add file upload endpoint using multer
- Add CSV import using csv-parser
