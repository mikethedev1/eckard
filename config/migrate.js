const pool = require('./db');

const migrate = async () => {
  const connection = await pool.getConnection();

  try {
    console.log('🚀 Running migrations...');
    await connection.beginTransaction();

    // ─── USERS ───────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        uuid        VARCHAR(36)   NOT NULL UNIQUE DEFAULT (UUID()),
        first_name  VARCHAR(100)  NOT NULL,
        last_name   VARCHAR(100)  NOT NULL,
        email       VARCHAR(255)  NOT NULL UNIQUE,
        phone       VARCHAR(30),
        password    VARCHAR(255)  NOT NULL,
        role        ENUM('user','admin') NOT NULL DEFAULT 'user',
        balance     DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        status      ENUM('active','banned','suspended') NOT NULL DEFAULT 'active',
        avatar      VARCHAR(500),
        country     VARCHAR(100),
        address     TEXT,
        kyc_status  ENUM('unverified','pending','verified','rejected') DEFAULT 'unverified',
        last_login  DATETIME,
        created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at  DATETIME      DEFAULT NULL,
        INDEX idx_email (email),
        INDEX idx_role  (role),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ users table');

    // ─── PLANS ───────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        name         VARCHAR(150)  NOT NULL,
        description  TEXT,
        min_amount   DECIMAL(15,2) NOT NULL,
        max_amount   DECIMAL(15,2) NOT NULL,
        roi_min      DECIMAL(5,2)  NOT NULL COMMENT 'ROI % minimum',
        roi_max      DECIMAL(5,2)  NOT NULL COMMENT 'ROI % maximum',
        duration_days INT          NOT NULL COMMENT 'Investment duration in days',
        features     JSON          COMMENT 'JSON array of plan features',
        is_active    TINYINT(1)   NOT NULL DEFAULT 1,
        created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ plans table');

    // ─── INVESTMENTS ─────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS investments (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        uuid          VARCHAR(36)   NOT NULL UNIQUE DEFAULT (UUID()),
        user_id       INT           NOT NULL,
        plan_id       INT           NOT NULL,
        amount        DECIMAL(15,2) NOT NULL,
        roi_rate      DECIMAL(5,2)  NOT NULL COMMENT 'Applied ROI % for this investment',
        profit        DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        total_return  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        status        ENUM('active','completed','cancelled') NOT NULL DEFAULT 'active',
        start_date    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        end_date      DATETIME      NOT NULL,
        completed_at  DATETIME,
        notes         TEXT,
        created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (plan_id) REFERENCES plans(id),
        INDEX idx_user_id (user_id),
        INDEX idx_status  (status),
        INDEX idx_end_date (end_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ investments table');

    // ─── DEPOSITS ────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS deposits (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        uuid           VARCHAR(36)   NOT NULL UNIQUE DEFAULT (UUID()),
        user_id        INT           NOT NULL,
        amount         DECIMAL(15,2) NOT NULL,
        method         VARCHAR(100)  NOT NULL DEFAULT 'bank_transfer',
        proof_image    VARCHAR(500)  COMMENT 'Upload path for payment proof',
        reference      VARCHAR(200)  COMMENT 'Payment reference / txn hash',
        status         ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
        reviewed_by    INT           COMMENT 'Admin user id',
        reviewed_at    DATETIME,
        rejection_reason TEXT,
        notes          TEXT,
        created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES users(id),
        INDEX idx_user_id (user_id),
        INDEX idx_status  (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ deposits table');

    // ─── WITHDRAWALS ─────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        uuid             VARCHAR(36)   NOT NULL UNIQUE DEFAULT (UUID()),
        user_id          INT           NOT NULL,
        amount           DECIMAL(15,2) NOT NULL,
        method           VARCHAR(100)  NOT NULL DEFAULT 'bank_transfer',
        account_details  JSON          NOT NULL COMMENT 'Bank/wallet details',
        status           ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
        reviewed_by      INT,
        reviewed_at      DATETIME,
        rejection_reason TEXT,
        notes            TEXT,
        created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES users(id),
        INDEX idx_user_id (user_id),
        INDEX idx_status  (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ withdrawals table');

    // ─── TRANSACTIONS (ledger) ────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        uuid        VARCHAR(36)   NOT NULL UNIQUE DEFAULT (UUID()),
        user_id     INT           NOT NULL,
        type        ENUM('deposit','withdrawal','investment','profit','refund') NOT NULL,
        amount      DECIMAL(15,2) NOT NULL,
        balance_before DECIMAL(15,2) NOT NULL,
        balance_after  DECIMAL(15,2) NOT NULL,
        reference_id   INT         COMMENT 'FK to deposits/withdrawals/investments id',
        reference_type VARCHAR(50) COMMENT 'deposit | withdrawal | investment',
        description    TEXT,
        status         ENUM('pending','completed','failed') NOT NULL DEFAULT 'completed',
        created_at     DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_type    (type),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ transactions table');

    // ─── SUPPORT TICKETS ─────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        uuid        VARCHAR(36)   NOT NULL UNIQUE DEFAULT (UUID()),
        user_id     INT           NOT NULL,
        subject     VARCHAR(255)  NOT NULL,
        priority    ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
        status      ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
        assigned_to INT           COMMENT 'Admin user id',
        created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        closed_at   DATETIME,
        FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_to) REFERENCES users(id),
        INDEX idx_user_id (user_id),
        INDEX idx_status  (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ support_tickets table');

    // ─── TICKET MESSAGES ─────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ticket_messages (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id  INT           NOT NULL,
        sender_id  INT           NOT NULL,
        message    TEXT          NOT NULL,
        is_admin   TINYINT(1)   NOT NULL DEFAULT 0,
        created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id)  REFERENCES support_tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id)  REFERENCES users(id),
        INDEX idx_ticket_id (ticket_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ ticket_messages table');

    // ─── NOTIFICATIONS ───────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        user_id     INT           NOT NULL COMMENT '0 = broadcast to all',
        title       VARCHAR(255)  NOT NULL,
        message     TEXT          NOT NULL,
        type        ENUM('info','success','warning','error') NOT NULL DEFAULT 'info',
        is_read     TINYINT(1)   NOT NULL DEFAULT 0,
        action_url  VARCHAR(500),
        created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id  (user_id),
        INDEX idx_is_read  (is_read)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ notifications table');

    // ─── ADMIN LOGS ──────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        admin_id    INT           NOT NULL,
        action      VARCHAR(255)  NOT NULL,
        target_type VARCHAR(50)   COMMENT 'user | deposit | withdrawal | plan | investment',
        target_id   INT,
        metadata    JSON,
        ip_address  VARCHAR(50),
        created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES users(id),
        INDEX idx_admin_id (admin_id),
        INDEX idx_action   (action),
        INDEX idx_created  (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ admin_logs table');

    // ─── AUDIT TRAIL ─────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_trail (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        action_type  VARCHAR(100)  NOT NULL,
        performed_by INT           NOT NULL,
        target_table VARCHAR(100),
        target_id    INT,
        old_values   JSON,
        new_values   JSON,
        metadata     JSON,
        ip_address   VARCHAR(50),
        user_agent   VARCHAR(500),
        timestamp    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (performed_by) REFERENCES users(id),
        INDEX idx_performed_by (performed_by),
        INDEX idx_action_type  (action_type),
        INDEX idx_timestamp    (timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ audit_trail table');

    // ─── REFRESH TOKENS ──────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    INT          NOT NULL,
        token      VARCHAR(500) NOT NULL UNIQUE,
        expires_at DATETIME     NOT NULL,
        created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_token   (token(191))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ refresh_tokens table');

    
    await connection.query(`CREATE TABLE IF NOT EXISTS payment_methods (     id           INT AUTO_INCREMENT PRIMARY KEY,     name         VARCHAR(150)  NOT NULL,     type         ENUM('bank_transfer','wire','crypto','other') NOT NULL DEFAULT 'bank_transfer',     icon         VARCHAR(20)   DEFAULT '💳',     description  VARCHAR(500),     details      JSON          NOT NULL COMMENT 'Key-value pairs shown to users',     instructions TEXT          COMMENT 'Extra instructions shown to users',     is_active    TINYINT(1)   NOT NULL DEFAULT 1,     created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,     updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
    console.log('  ✓ payment_methods table');


    await connection.commit();
    console.log('\n✅ All migrations completed successfully!\n');
  } catch (err) {
    await connection.rollback();
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    connection.release();
    process.exit(0);
  }
};

migrate();
