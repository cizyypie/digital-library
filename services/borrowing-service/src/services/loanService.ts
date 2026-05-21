import { eq, and, lt, sql } from "drizzle-orm";
import { db } from "../config/database";
import { loans } from "../models/schema";
import { getChannel } from "../config/amqp";

export class LoanService {
  constructor(
    private readonly database = db,
    private readonly getMqChannel = getChannel,
  ) {}

  async createLoan(loanData: any) {
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

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

      const loan = await this.database.transaction(async (tx: any) => {
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

      const channel = await this.getMqChannel();

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

      await fetch(
        `${process.env.CATALOG_SERVICE_URL}/api/books/${loanData.bookId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
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

      const query = this.database
        .select()
        .from(loans)
        .limit(limit)
        .offset(offset);

      const [data, total] = await Promise.all([
        query,
        this.database
          .select({
            count: sql<number>`count(*)`,
          })
          .from(loans)
          .then((res: any[]) => Number(res[0].count)),
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
      const conditions: any[] = [eq(loans.userId, userId)];

      if (status) {
        conditions.push(eq(loans.status, status as any));
      }

      const userLoans = await this.database
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
      const loanResult = await this.database
        .select()
        .from(loans)
        .where(eq(loans.id, loanId))
        .limit(1);

      if (!loanResult.length || loanResult[0].status !== "ACTIVE") {
        throw new Error("Invalid loan or already returned");
      }

      const activeLoan = loanResult[0];

      const updatedLoan = await this.database.transaction(async (tx: any) => {
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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            availableCopies: book.availableCopies + 1,
          }),
        },
      );

      const channel = await this.getMqChannel();

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

      if (error instanceof Error) {
        throw error;
      }

      throw new Error("Failed to return book");
    }
  }

  async checkOverdueLoans() {
    try {
      const now = new Date();

      const overdueLoans = await this.database
        .select()
        .from(loans)
        .where(and(eq(loans.status, "ACTIVE"), lt(loans.dueDate, now)));

      if (overdueLoans.length === 0) {
        return [];
      }

      const loanIds = overdueLoans.map((loan: any) => loan.id);

      await this.database
        .update(loans)
        .set({
          status: "OVERDUE",
          updatedAt: now,
        })
        .where(sql`${loans.id} IN ${loanIds}`);

      return overdueLoans;
    } catch (error) {
      console.error("Error in checkOverdueLoans:", error);
      throw new Error("Failed to check overdue loans");
    }
  }
}