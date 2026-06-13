const pool = require('./config/db');
(async () => {
  try {
    const payRules = await pool.query('SELECT * FROM pay_rules ORDER BY id');
    console.log('=== PAY RULES ===');
    console.table(payRules.rows);
    
    // Check columns
    const prCols = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'pay_rules' 
      ORDER BY ordinal_position
    `);
    console.log('=== PAY RULES COLUMNS ===');
    console.table(prCols.rows);
    
    const payrollRules = await pool.query('SELECT * FROM payroll_rules ORDER BY id');
    console.log('=== PAYROLL RULES ===');
    console.table(payrollRules.rows);
    
    const payrollSettings = await pool.query('SELECT * FROM payroll_settings ORDER BY id');
    console.log('=== PAYROLL SETTINGS ===');
    console.table(payrollSettings.rows);
    
    // Check calendar_days columns
    const cdCols = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'calendar_days' 
      ORDER BY ordinal_position
    `);
    console.log('=== CALENDAR DAYS COLUMNS ===');
    console.table(cdCols.rows);
    
    // Check unique constraints on pay_rules
    const constraints = await pool.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) as def
      FROM pg_constraint
      WHERE conrelid = 'pay_rules'::regclass
    `);
    console.log('=== PAY RULES CONSTRAINTS ===');
    console.table(constraints.rows);
    
  } catch (err) { console.error(err.message); }
  finally { pool.end(); }
})();
