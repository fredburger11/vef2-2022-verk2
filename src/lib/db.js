import { readFile } from 'fs/promises';
import pg from 'pg';
import dotenv from 'dotenv';

const SCHEMA_FILE = './sql/schema.sql';
const DROP_SCHEMA_FILE = './sql/drop.sql';

dotenv.config();

const {
  DATABASE_URL: connectionString,
  NODE_ENV: nodeEnv = 'development'
} = process.env;

if (!connectionString) {
  console.error('vantar DATABASE_URL í .env');
  process.exit(-1);
}

// Notum SSL tengingu við gagnagrunn ef við erum *ekki* í development
// mode, á heroku, ekki á local vél
const ssl = nodeEnv === 'production' ? { rejectUnauthorized: false } : false;

const pool = new pg.Pool({ connectionString, ssl });

pool.on('error', (err) => {
  console.error('Villa í tengingu við gagnagrunn, forrit hættir', err);
  process.exit(-1);
});

export async function query(q, values = []) {
  let client;
  try {
    client = await pool.connect();
  } catch (e) {
    console.error('unable to get client from pool', e);
    return null;
  }

  try {
    const result = await client.query(q, values);
    return result;
  } catch (e) {
    if (nodeEnv !== 'test') {
      console.error('unable to query', e);
    }
    return null;
  } finally {
    client.release();
  }
}

export async function createSchema(schemaFile = SCHEMA_FILE) {
  const data = await readFile(schemaFile);

  return query(data.toString('utf-8'));
}

export async function dropSchema(dropFile = DROP_SCHEMA_FILE) {
  const data = await readFile(dropFile);

  return query(data.toString('utf-8'));
}

export async function end() {
  await pool.end();
}

/* TODO útfæra aðgerðir á móti gagnagrunni */

export async function createComment({ name, email, nationalId, comment }) {
  const q = `
    INSERT INTO
      people(name, email, nationalId, comment)
    VALUES
      ($1, $2, $3, $4)
    RETURNING *`;
  const values = [name, email, nationalId, comment];

  const result = await query(q, values);

  return result !== null;
}

export async function listComments() {
  const q = 'SELECT * from people';

  const result = await query(q);

  if(result) {
    return result.rows;
  }

  return [];
}

