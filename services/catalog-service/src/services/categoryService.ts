import { eq } from 'drizzle-orm'
import { db } from '../config/database'
import { categories, books } from '../models/schema'

export class CategoryService {
  constructor(private database = db) {}

  async createCategory(data: any) {
    try {
      const category = await this.database
        .insert(categories)
        .values(data)
        .returning();

      return category;
    } catch (error) {
      console.error('Error in createCategory:', error);
      throw new Error('Failed to create category');
    }
  }

  async getCategories() {
    try {
      const categoriesList = await this.database
        .select()
        .from(categories);

      return categoriesList;
    } catch (error) {
      console.error('Error in getCategories:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  async getCategoryById(id: number) {
    try {
      const category = await this.database
        .select()
        .from(categories)
        .where(eq(categories.id, id))
        .limit(1);

      if (!category.length) {
        throw new Error('Category not found');
      }

      return category[0];
    } catch (error) {
      console.error('Error in getCategoryById:', error);
      throw new Error('Failed to fetch category');
    }
  }

  async updateCategory(id: number, data: any) {
    try {
      const updatedCategory = await this.database
        .update(categories)
        .set(data)
        .where(eq(categories.id, id))
        .returning();

      return updatedCategory;
    } catch (error) {
      console.error('Error in updateCategory:', error);
      throw new Error('Failed to update category');
    }
  }

  async deleteCategory(id: number) {
    try {
      const deletedCategory = await this.database
        .delete(categories)
        .where(eq(categories.id, id))
        .returning();

      return deletedCategory;
    } catch (error) {
      console.error('Error in deleteCategory:', error);
      throw new Error('Failed to delete category');
    }
  }

  async getBooksInCategory(id: number) {
    try {
      const booksList = await this.database
        .select()
        .from(books)
        .where(eq(books.categoryId, id));

      return booksList;
    } catch (error) {
      console.error('Error in getBooksInCategory:', error);
      throw new Error('Failed to fetch books in category');
    }
  }
}