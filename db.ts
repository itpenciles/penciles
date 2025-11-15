import pg from 'pg';
import dotenv from 'dotenv';
// FIX: Import `process` explicitly from node built-ins to ensure correct typing
// and access to methods like `exit`, resolving "Property 'exit' does not exist" error.
import process from 'node:process';

dotenv.config();

const { Pool } = pg;

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("!!! FATAL ERROR: DATABASE_URL environment variable not set. !!!");
    console.error("!!! The application cannot start without a database connection. !!!");
    console.error("!!! Please set the DATABASE_URL in your Render dashboard.    !!!");
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    // This error will crash the server startup process, making the issue
    // very clear in the deployment logs.
    throw new Error("DATABASE_URL environment variable is not set. Application cannot start.");
}

// This code will only run if dbUrl is defined.
console.log("DATABASE_URL found. Attempting to connect to database...");

const isProduction = !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1');

const pool = new Pool({
    connectionString: dbUrl,
    // Enforce SSL for production connections like those on Render.
    ssl: isProduction ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
    if (isProduction) {
        console.log('Successfully connected to the production database with SSL.');
    } else {
        console.log('Successfully connected to the local database.');
    }
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle database client. Exiting.', err);
    // This is a fatal error for the process, so we exit.
    process.exit(-1);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);