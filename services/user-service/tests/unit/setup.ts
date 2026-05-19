import { mock } from "bun:test";

// Global mock for bcrypt
mock.module('bcrypt', () => ({
  hash: () => Promise.resolve('hashed_password_123'),
  compare: () => Promise.resolve(true)
}));

// Global mock for database if needed
mock.module('../src/config/database', () => ({
  db: {
    insert: () => ({
      values: () => ({
        returning: () => []
      })
    }),
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => []
        })
      })
    })
  }
}));