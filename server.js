const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();
const bodyParser = require('body-parser');




const app = express();
app.use(express.json());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
// Database configuration
const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: '1',
  database: 'users',
});

// Create the users table if it doesn't exist
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL
  )
`).then(() => {
  // Registration endpoint
  app.post('/register', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await pool.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, hashedPassword]);

      res.status(200).json({ message: 'Registration successful' });
    } catch (err) {
      console.error('Error during registration', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });



  app.get('/script.js', (req, res) => {
    fs.readFile('views/script.js', 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading script file', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
  
      res.setHeader('Content-Type', 'application/javascript'); // Set the correct MIME type
      res.status(200).send(data);
    });
  });

  // Login route
  app.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      // Check if the user exists
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Compare passwords
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

      res.status(200).json({ token });
    } catch (err) {
      console.error('Error during login', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  app.post('/create-post', authenticateToken, async (req, res) => {
    try {
      // Extract the post data from the request body
      const { title, content } = req.body;
  
      // Get the user ID from the authenticated request
      const userId = req.userId;
  
      // Check if the 'posts' table exists
      const tableExistsResult = await pool.query(`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts')`);
      const tableExists = tableExistsResult.rows[0].exists;
  
      // If the 'posts' table does not exist, create it
      if (!tableExists) {
        await pool.query(`
          CREATE TABLE posts (
            id SERIAL PRIMARY KEY,
            title VARCHAR(100) NOT NULL,
            content VARCHAR(500) NOT NULL,
            user_id INTEGER REFERENCES users(id)
          )
        `);
      }
  
      // Insert the post into the 'posts' table
      await pool.query('INSERT INTO posts (title, content, user_id) VALUES ($1, $2, $3)', [title, content, userId]);
  
      res.status(200).json({ message: 'Post created successfully' });
    } catch (err) {
      console.error('Error creating post', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.get('/posts', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM posts');
      const posts = result.rows;
      res.json(posts);
    } catch (err) {
      console.error('Error fetching posts', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/search-posts', authenticateToken, async (req, res) => {
    try {
      const { query } = req.query;
      const userId = req.userId;
  
      // Search for posts that match the query
      const result = await pool.query('SELECT * FROM posts WHERE user_id = $1 AND (title ILIKE $2 OR content ILIKE $2)', [userId, `%${query}%`]);
      const posts = result.rows;
  
      res.json(posts);
    } catch (err) {
      console.error('Error searching posts', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });


  app.delete('/delete-post/:postId', authenticateToken, async (req, res) => {
    try {
      const postId = req.params.postId;
      const userId = req.userId;
  
      // Check if the post exists and belongs to the authenticated user
      const result = await pool.query('SELECT * FROM posts WHERE id = $1 AND user_id = $2', [postId, userId]);
      const post = result.rows[0];
  
      if (!post) {
        return res.status(404).json({ error: 'You cant delete,beacuse you didnt create this post' });
      }
  
      // Delete the post
      await pool.query('DELETE FROM posts WHERE id = $1', [postId]);
  
      res.status(200).json({ message: 'Post deleted successfully' });
    } catch (err) {
      console.error('Error deleting post', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });



  // Home endpoint
  app.get('/',  (req, res) => {
    res.sendFile(__dirname + '/views/login.html');
  });
  app.get('/home',  (req, res) => {
    res.sendFile(__dirname + '/views/home.html');
  });


  // Middleware for JWT authentication
  function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }
  
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
  
      req.userId = decoded.userId;
      next();
    });
  }
  // Route handlers for login and register pages
  app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/views/login.html');
  });
  app.post('/logout', (req, res) => {
    try {
      // Destroy the session or perform any other necessary cleanup
  
      res.redirect('/login');
    } catch (error) {
      console.error('Error during logout', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/views/register.html');
  });

  // Start the server
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });
}).catch(err => {
  console.error('Error creating user table', err);
});
