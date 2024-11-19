const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const db = require("./database");

const app = express();

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
app.get('/', (req, res) => {
  db.query('SELECT * FROM titles', (err, featuredMovies) => {
      if (err) throw err;
      
      db.query('SELECT * FROM titles ORDER BY rating_average DESC LIMIT 5', (err, recommendedMovies) => {
          if (err) throw err;
          
          res.render('index', {
              page_title: 'Home',
              featuredMovies: featuredMovies,
              recommendedMovies: recommendedMovies,
              user: req.session?.user // Jika menggunakan session
          });
      });
  });
});

// Home page
app.get("/", (req, res) => {
    const query = `
        SELECT t.*, s.name as studio_name 
        FROM titles t 
        LEFT JOIN studios s ON t.studio_id = s.studio_id 
        ORDER BY t.rating_average DESC 
        LIMIT 10
    `;
    
    db.query(query, (err, topTitles) => {
        if (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Database error' });
            return;
        }
        res.render('index', { 
            topTitles: topTitles,
            page_title: 'Home'
        });
    });
});

// Browse titles
app.get("/browse", (req, res) => {
    const { type, genre, search } = req.query;
    let query = `
        SELECT t.*, s.name as studio_name, 
        GROUP_CONCAT(DISTINCT g.name) as genres
        FROM titles t 
        LEFT JOIN studios s ON t.studio_id = s.studio_id
        LEFT JOIN title_genres tg ON t.title_id = tg.title_id
        LEFT JOIN genres g ON tg.genre_id = g.genre_id
    `;
    
    const conditions = [];
    const params = [];

    if (type) {
        conditions.push("t.type = ?");
        params.push(type);
    }
    if (genre) {
        conditions.push("g.name = ?");
        params.push(genre);
    }
    if (search) {
        conditions.push("(t.title LIKE ? OR t.synopsis LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
    }

    query += " GROUP BY t.title_id ORDER BY t.rating_average DESC";

    // Get genres for filter dropdown
    db.query("SELECT * FROM genres", (err, genres) => {
        if (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Database error' });
            return;
        }

        db.query(query, params, (err, titles) => {
            if (err) {
                console.error(err);
                res.status(500).render('error', { message: 'Database error' });
                return;
            }
            res.render('browse', {
                titles: titles,
                genres: genres,
                filters: { type, genre, search },
                page_title: 'Browse'
            });
        });
    });
});

// Title detail page
app.get("/title/:id", (req, res) => {
    const titleId = req.params.id;
    const queries = {
        title: `
            SELECT t.*, s.name as studio_name,
            GROUP_CONCAT(DISTINCT g.name) as genres
            FROM titles t
            LEFT JOIN studios s ON t.studio_id = s.studio_id
            LEFT JOIN title_genres tg ON t.title_id = tg.title_id
            LEFT JOIN genres g ON tg.genre_id = g.genre_id
            WHERE t.title_id = ?
            GROUP BY t.title_id
        `,
        staff: `
            SELECT p.*, tp.role, tp.character_name
            FROM title_people tp
            JOIN people p ON tp.person_id = p.person_id
            WHERE tp.title_id = ?
        `,
        reviews: `
            SELECT r.*, u.username
            FROM reviews r
            JOIN users u ON r.user_id = u.user_id
            WHERE r.title_id = ?
            ORDER BY r.created_at DESC
            LIMIT 10
        `
    };

    db.query(queries.title, [titleId], (err, titles) => {
        if (err || !titles.length) {
            console.error(err);
            res.status(404).render('error', { message: 'Title not found' });
            return;
        }

        db.query(queries.staff, [titleId], (err, staff) => {
            if (err) {
                console.error(err);
                res.status(500).render('error', { message: 'Database error' });
                return;
            }

            db.query(queries.reviews, [titleId], (err, reviews) => {
                if (err) {
                    console.error(err);
                    res.status(500).render('error', { message: 'Database error' });
                    return;
                }

                res.render('title', {
                    title: titles[0],
                    staff: staff,
                    reviews: reviews,
                    page_title: titles[0].title
                });
            });
        });
    });
});

// User registration
app.post("/register", (req, res) => {
    const { username, email, password } = req.body;
    
    const query = "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)";
    db.query(query, [username, email, password], (err, result) => {
        if (err) {
            console.error(err);
            res.status(400).json({ error: 'Registration failed' });
            return;
        }
        res.status(201).json({ message: 'Registration successful' });
    });
});

// User login
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    
    const query = "SELECT * FROM users WHERE username = ? AND password_hash = ?";
    db.query(query, [username, password], (err, results) => {
        if (err || !results.length) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        // In a real app, you would set up a session here
        res.json({ message: 'Login successful' });
    });
});

// Add to user list
app.post("/list", (req, res) => {
    const { userId, titleId, status, progress } = req.body;
    
    const query = `
        INSERT INTO user_lists (user_id, title_id, status, progress) 
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE status = ?, progress = ?
    `;
    
    db.query(query, [userId, titleId, status, progress, status, progress], (err) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to update list' });
            return;
        }
        res.json({ message: 'List updated successfully' });
    });
});

// Add rating
app.post("/rate", (req, res) => {
    const { userId, titleId, score } = req.body;
    
    const query = `
        INSERT INTO ratings (user_id, title_id, score) 
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE score = ?
    `;
    
    db.query(query, [userId, titleId, score, score], (err) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to submit rating' });
            return;
        }

        // Update average rating
        const updateQuery = `
            UPDATE titles SET 
            rating_average = (SELECT AVG(score) FROM ratings WHERE title_id = ?),
            rating_count = (SELECT COUNT(*) FROM ratings WHERE title_id = ?)
            WHERE title_id = ?
        `;
        
        db.query(updateQuery, [titleId, titleId, titleId], (err) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Failed to update average rating' });
                return;
            }
            res.json({ message: 'Rating submitted successfully' });
        });
    });
});

// Add review
app.post("/review", (req, res) => {
    const { userId, titleId, content } = req.body;
    
    const query = "INSERT INTO reviews (user_id, title_id, content) VALUES (?, ?, ?)";
    db.query(query, [userId, titleId, content], (err) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to submit review' });
            return;
        }
        res.status(201).json({ message: 'Review submitted successfully' });
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { message: 'Something broke!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', { message: 'Page not found' });
});

// Start server
app.listen(3000, function () {
  console.log("Listening to http://localhost:3000");
});


module.exports = app;