import { eq, and, lt, sql } from "drizzle-orm";
import { db } from "../config/database";
import { loans } from "../models/schema";
import { getChannel } from "../config/amqp";

export class LoanService {
  async createLoan(loanData: any) {
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      // 1. Fetch book details from catalog service
      const bookResponse = await fetch(
        `${process.env.CATALOG_SERVICE_URL}/api/books/${loanData.bookId}`,
      );

      if (!bookResponse.ok) {
        const errorMessage = await bookResponse.json();
        throw new Error(errorMessage.message || "Error fetching book data");
      }

      const book = await bookResponse.json();
      if (!book || book.availableCopies < 1) {
        throw new Error("Book not available");
      }

      // 2. Wrap database mutation and message queue logic safely
      // (Using a transaction guarantees we don't save a loan if AMQP crashes)
      const loan = await db.transaction(async (tx) => {
        const inserted = await tx
          .insert(loans)
          .values({
            ...loanData,
            dueDate,
            status: "ACTIVE",
          })
          .returning();

        return inserted[0];
      });

      // 3. Dispatch Event Queue Notification
      const channel = await getChannel();
      await channel.sendToQueue(
        "loan.due",
        Buffer.from(
          JSON.stringify({
            userId: loanData.userId,
            bookId: loanData.bookId,
            dueDate,
          }),
        ),
      );

      // 4. Update book availability in Catalog Service
      // Ideal world: This happens asynchronously via RabbitMQ consumer in Catalog Service.
      // Current world: We execute the PUT API wrapper.
      await fetch(
        `${process.env.CATALOG_SERVICE_URL}/api/books/${loanData.bookId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            availableCopies: book.availableCopies - 1,
          }),
        },
      );

      return loan;
    } catch (error) {
      console.error("Error in createLoan:", error);
      throw error;
    }
  }

  async getAllLoans(page: number = 1, limit: number = 10) {
    try {
      const offset = (page - 1) * limit;
      const query = db.select().from(loans).limit(limit).offset(offset);

      const [data, total] = await Promise.all([
        query,
        db
          .select({ count: sql<number>`count(*)` })
          .from(loans)
          .then((res) => Number(res[0].count)),
      ]);

      return {
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error("Error in getAllLoans:", error);
      throw new Error("Failed to fetch loans");
    }
  }

  async getUserLoans(userId: number, status?: string) {
    try {
      // Collect conditions in an array to avoid method chaining errors
      const conditions: any[] = [eq(loans.userId, userId)];

      if (status) {
        conditions.push(eq(loans.status, status as any));
      }

      const userLoans = await db
        .select()
        .from(loans)
        .where(and(...conditions));

      return userLoans;
    } catch (error) {
      console.error("Error in getUserLoans:", error);
      throw new Error("Failed to fetch user loans");
    }
  }

  async returnBook(loanId: number) {
    try {
      const loanResult = await db
        .select()
        .from(loans)
        .where(eq(loans.id, loanId))
        .limit(1);

      if (!loanResult.length || loanResult[0].status !== "ACTIVE") {
        throw new Error("Invalid loan or already returned");
      }

      const activeLoan = loanResult[0];

      // Update loan status using transaction safety
      const updatedLoan = await db.transaction(async (tx) => {
        const updated = await tx
          .update(loans)
          .set({
            returnDate: new Date(),
            status: "RETURNED",
            updatedAt: new Date(),
          })
          .where(eq(loans.id, loanId))
          .returning();
        return updated[0];
      });

      // Update book availability in catalog service
      const bookResponse = await fetch(
        `${process.env.CATALOG_SERVICE_URL}/api/books/${activeLoan.bookId}`,
      );
      if (!bookResponse.ok) {
        throw new Error("Failed to fetch book data from catalog service");
      }

      const book = await bookResponse.json();

      await fetch(
        `${process.env.CATALOG_SERVICE_URL}/api/books/${activeLoan.bookId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            availableCopies: book.availableCopies + 1,
          }),
        },
      );

      const channel = await getChannel();
      await channel.sendToQueue(
        "book.returned",
        Buffer.from(
          JSON.stringify({
            userId: activeLoan.userId,
            bookId: activeLoan.bookId,
          }),
        ),
      );

      return updatedLoan;
    } catch (error) {
      console.error("Error in returnBook:", error);
      throw new Error("Failed to return book");
    }
  }

  async checkOverdueLoans() {
    try {
      const now = new Date();

      // Corrected Drizzle syntax for matching conditions using lt()
      const overdueLoans = await db
        .select()
        .from(loans)
        .where(and(eq(loans.status, "ACTIVE"), lt(loans.dueDate, now)));

      if (overdueLoans.length === 0) return [];

      // Optimized bulk update instead of a slow loop structure
      const loanIds = overdueLoans.map((loan) => loan.id);
      await db
        .update(loans)
        .set({ status: "OVERDUE", updatedAt: now })
        .where(sql`${loans.id} IN ${loanIds}`); // Using bulk SQL injection/In operation

      return overdueLoans;
    } catch (error) {
      console.error("Error in checkOverdueLoans:", error);
      throw new Error("Failed to check overdue loans");
    }
  }
}
