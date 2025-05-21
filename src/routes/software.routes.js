import express from 'express';
import { AppDataSource } from '../index.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

const softwareRepository = AppDataSource.getRepository("Software");

router.post('/', authMiddleware, roleMiddleware(['Admin']), async (req, res) => {
    try {
        const { name, description, accessLevels } = req.body;

        const existingSoftware = await softwareRepository.findOne({ where: { name } });
        if (existingSoftware) {
            return res.status(400).json({ message: 'Software already exists' });
        }

        const software = softwareRepository.create({
            name,
            description,
            accessLevels: accessLevels || ["Read"]
        });

        await softwareRepository.save(software);
        res.status(201).json(software);
    } catch (error) {
        res.status(500).json({ message: 'Error creating software' });
    }
});

router.get('/', authMiddleware, async (req, res) => {
    try {
        const software = await softwareRepository.find();
        res.json(software);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching software' });
    }
});

export default router;