const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// POST /api/admin/login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Hardcoded simple admin check for demonstration purposes
    // In production, use hashed passwords in a database
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'password123';

    console.log(`Login attempt - provided: ${username}/${password}, expected: ${adminUsername}/${adminPassword}`);

    if (username === adminUsername && password === adminPassword) {
        // Create token
        const payload = {
            admin: {
                username: adminUsername
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secretkey123',
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ success: true, token });
            }
        );
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

module.exports = router;
