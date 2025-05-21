import express from 'express';
import { AppDataSource } from '../index.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

const requestRepository = AppDataSource.getRepository("Request");
const softwareRepository = AppDataSource.getRepository("Software");

router.post('/', authMiddleware, roleMiddleware(['Employee']), async (req, res) => {
    try {
        const { softwareId, accessType, reason } = req.body;

        const software = await softwareRepository.findOne({ where: { id: softwareId } });
        if (!software) {
            return res.status(404).json({ message: 'Software not found' });
        }

        if (!software.accessLevels.includes(accessType)) {
            return res.status(400).json({ message: 'Invalid access type for this software' });
        }

        const request = requestRepository.create({
            user: { id: req.user.id },
            software: { id: softwareId },
            accessType,
            reason,
            status: 'Pending'
        });

        await requestRepository.save(request);
        res.status(201).json(request);
    } catch (error) {
        res.status(500).json({ message: 'Error creating request' });
    }
});

router.get('/my-requests', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const requests = await requestRepository.find({
            where: { user: { id: userId } },
            relations: ['software', 'updatedBy'],
            order: { createdAt: 'DESC' }
        });

        const counts = {
            total: requests.length,
            pending: requests.filter(req => req.status === 'Pending').length,
            approved: requests.filter(req => req.status === 'Approved').length,
            rejected: requests.filter(req => req.status === 'Rejected').length
        };

        res.json({
            requests,
            counts
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching your requests' });
    }
});

router.get('/my-access', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const approvedRequests = await requestRepository.find({
            where: { 
                user: { id: userId },
                status: 'Approved'
            },
            relations: ['software', 'updatedBy']
        });
        
        const accessibleSoftware = approvedRequests.map(request => ({
            software: request.software,
            accessType: request.accessType,
            updatedBy: request.updatedBy
        }));
        
        res.json(accessibleSoftware);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching your software access' });
    }
});

router.get('/my-manager-requests', authMiddleware, roleMiddleware(['Manager']), async (req, res) => {
    try {
        const managerId = req.user.id;
        
        const processedByMe = await requestRepository.find({
            where: { 
                updatedBy: { id: managerId }
            },
            relations: ['user', 'software', 'updatedBy'],
            order: { updatedAt: 'DESC' }
        });
        
        const formattedRequests = processedByMe.map(request => ({
            id: request.id,
            requestedBy: request.user,
            software: request.software,
            accessType: request.accessType,
            reason: request.reason,
            status: request.status,
            updatedBy: request.updatedBy,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt
        }));
        
        const counts = {
            total: processedByMe.length,
            approved: processedByMe.filter(req => req.status === 'Approved').length,
            rejected: processedByMe.filter(req => req.status === 'Rejected').length
        };
        
        res.json({
            counts,
            approved: formattedRequests.filter(req => req.status === 'Approved'),
            rejected: formattedRequests.filter(req => req.status === 'Rejected'),
            all: formattedRequests
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching requests you processed' });
    }
});

router.get('/', authMiddleware, roleMiddleware(['Manager', 'Admin']), async (req, res) => {
    try {
        const requests = await requestRepository.find({
            relations: ['user', 'software', 'updatedBy']
        });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching requests' });
    }
});

router.patch('/:id', authMiddleware, roleMiddleware(['Manager']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const request = await requestRepository.findOne({
            where: { id },
            relations: ['user', 'software']
        });

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.status !== 'Pending') {
            return res.status(400).json({ message: 'Request already processed' });
        }

        request.status = status;
        
        const userRepository = AppDataSource.getRepository("User");
        const updater = await userRepository.findOne({ where: { id: req.user.id } });
        request.updatedBy = updater;
        
        await requestRepository.save(request);
        
        const updatedRequest = await requestRepository.findOne({
            where: { id },
            relations: ['user', 'software', 'updatedBy']
        });
        
        res.json(updatedRequest);
    } catch (error) {
        res.status(500).json({ message: 'Error updating request' });
    }
});

export default router;