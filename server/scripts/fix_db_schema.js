import pg from 'pg';
const { Client } = pg;

async function run() {
    try {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            console.error('DATABASE_URL environment variable is not set.');
            console.error('Available env vars:', Object.keys(process.env).filter(k => !k.startsWith('npm_')));
            process.exit(1);
        }

        // 2. Connect to DB
        const client = new Client({
            connectionString: connectionString,
            ssl: { rejectUnauthorized: false } // Usually needed for Render/cloud DBs
        });

        await client.connect();
        console.log('Connected to database.');

        // 3. Run Migration
        console.log('Adding feature columns to plans table...');
        await client.query(`
            ALTER TABLE plans 
            ADD COLUMN IF NOT EXISTS can_wholesale BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS can_subject_to BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS can_seller_finance BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS can_brrrr BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS can_access_comparables BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS can_access_projections BOOLEAN DEFAULT FALSE;
        `);
        console.log('Columns added.');

        // 4. Migrate Data
        console.log('Migrating existing data...');
        await client.query(`
            UPDATE plans 
            SET 
                can_wholesale = TRUE,
                can_subject_to = TRUE,
                can_seller_finance = TRUE,
                can_brrrr = TRUE
            WHERE can_use_advanced_strategies = TRUE;
        `);

        await client.query(`
            UPDATE plans 
            SET can_access_comparables = TRUE, can_access_projections = TRUE 
            WHERE key IN ('Pro', 'Team', 'PayAsYouGo');
        `);

        await client.query(`
            UPDATE plans 
            SET can_access_comparables = TRUE 
            WHERE key = 'Experienced';
        `);

        await client.query(`
            UPDATE plans 
            SET can_access_comparables = TRUE 
            WHERE key = 'Starter';
        `);

        console.log('Migration complete.');
        await client.end();
        process.exit(0);

    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

run();
