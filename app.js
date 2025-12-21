// ============================================
// VIPCLINIC API with PostgreSQL Database
// ============================================
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// =======================
// DATABASE CONNECTION
// =======================
// Render will provide DATABASE_URL environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Render's free PostgreSQL
  }
});

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    return false;
  }
}

// =======================
// MIDDLEWARE
// =======================
app.use(express.json());

// =======================
// BASIC ROUTES
// =======================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 VipClinic API with PostgreSQL is running!',
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL on Render'
  });
});

// Health check with database test
app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  
  res.json({
    status: dbConnected ? 'healthy' : 'degraded',
    service: 'VipClinic API',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// =======================
// CREATE DOCTORS TABLE
// =======================
async function createTables() {
  try {
    const client = await pool.connect();
    
    // Doctors table
    await client.query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id SERIAL PRIMARY KEY,
        license_number VARCHAR(50) UNIQUE NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        specialty VARCHAR(100),
        city VARCHAR(50) DEFAULT 'Saida',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Doctors table ready');
    client.release();
  } catch (err) {
    console.error('❌ Table creation failed:', err.message);
  }
}

// =======================
// DOCTOR REGISTRATION ENDPOINT
// =======================
app.post('/api/doctors/register', async (req, res) => {
  try {
    const { license_number, full_name, phone, specialty } = req.body;
    
    // Basic validation
    if (!license_number || !full_name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'License number, full name, and phone are required'
      });
    }
    
    const client = await pool.connect();
    const result = await client.query(
      `INSERT INTO doctors (license_number, full_name, phone, specialty) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, full_name, phone`,
      [license_number, full_name, phone, specialty || 'General']
    );
    
    client.release();
    
    res.json({
      success: true,
      message: 'Doctor registered successfully',
      doctor: result.rows[0]
    });
    
  } catch (err) {
    console.error('Registration error:', err);
    
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        message: 'Doctor with this license or phone already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: err.message
    });
  }
});

// =======================
// START SERVER
// =======================
async function startServer() {
  // Test database connection
  const dbConnected = await testConnection();
  
  if (dbConnected) {
    // Create tables if they don't exist
    await createTables();
  }
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ VipClinic API running on port ${PORT}`);
    console.log(`📊 Database: ${dbConnected ? 'Connected' : 'Disconnected'}`);
  });
}

startServer();
