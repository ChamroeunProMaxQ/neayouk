import { randomUUID } from 'node:crypto';
import type { DataSource } from 'typeorm';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);

  // Update default branch with sample school branding and receipt terms
  const mainBranch = (
    await dataSource.query(`SELECT id FROM branches WHERE code = 'MAIN' LIMIT 1`)
  )[0];

  if (mainBranch) {
    await dataSource.query(
      `UPDATE branches 
       SET name_khmer = $1, 
           motto = $2, 
           website = $3, 
           phone = COALESCE(phone, '023 888 999'),
           address = COALESCE(address, 'No. 123, Confederation de Russie, Phnom Penh'),
           receipt_footer_terms = $4,
           receipt_signature_title = $5
       WHERE id = $6`,
      [
        'មជ្ឈមណ្ឌលសិក្សា អ៊ី អិល ស៊ី',
        'Morality Quality Virtue',
        'https://neayouk.edu.kh',
        '1. Payments are non-refundable after class commencement.\n2. Official school receipt must be retained for verification and tax claims.\n3. Late fees may apply for installments overdue beyond 7 days.',
        'Authorized Cashier',
        mainBranch.id,
      ],
    );

    // Create default mock branch integration row if not exists
    const existingIntegration = (
      await dataSource.query(`SELECT id FROM branch_integrations WHERE branch_id = $1 AND provider = 'TELEGRAM' LIMIT 1`, [mainBranch.id])
    )[0];

    if (!existingIntegration) {
      await dataSource.query(
        `INSERT INTO branch_integrations (
           uuid, branch_id, provider, is_enabled, default_chat_id, 
           attendance_chat_id, payment_chat_id, leave_chat_id, announcement_chat_id,
           notification_events, last_test_status, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
        [
          randomUUID(),
          mainBranch.id,
          'TELEGRAM',
          false,
          '-1001234567890',
          '-1001234567891',
          '-1001234567892',
          '-1001234567893',
          '-1001234567894',
          JSON.stringify({ attendance: true, payment: true, leave: true, announcement: false }),
          'NOT_TESTED',
        ],
      );
    }
  }
};

export const down: MigrationFn<DataSource> = async ({ context }) => {
  const dataSource = await (typeof context === 'function' ? (context as () => Promise<DataSource>)() : context);

  await dataSource.query(`
    DELETE FROM branch_integrations WHERE provider = 'TELEGRAM';
  `);
};
