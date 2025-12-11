
import { query } from '../db.js';

const runMigration = async () => {
    try {
        console.log('Running migration: Adding share_token to properties table...');

        await query(`
            ALTER TABLE properties 
            ADD COLUMN IF NOT EXISTS share_token UUID UNIQUE DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
        `);

        console.log('Migration successful: share_token and is_public columns added.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

runMigration();
