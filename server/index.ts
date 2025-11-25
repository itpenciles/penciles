
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/authRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import analysisRoutes from './routes/analysisRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import planRoutes from './routes/planRoutes.js';
import attomRoutes from './routes/attomRoutes.js';

// Load environment variables
dotenv.config();

// --- STARTUP DIAGNOSTICS ---
console.log('--- SERVER STARTUP ---');
const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
if (clientId && clientId !== 'undefined' && !clientId.includes('YOUR_GOOGLE_CLIENT_ID_HERE')) {
    console.log(`✅ VITE_GOOGLE_CLIENT_ID loaded successfully.`);
    console.log(`   Server will use Client ID ending in: ...${clientId.slice(-15)}`);
} else {
    console.error(`❌ FATAL: VITE_GOOGLE_CLIENT_ID is MISSING or is a placeholder!`);
    console.error(`   The application will not function correctly without it.`);
}
console.log('----------------------');
// --- END DIAGNOSTICS ---


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors() as any); // Enable Cross-Origin Resource Sharing
app.use(express.json() as any); // To parse JSON bodies

// --- Production Static File Serving ---
// Get directory name in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The production build of the frontend is in the 'dist' folder at the root
// We go up one level from `dist/server` to `dist`
app.use(express.static(path.join(__dirname, '..')) as any);


// API Routes (These must come before the client-side catch-all)
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/analyze', analysisRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/attom', attomRoutes);

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
