const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'chatuser',
  password: 'chatpassword',
  database: 'chatdb',
});

const initializeDatabase = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id BIGSERIAL PRIMARY KEY,
      room VARCHAR(255) NOT NULL,
      username VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  console.log('PostgreSQL message store initialized');
};

const saveMessage = async ({ room, username, message }) => {
  await pool.query(
    `
      INSERT INTO messages (room, username, message)
      VALUES ($1, $2, $3)
    `,
    [room, username, message]
  );
};

const getRecentMessages = async (room, limit = 50) => {
  const result = await pool.query(
    `
      SELECT id, room, username, message, created_at
      FROM messages
      WHERE room = $1
      ORDER BY created_at DESC
      LIMIT $2
    `,
    [room, limit]
  );

  return result.rows.reverse();
};

module.exports = {
  initializeDatabase,
  saveMessage,
  getRecentMessages,
};