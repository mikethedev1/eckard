const bcrypt = require('bcryptjs');
const pool = require('./db');
require('dotenv').config();

const seed = async () => {
  const connection = await pool.getConnection();
  try {
    console.log('🌱 Seeding database...');
    await connection.beginTransaction();

    // ─── Admin User ───────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123456', 12);
    await connection.query(`
      INSERT IGNORE INTO users
        (first_name, last_name, email, password, role, balance, status)
      VALUES
        ('Eckard', 'Admin', ?, ?, 'admin', 0.00, 'active')
    `, [process.env.ADMIN_EMAIL || 'admin@eckardoil.com', hashedPassword]);
    console.log('  ✓ Default admin user created');

    // ─── Investment Plans ─────────────────────────────────────
    await connection.query(`
      INSERT IGNORE INTO plans
        (id, name, description, min_amount, max_amount, roi_min, roi_max, duration_days, features, is_active)
      VALUES
        (1,
         'Entry Level 1',
         'Starter plan for new investors entering the oil & gas market.',
         2000.00, 19000.00, 10.00, 20.00, 30,
         '["Access to membership/ownership card","Monthly performance reports","Email support","Portfolio tracking dashboard"]',
         1),
        (2,
         'Entry Level 2 – Sweet Spot',
         'Our most popular mid-level plan for serious investors.',
         20000.00, 100000.00, 20.00, 35.00, 45,
         '["All Entry 1 benefits","Profit on producing wells","Additional investment returns","Tax advantage documentation","Priority support","Dedicated account manager"]',
         1),
        (3,
         'Entry Level 3 – High Net Worth',
         'Premium plan with maximum exposure to oil well projects and drilling profits.',
         100000.00, 500000.00, 35.00, 40.00, 180,
         '["All Entry 2 benefits","Direct participation in oil well gains","Drilling project profit sharing","Sharing deals access","Ownership/membership card","Full tax advantage package","Personal relationship manager","Quarterly investor briefings"]',
         1)
      ON DUPLICATE KEY UPDATE
        name         = VALUES(name),
        description  = VALUES(description),
        min_amount   = VALUES(min_amount),
        max_amount   = VALUES(max_amount),
        roi_min      = VALUES(roi_min),
        roi_max      = VALUES(roi_max),
        duration_days= VALUES(duration_days),
        features     = VALUES(features);
    `);
    console.log('  ✓ Investment plans seeded');

    await connection.commit();
    console.log('\n✅ Seeding completed!\n');
    console.log('─────────────────────────────────────────────────');
    console.log('  Admin Email:    ', process.env.ADMIN_EMAIL || 'admin@eckardoil.com');
    console.log('  Admin Password: ', process.env.ADMIN_PASSWORD || 'Admin@123456');
    console.log('  ⚠️  Change these credentials immediately after first login!');
    console.log('─────────────────────────────────────────────────\n');
  } catch (err) {
    await connection.rollback();
    console.error('❌ Seeding failed:', err.message);
    throw err;
  } finally {
    connection.release();
    process.exit(0);
  }
};

seed();
