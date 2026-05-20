// tests/unit/services/loanService.test.ts
import { describe, expect, it, mock, beforeEach } from "bun:test";
import { LoanService } from '../../src/services/loanService';

describe('LoanService', () => {
  let loanService: LoanService;

  beforeEach(() => {
    loanService = new LoanService();
    process.env.CATALOG_SERVICE_URL = 'http://localhost:3002';
  });

  describe('createLoan', () => {
    it('should create loan successfully', async () => {
      const loanData = {
        userId: 1,
        bookId: 1,
      };

      // Mock fetch for book check
      global.fetch = mock(async (url: string, options?: any) => {
        if (url.includes('/api/books/1') && !options?.method) {
          return {
            ok: true,
            json: async () => ({
              id: 1,
              availableCopies: 2
            })
          } as Response;
        }
        // Mock fetch for updating book copies
        if (url.includes('/api/books/1') && options?.method === 'PUT') {
          return {
            ok: true,
            json: async () => ({ success: true })
          } as Response;
        }
        return new Response();
      });

      // Mock RabbitMQ channel
      mock.module('../../../src/config/amqp', () => ({
        getChannel: async () => ({
          sendToQueue: async () => true
        })
      }));

      // Mock database
      mock.module('../../../src/config/database', () => ({
        db: {
          insert: () => ({
            values: () => ({
              returning: () => [{
                id: 1,
                ...loanData,
                status: 'ACTIVE',
                dueDate: new Date(),
                createdAt: new Date()
              }]
            })
          })
        }
      }));

      const result = await loanService.createLoan(loanData);
      expect(result).toHaveProperty('id');
      expect(result.status).toBe('ACTIVE');
    });

    it('should throw error when book not available', async () => {
      // Mock fetch for book with no copies
      global.fetch = mock(async () => ({
        ok: true,
        json: async () => ({
          id: 1,
          availableCopies: 0
        })
      } as Response));

      await expect(loanService.createLoan({ userId: 1, bookId: 1 }))
        .rejects.toThrow('Book not available');
    });
  });

  describe('getAllLoans', () => {
    it('should return paginated loans', async () => {
      const mockLoans = [
        { id: 1, userId: 1, bookId: 1, status: 'ACTIVE' },
        { id: 2, userId: 2, bookId: 2, status: 'ACTIVE' }
      ];

      mock.module('../../../src/config/database', () => ({
        db: {
          select: () => ({
            from: () => ({
              limit: () => ({
                offset: () => mockLoans
              })
            })
          }),
          select: () => ({
            from: () => [{
              count: '2'
            }]
          })
        }
      }));

      const result = await loanService.getAllLoans(1, 10);
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });
  });

  describe('getUserLoans', () => {
    it('should return user loans', async () => {
      const mockLoans = [
        { id: 1, userId: 1, bookId: 1, status: 'ACTIVE' },
        { id: 2, userId: 1, bookId: 2, status: 'RETURNED' }
      ];

      mock.module('../../../src/config/database', () => ({
        db: {
          select: () => ({
            from: () => ({
              where: () => mockLoans
            })
          })
        }
      }));

      const result = await loanService.getUserLoans(1);
      expect(result).toHaveLength(2);
    });

    it('should filter by status', async () => {
      const mockLoans = [
        { id: 1, userId: 1, bookId: 1, status: 'ACTIVE' }
      ];

      mock.module('../../../src/config/database', () => ({
        db: {
          select: () => ({
            from: () => ({
              where: () => ({
                where: () => mockLoans
              })
            })
          })
        }
      }));

      const result = await loanService.getUserLoans(1, 'ACTIVE');
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('ACTIVE');
    });
  });

  describe('returnBook', () => {
    it('should return book successfully', async () => {
      // Mock loan fetch
      mock.module('../../../src/config/database', () => ({
        db: {
          select: () => ({
            from: () => ({
              where: () => ({
                limit: () => [{
                  id: 1,
                  userId: 1,
                  bookId: 1,
                  status: 'ACTIVE'
                }]
              })
            })
          }),
          update: () => ({
            set: () => ({
              where: () => ({
                returning: () => [{
                  id: 1,
                  status: 'RETURNED',
                  returnDate: new Date()
                }]
              })
            })
          })
        }
      }));

      // Mock fetch for book update
      global.fetch = mock(async (url: string) => ({
        ok: true,
        json: async () => ({
          id: 1,
          availableCopies: 1
        })
      } as Response));

      // Mock RabbitMQ channel
      mock.module('../../../src/config/amqp', () => ({
        getChannel: async () => ({
          sendToQueue: async () => true
        })
      }));

      const result = await loanService.returnBook(1);
      expect(result.status).toBe('RETURNED');
      expect(result).toHaveProperty('returnDate');
    });

    it('should throw error for invalid loan', async () => {
      mock.module('../../../src/config/database', () => ({
        db: {
          select: () => ({
            from: () => ({
              where: () => ({
                limit: () => []
              })
            })
          })
        }
      }));

      await expect(loanService.returnBook(999))
        .rejects.toThrow('Invalid loan or already returned');
    });
  });

  describe('checkOverdueLoans', () => {
    it('should update overdue loans', async () => {
      const mockOverdueLoans = [
        { id: 1, userId: 1, bookId: 1, status: 'ACTIVE', dueDate: new Date('2023-01-01') }
      ];

      mock.module('../../../src/config/database', () => ({
        db: {
          select: () => ({
            from: () => ({
              where: () => ({
                where: () => mockOverdueLoans
              })
            })
          }),
          update: () => ({
            set: () => ({
              where: () => ({ success: true })
            })
          })
        }
      }));

      const result = await loanService.checkOverdueLoans();
      expect(result).toHaveLength(1);
    });
  });
});