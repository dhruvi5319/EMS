import type { Knex } from 'knex';

// The requests table stored the intake document as intake_file_ref/intake_filename
// but had no column for the file size, while the service layer expected one.
// Add intake_file_size so the intake-document upload can persist size.
export async function up(knex: Knex): Promise<void> {
  const hasCol = await knex.schema.hasColumn('requests', 'intake_file_size');
  if (!hasCol) {
    await knex.schema.alterTable('requests', (t) => {
      t.bigInteger('intake_file_size').nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasCol = await knex.schema.hasColumn('requests', 'intake_file_size');
  if (hasCol) {
    await knex.schema.alterTable('requests', (t) => t.dropColumn('intake_file_size'));
  }
}
