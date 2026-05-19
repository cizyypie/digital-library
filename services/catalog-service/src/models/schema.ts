import { pgTable, serial, varchar, text, integer, timestamp } from 'drizzle-orm/pg-core'

// Specify schema name for catalog service
const catalogSchema = 'public'

export const books = pgTable('books', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  author: varchar('author', { length: 100 }).notNull(),
  isbn: varchar('isbn', { length: 13 }).notNull().unique(),
  description: text('description'),
  categoryId: integer('category_id'),
  totalCopies: integer('total_copies').notNull().default(0),
  availableCopies: integer('available_copies').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => {
  return {
    ...table,
    schema: catalogSchema
  }
})

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => {
  return {
    ...table,
    schema: catalogSchema
  }
})