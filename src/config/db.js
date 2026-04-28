import pg from "pg";
import dns from "dns";
import dotenv from "dotenv";

dotenv.config();

dns.setDefaultResultOrder("ipv4first");

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === "production";

/**
 * PostgreSQL connection pool — uses Supabase pooler URL with SSL
 * Production: 5 max connections, 10s idle timeout
 * Development: 20 max connections, 30s idle timeout
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: isProduction ? 5 : 20,
  idleTimeoutMillis: isProduction ? 10000 : 30000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false },
});

/**
 * Test the database connection by acquiring and releasing a client
 * @returns {Promise<void>}
 */
export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log("Connected to DB");
    client.release();
  } catch (err) {
    console.error("DB connection failed: ", err.message);
  }
};

export default pool;
