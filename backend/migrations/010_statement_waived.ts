import type { Knex } from 'knex';

// Reference checks can be "explicitly waived" per PRD F13, but the
// draft_statements.ref_status CHECK constraint only allowed
// not_started/in_review/passed/failed, so the frontend "Waive" action failed
// with a constraint violation. Add 'waived' to the allowed set.
export async function up(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE draft_statements DROP CONSTRAINT IF EXISTS draft_statements_ref_status_check`);
  await knex.raw(`
    ALTER TABLE draft_statements
    ADD CONSTRAINT draft_statements_ref_status_check
    CHECK (ref_status = ANY (ARRAY['not_started','in_review','passed','failed','waived']))
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Revert any waived rows so the stricter constraint can be re-applied.
  await knex.raw(`UPDATE draft_statements SET ref_status = 'not_started' WHERE ref_status = 'waived'`);
  await knex.raw(`ALTER TABLE draft_statements DROP CONSTRAINT IF EXISTS draft_statements_ref_status_check`);
  await knex.raw(`
    ALTER TABLE draft_statements
    ADD CONSTRAINT draft_statements_ref_status_check
    CHECK (ref_status = ANY (ARRAY['not_started','in_review','passed','failed']))
  `);
}
