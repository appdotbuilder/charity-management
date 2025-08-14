import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type UpdateUserInput } from '../schema';
import { createUser, getUsers, getUserById, updateUser, deleteUser } from '../handlers/users';
import { eq } from 'drizzle-orm';

describe('User Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createUser', () => {
    it('should create a user with all fields', async () => {
      const input: CreateUserInput = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
        is_active: true
      };

      const result = await createUser(input);

      expect(result.name).toEqual('John Doe');
      expect(result.email).toEqual('john@example.com');
      expect(result.role).toEqual('admin');
      expect(result.is_active).toEqual(true);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create a user with defaults when optional fields are omitted', async () => {
      const input: CreateUserInput = {
        name: 'Jane Doe',
        email: 'jane@example.com'
      };

      const result = await createUser(input);

      expect(result.name).toEqual('Jane Doe');
      expect(result.email).toEqual('jane@example.com');
      expect(result.role).toEqual('user'); // Default value
      expect(result.is_active).toEqual(true); // Default value
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save user to database', async () => {
      const input: CreateUserInput = {
        name: 'Test User',
        email: 'test@example.com',
        role: 'guest',
        is_active: false
      };

      const result = await createUser(input);

      // Verify in database
      const users = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, result.id))
        .execute();

      expect(users).toHaveLength(1);
      expect(users[0].name).toEqual('Test User');
      expect(users[0].email).toEqual('test@example.com');
      expect(users[0].role).toEqual('guest');
      expect(users[0].is_active).toEqual(false);
    });
  });

  describe('getUsers', () => {
    it('should return empty array when no users exist', async () => {
      const result = await getUsers();
      expect(result).toEqual([]);
    });

    it('should return all users', async () => {
      // Create test users
      await createUser({
        name: 'User 1',
        email: 'user1@example.com',
        role: 'admin',
        is_active: true
      });

      await createUser({
        name: 'User 2',
        email: 'user2@example.com',
        role: 'user',
        is_active: false
      });

      const result = await getUsers();

      expect(result).toHaveLength(2);
      expect(result[0].name).toEqual('User 1');
      expect(result[0].role).toEqual('admin');
      expect(result[0].is_active).toEqual(true);
      expect(result[1].name).toEqual('User 2');
      expect(result[1].role).toEqual('user');
      expect(result[1].is_active).toEqual(false);
    });
  });

  describe('getUserById', () => {
    it('should return null when user does not exist', async () => {
      const result = await getUserById({ id: 999 });
      expect(result).toBeNull();
    });

    it('should return user when exists', async () => {
      const createdUser = await createUser({
        name: 'Find Me',
        email: 'findme@example.com',
        role: 'admin',
        is_active: true
      });

      const result = await getUserById({ id: createdUser.id });

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(createdUser.id);
      expect(result!.name).toEqual('Find Me');
      expect(result!.email).toEqual('findme@example.com');
      expect(result!.role).toEqual('admin');
      expect(result!.is_active).toEqual(true);
    });
  });

  describe('updateUser', () => {
    it('should update user fields', async () => {
      const createdUser = await createUser({
        name: 'Original Name',
        email: 'original@example.com',
        role: 'user',
        is_active: true
      });

      const updateInput: UpdateUserInput = {
        id: createdUser.id,
        name: 'Updated Name',
        email: 'updated@example.com',
        role: 'admin',
        is_active: false
      };

      const result = await updateUser(updateInput);

      expect(result.id).toEqual(createdUser.id);
      expect(result.name).toEqual('Updated Name');
      expect(result.email).toEqual('updated@example.com');
      expect(result.role).toEqual('admin');
      expect(result.is_active).toEqual(false);
      expect(result.updated_at.getTime()).toBeGreaterThan(result.created_at.getTime());
    });

    it('should update only provided fields', async () => {
      const createdUser = await createUser({
        name: 'Original Name',
        email: 'original@example.com',
        role: 'user',
        is_active: true
      });

      const updateInput: UpdateUserInput = {
        id: createdUser.id,
        name: 'Only Name Updated'
      };

      const result = await updateUser(updateInput);

      expect(result.name).toEqual('Only Name Updated');
      expect(result.email).toEqual('original@example.com'); // Unchanged
      expect(result.role).toEqual('user'); // Unchanged
      expect(result.is_active).toEqual(true); // Unchanged
    });

    it('should save changes to database', async () => {
      const createdUser = await createUser({
        name: 'Database Test',
        email: 'dbtest@example.com',
        role: 'user',
        is_active: true
      });

      await updateUser({
        id: createdUser.id,
        name: 'Database Updated',
        role: 'admin'
      });

      // Verify in database
      const users = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, createdUser.id))
        .execute();

      expect(users).toHaveLength(1);
      expect(users[0].name).toEqual('Database Updated');
      expect(users[0].role).toEqual('admin');
      expect(users[0].email).toEqual('dbtest@example.com'); // Unchanged
    });

    it('should throw error when user does not exist', async () => {
      const updateInput: UpdateUserInput = {
        id: 999,
        name: 'Non-existent User'
      };

      await expect(updateUser(updateInput)).rejects.toThrow(/User with ID 999 not found/i);
    });
  });

  describe('deleteUser', () => {
    it('should delete existing user', async () => {
      const createdUser = await createUser({
        name: 'To Be Deleted',
        email: 'delete@example.com',
        role: 'user',
        is_active: true
      });

      const result = await deleteUser({ id: createdUser.id });

      expect(result.success).toEqual(true);

      // Verify user is deleted from database
      const users = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, createdUser.id))
        .execute();

      expect(users).toHaveLength(0);
    });

    it('should throw error when user does not exist', async () => {
      await expect(deleteUser({ id: 999 })).rejects.toThrow(/User with ID 999 not found/i);
    });

    it('should not affect other users when deleting one', async () => {
      const user1 = await createUser({
        name: 'Keep Me',
        email: 'keep@example.com',
        role: 'user',
        is_active: true
      });

      const user2 = await createUser({
        name: 'Delete Me',
        email: 'delete@example.com',
        role: 'admin',
        is_active: true
      });

      await deleteUser({ id: user2.id });

      // Verify user1 still exists
      const remainingUser = await getUserById({ id: user1.id });
      expect(remainingUser).not.toBeNull();
      expect(remainingUser!.name).toEqual('Keep Me');

      // Verify user2 is deleted
      const deletedUser = await getUserById({ id: user2.id });
      expect(deletedUser).toBeNull();
    });
  });
});