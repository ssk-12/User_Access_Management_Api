import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../index.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

const userRepository = AppDataSource.getRepository("User");

router.post('/signup', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        const existingUser = await userRepository.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Validate role against allowed values
        const allowedRoles = ["Employee", "Manager", "Admin"];
        const userRole = allowedRoles.includes(role) ? role : "Employee";

        const user = userRepository.create({
            username,
            password: hashedPassword,
            role: userRole
        });

        await userRepository.save(user);

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await userRepository.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Error during login' });
    }
});

router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Service is running',
        timestamp: new Date().toISOString()
    });
});

export default router;