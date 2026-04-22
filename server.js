const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize SQLite DB
const dbFile = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS colleges (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                tagline TEXT,
                brand_color TEXT
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS knowledge_base (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                college_slug TEXT NOT NULL,
                keywords TEXT NOT NULL,
                response TEXT NOT NULL,
                FOREIGN KEY(college_slug) REFERENCES colleges(slug) ON DELETE CASCADE
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS quick_replies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                college_slug TEXT NOT NULL,
                label TEXT NOT NULL,
                text TEXT NOT NULL,
                FOREIGN KEY(college_slug) REFERENCES colleges(slug) ON DELETE CASCADE
            )`, () => {
                // Seed initial data if empty
                db.get("SELECT COUNT(*) AS count FROM colleges", [], (err, row) => {
                    if (row && row.count === 0) {
                        console.log("Seeding initial database content...");
                        
                        const insertCollege = db.prepare("INSERT INTO colleges (name, slug, tagline, brand_color) VALUES (?, ?, ?, ?)");
                        insertCollege.run("Poornima University", "pu", "Shaping Your Future, Inspiring Excellence", "#4A90E2");
                        insertCollege.run("Poornima College of Engg.", "pce", "Engineering the Future", "#E056FD");
                        insertCollege.finalize();

                        const insertKb = db.prepare("INSERT INTO knowledge_base (college_slug, keywords, response) VALUES (?, ?, ?)");
                        insertKb.run("pu", "location, where, address", "We are located at ISI-2, RIICO Institutional Area, Sitapura, Jaipur, Rajasthan 302022");
                        insertKb.run("pu", "course, fee, cost", "We offer various UG and PG courses, Check our website for detailed fee structure.");
                        insertKb.finalize();

                        const insertQr = db.prepare("INSERT INTO quick_replies (college_slug, label, text) VALUES (?, ?, ?)");
                        insertQr.run("pu", "Campus", "Location");
                        insertQr.run("pu", "Programs", "Programs");
                        insertQr.run("pu", "Placements", "Placements");
                        insertQr.run("pu", "Scholarships", "Fees");
                        insertQr.finalize();
                    }
                });
            });
        });
    }
});

// --- API ROUTES ---

// 1. Get all colleges
app.get('/api/colleges', (req, res) => {
    db.all("SELECT * FROM colleges", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 2. Add a new college
app.post('/api/colleges', (req, res) => {
    const { name, tagline, brand_color } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    
    const slug = name.toLowerCase().replace(/\s/g, '-');
    db.run("INSERT INTO colleges (name, slug, tagline, brand_color) VALUES (?, ?, ?, ?)",
        [name, slug, tagline, brand_color || '#4A90E2'],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: "College already exists" });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID, name, slug, tagline, brand_color });
        }
    );
});

// 3. Update an existing college
app.put('/api/colleges/:slug', (req, res) => {
    const { slug } = req.params;
    const { name, tagline, brand_color } = req.body;
    db.run("UPDATE colleges SET name = ?, tagline = ?, brand_color = ? WHERE slug = ?",
        [name, tagline, brand_color, slug],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "College updated successfully" });
        }
    );
});

// 4. Get Knowledge Base for a specific college
app.get('/api/knowledge/:slug', (req, res) => {
    const { slug } = req.params;
    db.all("SELECT * FROM knowledge_base WHERE college_slug = ?", [slug], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 5. Update Knowledge Base for a specific college (Replaces existing list)
app.post('/api/knowledge/:slug', (req, res) => {
    const { slug } = req.params;
    const items = req.body; // Array of { keywords, response }
    
    db.serialize(() => {
        db.run("DELETE FROM knowledge_base WHERE college_slug = ?", [slug], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            
            if (items && items.length > 0) {
                const stmt = db.prepare("INSERT INTO knowledge_base (college_slug, keywords, response) VALUES (?, ?, ?)");
                items.forEach(item => {
                    stmt.run(slug, item.keywords, item.response);
                });
                stmt.finalize();
            }
            res.json({ message: "Knowledge base updated" });
        });
    });
});

// 6. Get Quick Replies for a specific college
app.get('/api/quick-replies/:slug', (req, res) => {
    const { slug } = req.params;
    db.all("SELECT * FROM quick_replies WHERE college_slug = ?", [slug], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 7. Update Quick Replies for a specific college (Replaces existing list)
app.post('/api/quick-replies/:slug', (req, res) => {
    const { slug } = req.params;
    const items = req.body; // Array of { label, text }
    
    db.serialize(() => {
        db.run("DELETE FROM quick_replies WHERE college_slug = ?", [slug], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            
            if (items && items.length > 0) {
                const stmt = db.prepare("INSERT INTO quick_replies (college_slug, label, text) VALUES (?, ?, ?)");
                items.forEach(item => {
                    stmt.run(slug, item.label, item.text);
                });
                stmt.finalize();
            }
            res.json({ message: "Quick replies updated" });
        });
    });
});

app.listen(port, () => {
    console.log(`Backend Server API running at http://localhost:${port}`);
});
