import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

/*
-- Run this SQL in your PostgreSQL database to create the required tables --

CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "google_id" VARCHAR(255) UNIQUE NOT NULL,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "name" VARCHAR(255),
  "profile_picture_url" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT (now())
);

CREATE TABLE "properties" (
  "id" VARCHAR(255) PRIMARY KEY, -- Using string ID from frontend
  "user_id" INTEGER NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "property_data" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT (now()),
  "updated_at" TIMESTAMPTZ DEFAULT (now())
);

-- Add a function to automatically update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON properties
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

*/


const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
    console.log('Connected to the database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // FIX: Replace process.exit with throw to terminate the process on fatal error, avoiding a type error.
    throw err;
});

export const query = (text: string, params?: any[]) => pool.query(text, params);