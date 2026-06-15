import bcrypt from 'bcryptjs';
import type { Knex } from 'knex';
import { db } from '../db';

const BCRYPT_ROUNDS = 12;
const VALID_ROLES = ['AL', 'EM', 'AN', 'QA', 'IR', 'PC', 'RO', 'AD'];

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  display_name: string;
  is_active: boolean;
  roles: string[];
}

// Fetch all users with their roles
export async function listUsers(): Promise<UserRecord[]> {
  const users = await db('users')
    .select('id', 'username', 'email', 'display_name', 'is_active')
    .orderBy('display_name');

  const userIds = users.map((u: { id: string }) => u.id);
  const roleRows = await db('user_roles')
    .whereIn('user_id', userIds)
    .select('user_id', 'role');

  // Group roles by user_id
  const rolesByUser: Record<string, string[]> = {};
  for (const row of roleRows as Array<{ user_id: string; role: string }>) {
    if (!rolesByUser[row.user_id]) rolesByUser[row.user_id] = [];
    rolesByUser[row.user_id].push(row.role);
  }

  return users.map((u: { id: string; username: string; email: string; display_name: string; is_active: boolean }) => ({
    ...u,
    roles: rolesByUser[u.id] ?? [],
  }));
}

// Search active users by name / email / username (for assignment pickers, e.g.
// adding engagement team members). Returns minimal records with roles.
export async function searchUsers(query: string, limit = 20): Promise<UserRecord[]> {
  const like = `%${query}%`;
  const users = await db('users')
    .select('id', 'username', 'email', 'display_name', 'is_active')
    .where('is_active', true)
    .andWhere((qb) =>
      qb
        .whereRaw('display_name ILIKE ?', [like])
        .orWhereRaw('email ILIKE ?', [like])
        .orWhereRaw('username ILIKE ?', [like])
    )
    .orderBy('display_name')
    .limit(limit);

  const userIds = users.map((u: { id: string }) => u.id);
  const roleRows = userIds.length
    ? await db('user_roles').whereIn('user_id', userIds).select('user_id', 'role')
    : [];

  const rolesByUser: Record<string, string[]> = {};
  for (const row of roleRows as Array<{ user_id: string; role: string }>) {
    if (!rolesByUser[row.user_id]) rolesByUser[row.user_id] = [];
    rolesByUser[row.user_id].push(row.role);
  }

  return users.map((u: { id: string; username: string; email: string; display_name: string; is_active: boolean }) => ({
    ...u,
    roles: rolesByUser[u.id] ?? [],
  }));
}

// Create a new user with roles
export async function createUser(data: {
  username: string;
  email: string;
  display_name: string;
  password: string;
  roles: string[];
}): Promise<UserRecord> {
  const { username, email, display_name, password, roles } = data;

  // Validate roles
  const invalidRoles = roles.filter((r) => !VALID_ROLES.includes(r));
  if (invalidRoles.length > 0) {
    throw Object.assign(new Error(`Invalid roles: ${invalidRoles.join(', ')}`), { code: 'INVALID_ROLES', status: 400 });
  }
  if (roles.length === 0) {
    throw Object.assign(new Error('At least one role is required.'), { code: 'NO_ROLES', status: 400 });
  }

  // Check for duplicate username/email
  const existing = await db('users')
    .where(function (this: import('knex').Knex.QueryBuilder) {
      this.where({ username }).orWhere({ email });
    })
    .first();
  if (existing) {
    const field = existing.username === username ? 'username' : 'email';
    throw Object.assign(new Error(`A user with this ${field} already exists.`), { code: 'DUPLICATE', status: 409 });
  }

  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  return await db.transaction(async (trx: Knex.Transaction) => {
    const [user] = await trx('users')
      .insert({ username, email, display_name, password_hash, is_active: true, failed_attempts: 0 })
      .returning(['id', 'username', 'email', 'display_name', 'is_active']);

    await trx('user_roles').insert(roles.map((role) => ({ user_id: user.id, role })));

    return { ...user, roles };
  });
}

// Replace a user's role set atomically
export async function updateUserRoles(userId: string, roles: string[]): Promise<UserRecord> {
  if (roles.length === 0) {
    throw Object.assign(new Error('At least one role is required.'), { code: 'NO_ROLES', status: 400 });
  }
  const invalidRoles = roles.filter((r) => !VALID_ROLES.includes(r));
  if (invalidRoles.length > 0) {
    throw Object.assign(new Error(`Invalid roles: ${invalidRoles.join(', ')}`), { code: 'INVALID_ROLES', status: 400 });
  }

  const user = await db('users').where({ id: userId }).first();
  if (!user) {
    throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND', status: 404 });
  }

  await db.transaction(async (trx: Knex.Transaction) => {
    await trx('user_roles').where({ user_id: userId }).delete();
    await trx('user_roles').insert(roles.map((role) => ({ user_id: userId, role })));
  });

  return { ...user, roles };
}

// Deactivate user (is_active = false)
export async function deactivateUser(userId: string): Promise<UserRecord> {
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND', status: 404 });

  await db('users').where({ id: userId }).update({ is_active: false });
  // Invalidate all sessions
  await db('sessions').where({ user_id: userId }).delete();

  const roles = (await db('user_roles').where({ user_id: userId }).select('role')).map((r: { role: string }) => r.role);
  return { ...user, is_active: false, roles };
}

// Reactivate user (is_active = true)
export async function activateUser(userId: string): Promise<UserRecord> {
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND', status: 404 });

  await db('users').where({ id: userId }).update({ is_active: true, failed_attempts: 0, locked_until: null });

  const roles = (await db('user_roles').where({ user_id: userId }).select('role')).map((r: { role: string }) => r.role);
  return { ...user, is_active: true, roles };
}
