import { describe, expect, it, mock, beforeEach, afterEach } from "bun:test";
import { LoanService } from "../../src/services/loanService";

let mockChannel: any;

const jsonResponse = (body: any, ok = true) =>
  ({
    ok,
    json: async () => body,
  }) as Response;

const thenable = <T>(value: T) => ({
  then: (resolve: (value: T) => any, reject?: (reason: any) => any) =>
    Promise.resolve(value).then(resolve, reject),
});

describe("LoanService", () => {
  beforeEach(() => {
    process.env.CATALOG_SERVICE_URL = "http://localhost:3002";

    mockChannel = {
      sendToQueue: mock(async () => true),
    };

    global.fetch = mock(async () => jsonResponse({})) as any;
  });

  afterEach(() => {
    mock.clearAllMocks();
  });

  describe("createLoan", () => {
    it("should create loan successfully", async () => {
      const loanData = {
        userId: 1,
        bookId: 1,
      };

      global.fetch = mock(
        async (url: string | URL | Request, options?: RequestInit) => {
          const urlString = String(url);

          if (urlString.includes("/api/books/1") && !options?.method) {
            return jsonResponse({
              id: 1,
              availableCopies: 2,
            });
          }

          if (urlString.includes("/api/books/1") && options?.method === "PUT") {
            return jsonResponse({
              success: true,
            });
          }

          return jsonResponse({});
        },
      ) as any;

      const mockDb = {
        transaction: mock(async (callback: any) => {
          return callback({
            insert: mock(() => ({
              values: mock(() => ({
                returning: mock(async () => [
                  {
                    id: 1,
                    userId: 1,
                    bookId: 1,
                    status: "ACTIVE",
                    dueDate: new Date(),
                    createdAt: new Date(),
                  },
                ]),
              })),
            })),
          });
        }),
      };

      const loanService = new LoanService(mockDb as any, async () => mockChannel);

      const result = await loanService.createLoan(loanData);

      expect(result).toHaveProperty("id");
      expect(result.status).toBe("ACTIVE");
      expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(1);
    });

    it("should throw error when book not available", async () => {
      global.fetch = mock(async () =>
        jsonResponse({
          id: 1,
          availableCopies: 0,
        }),
      ) as any;

      const mockDb = {};

      const loanService = new LoanService(mockDb as any, async () => mockChannel);

      await expect(
        loanService.createLoan({
          userId: 1,
          bookId: 1,
        }),
      ).rejects.toThrow("Book not available");
    });
  });

  describe("getAllLoans", () => {
    it("should return paginated loans", async () => {
      const mockLoans = [
        {
          id: 1,
          userId: 1,
          bookId: 1,
          status: "ACTIVE",
        },
        {
          id: 2,
          userId: 2,
          bookId: 2,
          status: "ACTIVE",
        },
      ];

      const mockDb = {
        select: mock((fields?: any) => {
          if (fields?.count) {
            return {
              from: mock(() => thenable([{ count: "2" }])),
            };
          }

          return {
            from: mock(() => ({
              limit: mock(() => ({
                offset: mock(() => mockLoans),
              })),
            })),
          };
        }),
      };

      const loanService = new LoanService(mockDb as any, async () => mockChannel);

      const result = await loanService.getAllLoans(1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe("getUserLoans", () => {
    it("should return user loans", async () => {
      const mockLoans = [
        {
          id: 1,
          userId: 1,
          bookId: 1,
          status: "ACTIVE",
        },
        {
          id: 2,
          userId: 1,
          bookId: 2,
          status: "RETURNED",
        },
      ];

      const mockDb = {
        select: mock(() => ({
          from: mock(() => ({
            where: mock(async () => mockLoans),
          })),
        })),
      };

      const loanService = new LoanService(mockDb as any, async () => mockChannel);

      const result = await loanService.getUserLoans(1);

      expect(result).toHaveLength(2);
    });

    it("should filter by status", async () => {
      const mockLoans = [
        {
          id: 1,
          userId: 1,
          bookId: 1,
          status: "ACTIVE",
        },
      ];

      const mockDb = {
        select: mock(() => ({
          from: mock(() => ({
            where: mock(async () => mockLoans),
          })),
        })),
      };

      const loanService = new LoanService(mockDb as any, async () => mockChannel);

      const result = await loanService.getUserLoans(1, "ACTIVE");

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("ACTIVE");
    });
  });

  describe("returnBook", () => {
    it("should return book successfully", async () => {
      global.fetch = mock(
        async (url: string | URL | Request, options?: RequestInit) => {
          const urlString = String(url);

          if (urlString.includes("/api/books/1") && !options?.method) {
            return jsonResponse({
              id: 1,
              availableCopies: 1,
            });
          }

          if (urlString.includes("/api/books/1") && options?.method === "PUT") {
            return jsonResponse({
              success: true,
            });
          }

          return jsonResponse({});
        },
      ) as any;

      const mockDb = {
        select: mock(() => ({
          from: mock(() => ({
            where: mock(() => ({
              limit: mock(async () => [
                {
                  id: 1,
                  userId: 1,
                  bookId: 1,
                  status: "ACTIVE",
                },
              ]),
            })),
          })),
        })),

        transaction: mock(async (callback: any) => {
          return callback({
            update: mock(() => ({
              set: mock(() => ({
                where: mock(() => ({
                  returning: mock(async () => [
                    {
                      id: 1,
                      userId: 1,
                      bookId: 1,
                      status: "RETURNED",
                      returnDate: new Date(),
                    },
                  ]),
                })),
              })),
            })),
          });
        }),
      };

      const loanService = new LoanService(mockDb as any, async () => mockChannel);

      const result = await loanService.returnBook(1);

      expect(result.status).toBe("RETURNED");
      expect(result).toHaveProperty("returnDate");
      expect(mockChannel.sendToQueue).toHaveBeenCalledTimes(1);
    });

    it("should throw error for invalid loan", async () => {
      const mockDb = {
        select: mock(() => ({
          from: mock(() => ({
            where: mock(() => ({
              limit: mock(async () => []),
            })),
          })),
        })),
      };

      const loanService = new LoanService(mockDb as any, async () => mockChannel);

      await expect(loanService.returnBook(999)).rejects.toThrow(
        "Invalid loan or already returned",
      );
    });
  });

  describe("checkOverdueLoans", () => {
    it("should update overdue loans", async () => {
      const mockOverdueLoans = [
        {
          id: 1,
          userId: 1,
          bookId: 1,
          status: "ACTIVE",
          dueDate: new Date("2023-01-01"),
        },
      ];

      const mockDb = {
        select: mock(() => ({
          from: mock(() => ({
            where: mock(async () => mockOverdueLoans),
          })),
        })),

        update: mock(() => ({
          set: mock(() => ({
            where: mock(async () => ({ success: true })),
          })),
        })),
      };

      const loanService = new LoanService(mockDb as any, async () => mockChannel);

      const result = await loanService.checkOverdueLoans();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("ACTIVE");
    });
  });
});