import { eq } from 'drizzle-orm'
import { db } from '../config/database'
import { users } from '../models/schema'
import { hash, compare } from 'bcrypt'

export class UserService {
  async createUser(userData: any) {
    try {
        const hashedPassword = await hash(userData.password, 10);
        const user = await db.insert(users).values({
            ...userData,
            password: hashedPassword,
        }).returning();
        return user;
    } catch (error) {
        console.error('Error in createUser:', error);
        throw new Error('Failed to create user');
    }
  }

  async loginUser(email: string, password: string) {
    try {
        const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user.length) {
            throw new Error('User not found');
        }

        const isValid = await compare(password, user[0].password);
        if (!isValid) {
            throw new Error('Invalid password');
        }

        return user[0];
    } catch (error) {
        console.error('Error in loginUser:', error);
        throw new Error('Failed to login user');
    }
  }

  async getUserById(id: number) {
    try {
        const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
        if (!user.length) {
            throw new Error('User not found');
        }
        return user[0];
    } catch (error) {
        console.error('Error in getUserById:', error);
        throw new Error('Failed to fetch user');
      }
}

  async updateUser(id: number, userData: any) {
    try {
        if (userData.password) {
            userData.password = await hash(userData.password, 10);
        }
        const updatedUser = await db.update(users)
            .set(userData)
            .where(eq(users.id, id))
            .returning();
        return updatedUser;
    } catch (error) {
        console.error('Error in updateUser:', error);
        throw new Error('Failed to update user');
    }
  }

}