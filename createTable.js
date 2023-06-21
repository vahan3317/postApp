const pool = require('./db');

pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
  );
`).then(() => {
  console.log('User table created successfully');
  pool.end();
}).catch((err) => {
  console.error('Error creating user table', err);
  pool.end();
});
