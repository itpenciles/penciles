import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/authRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import analysisRoutes from './routes/analysisRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // To parse JSON bodies

// --- Production Static File Serving ---
// Get directory name in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The production build of the frontend is in the 'dist' folder at the root
// We go up one level from `dist/server` to `dist`
app.use(express.static(path.join(__dirname, '..')));


// API Routes (These must come before the client-side catch-all)
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/analyze', analysisRoutes);

// Simple root API endpoint for health checks
app.get('/api', (_req, res) => {
    res.json({ message: 'It Pencils API is running!' });
});

// The "catchall" handler for client-side routing
// For any request that doesn't match one of the API routes above,
// send back React's index.html file.
app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});