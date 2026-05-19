import { describe, expect, it } from "bun:test";
import { BookService } from "../../src/services/bookService";

describe("BookService", () => {
  describe("createBook", () => {
    it("should create a book successfully", async () => {
      const bookData = {
        title: "Test Book",
        author: "Test Author",
        isbn: "1234567890",
        totalCopies: 5,
        availableCopies: 5,
      };

      const mockDb = {
        insert: () => ({
          values: () => ({
            returning: async () => [{ id: 1, ...bookData }],
          }),
        }),
      };

      const bookService = new BookService(mockDb as any);

      const result = await bookService.createBook(bookData);

      expect(result[0]).toHaveProperty("id");
      expect(result[0].title).toBe(bookData.title);
    });

    it("should throw error on create book failure", async () => {
      const mockDb = {
        insert: () => {
          throw new Error("Database error");
        },
      };

      const bookService = new BookService(mockDb as any);

      await expect(
        bookService.createBook({
          title: "Test Book",
          author: "Test Author",
          isbn: "1234567890",
          totalCopies: 5,
          availableCopies: 5,
        }),
      ).rejects.toThrow("Failed to create book");
    });
  });

  describe("getBooks", () => {
    it("should return books with pagination", async () => {
      const mockBooks = [
        { id: 1, title: "Book 1", author: "Author 1" },
        { id: 2, title: "Book 2", author: "Author 2" },
      ];

      let selectCallCount = 0;

      const mockDb = {
        select: () => {
          selectCallCount += 1;

          if (selectCallCount === 1) {
            return {
              from: () => ({
                limit: () => ({
                  offset: () => ({
                    $dynamic: async () => mockBooks,
                  }),
                }),
              }),
            };
          }

          return {
            from: async () => [
              {
                count: "2",
              },
            ],
          };
        },
      };

      const bookService = new BookService(mockDb as any);

      const result = await bookService.getBooks(1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });

    it("should handle search parameter", async () => {
      const mockBooks = [{ id: 1, title: "Specific Book" }];

      let selectCallCount = 0;

      const mockDb = {
        select: () => {
          selectCallCount += 1;

          if (selectCallCount === 1) {
            return {
              from: () => ({
                limit: () => ({
                  offset: () => ({
                    $dynamic: () => ({
                      where: async () => mockBooks,
                    }),
                  }),
                }),
              }),
            };
          }

          return {
            from: async () => [
              {
                count: "1",
              },
            ],
          };
        },
      };

      const bookService = new BookService(mockDb as any);

      const result = await bookService.getBooks(1, 10, "Specific");

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe("getBookById", () => {
    it("should return a book by id", async () => {
      const mockBook = {
        id: 1,
        title: "Test Book",
        author: "Test Author",
        isbn: "1234567890",
        description: null,
        categoryId: null,
        totalCopies: 5,
        availableCopies: 5,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      };

      const mockDb = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => [mockBook],
            }),
          }),
        }),
      };

      const bookService = new BookService(mockDb as any);

      const result = await bookService.getBookById(1);

      expect(result).toEqual(mockBook);
    });
  });

  describe("updateBook", () => {
    it("should update book successfully", async () => {
      const updateData = {
        title: "Updated Book",
        author: "Updated Author",
      };

      const mockDb = {
        update: () => ({
          set: () => ({
            where: () => ({
              returning: async () => [{ id: 1, ...updateData }],
            }),
          }),
        }),
      };

      const bookService = new BookService(mockDb as any);

      const result = await bookService.updateBook(1, updateData);

      expect(result[0].title).toBe(updateData.title);
    });

    it("should throw error on update failure", async () => {
      const mockDb = {
        update: () => {
          throw new Error("Update failed");
        },
      };

      const bookService = new BookService(mockDb as any);

      await expect(
        bookService.updateBook(1, { title: "New Title" }),
      ).rejects.toThrow("Failed to update book");
    });
  });

  describe("deleteBook", () => {
    it("should delete book successfully", async () => {
      const mockDb = {
        delete: () => ({
          where: () => ({
            returning: async () => [{ id: 1 }],
          }),
        }),
      };

      const bookService = new BookService(mockDb as any);

      const result = await bookService.deleteBook(1);

      expect(result[0]).toHaveProperty("id");
    });

    it("should throw error on delete failure", async () => {
      const mockDb = {
        delete: () => {
          throw new Error("Delete failed");
        },
      };

      const bookService = new BookService(mockDb as any);

      await expect(bookService.deleteBook(1)).rejects.toThrow(
        "Failed to delete book",
      );
    });
  });
});