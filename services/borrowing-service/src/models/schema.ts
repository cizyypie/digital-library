import { pgTable, serial, integer, timestamp, text, pgEnum } from 'drizzle-orm/pg-core'

// export const loanStatusEnum = pgEnum('loan_status', ['ACTIVE', 'RETURNED', 'OVERDUE'])

export const loans = pgTable('loans', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  bookId: integer('book_id').notNull(),
  borrowDate: timestamp('borrow_date').defaultNow(),
  dueDate: timestamp('due_date').notNull(),
  returnDate: timestamp('return_date'),
  status: text('status', { enum: ['ACTIVE', 'RETURNED', 'OVERDUE'] }).notNull().default('ACTIVE'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => {
  return {
    ...table,
    schema: 'borrowing_service'
  }
})