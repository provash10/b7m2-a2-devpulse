import { Pool } from "pg";
import config from "../config";

export const pool = new Pool({
  connectionString:config.connection_string,
});

export const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY,
      name VARCHAR(50),
      email VARCHAR(100) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(20) DEFAULT 'contributor'
      CHECK(role IN ('contributor','maintainer')),
      is_active BOOLEAN  DEFAULT true,
      
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
      )
      `);

      await pool.query(`
            CREATE TABLE IF NOT EXISTS issues (
            id SERIAL PRIMARY KEY, 
            title VARCHAR(150) UNIQUE NOT NULL,
            description TEXT NOT NULL CHECK (LENGTH(description) >= 20),
            type VARCHAR(50) NOT NULL CHECK (type IN ('bug', 'feature_request')),
            status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
            reporter_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
            )
            `);
            
    console.log("Database Connected Successfully !!!");
  } catch (error) {
    console.log(error);
  }
};
