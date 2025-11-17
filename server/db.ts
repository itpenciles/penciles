import pg from 'pg';
import dotenv from 'dotenv';
import process from 'node:process';
import { URL } from 'url';

dotenv.config();

const { Pool } = pg;

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("!!! FATAL ERROR: DATABASE_URL environment variable not set. !!!");
    console.error("!!! The application cannot start without a database connection. !!!");
    console.error("!!! Please set the DATABASE_URL in your Render dashboard.    !!!");
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    throw new Error("DATABASE_URL environment variable is not set. Application cannot start.");
}

console.log("DATABASE_URL found. Attempting to connect to database...");

const isProduction = !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1');

const pool = new Pool({
    connectionString: dbUrl,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
    try {
        const dbConnectionUrl = new URL(dbUrl);
        const dbName = dbConnectionUrl.pathname.slice(1); // Remove leading slash
        const host = dbConnectionUrl.hostname;
        console.log(`✅ Successfully connected to database: '${dbName}' on host '${host}'.`);
    } catch (e) {
        console.error("Could not parse DATABASE_URL to display database name, but connection was successful.");
    }
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle database client. Exiting.', err);
    process.exit(-1);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);