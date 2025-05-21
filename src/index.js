import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { DataSource } from 'typeorm';

const app = express();

// CORS configuration
const corsOptions = {
  origin: 'https://uam-delta.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

const AppDataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    synchronize: true,
    logging: process.env.NODE_ENV === 'development',
    entities: ["./src/entities/*.js"],
    migrations: ["./src/migrations/*.js"],
});

AppDataSource.initialize()
    .then(async () => {
        console.log("Database connection established");
        
        const { default: authRoutes } = await import('./routes/auth.routes.js');
        const { default: softwareRoutes } = await import('./routes/software.routes.js');
        const { default: requestRoutes } = await import('./routes/request.routes.js');

        app.use('/api/auth', authRoutes);
        app.use('/api/software', softwareRoutes);
        app.use('/api/requests', requestRoutes);

        // Health check route
        app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'ok',
                message: 'Service is running',
                timestamp: new Date().toISOString()
            });
        });

        app.use((err, req, res, next) => {
            console.error(err.stack);
            res.status(500).json({ message: 'Something went wrong!' });
        });

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Error during Data Source initialization:", error);
    });

export { AppDataSource };