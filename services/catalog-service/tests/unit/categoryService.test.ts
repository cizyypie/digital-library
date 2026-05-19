import { describe, expect, it } from "bun:test";
  import { CategoryService } from "../../src/services/categoryService";
  
  describe("CategoryService", () => {
    describe("createCategory", () => {
      it("should create category successfully", async () => {
        const categoryData = {
          name: "Test Category",
          description: "Test Description",
        };
  
        const mockDb = {
          insert: () => ({
            values: () => ({
              returning: async () => [{ id: 1, ...categoryData }],
            }),
          }),
        };
  
        const categoryService = new CategoryService(mockDb as any);
  
        const result = await categoryService.createCategory(categoryData);
  
        expect(result[0]).toHaveProperty("id");
        expect(result[0].name).toBe(categoryData.name);
      });
    });
  
    describe("getCategories", () => {
      it("should return all categories", async () => {
        const mockCategories = [
          { id: 1, name: "Category 1" },
          { id: 2, name: "Category 2" },
        ];
  
        const mockDb = {
          select: () => ({
            from: async () => mockCategories,
          }),
        };
  
        const categoryService = new CategoryService(mockDb as any);
  
        const result = await categoryService.getCategories();
  
        expect(result).toHaveLength(2);
      });
    });
  
    describe("getCategoryById", () => {
      it("should return category by id", async () => {
        const mockCategory = {
          id: 1,
          name: "Test Category",
        };
  
        const mockDb = {
          select: () => ({
            from: () => ({
              where: () => ({
                limit: async () => [mockCategory],
              }),
            }),
          }),
        };
  
        const categoryService = new CategoryService(mockDb as any);
  
        const result = await categoryService.getCategoryById(1);
  
        expect(result).toMatchObject(mockCategory);
      });
    });
  
    describe("updateCategory", () => {
      it("should update category successfully", async () => {
        const updateData = {
          name: "Updated Category",
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
  
        const categoryService = new CategoryService(mockDb as any);
  
        const result = await categoryService.updateCategory(1, updateData);
  
        expect(result[0].name).toBe(updateData.name);
      });
    });
  
    describe("deleteCategory", () => {
      it("should delete category successfully", async () => {
        const mockDb = {
          delete: () => ({
            where: () => ({
              returning: async () => [{ id: 1 }],
            }),
          }),
        };
  
        const categoryService = new CategoryService(mockDb as any);
  
        const result = await categoryService.deleteCategory(1);
  
        expect(result[0]).toHaveProperty("id");
      });
    });
  
    describe("getBooksInCategory", () => {
      it("should return books in category", async () => {
        const mockBooks = [
          { id: 1, title: "Book 1", categoryId: 1 },
          { id: 2, title: "Book 2", categoryId: 1 },
        ];
  
        const mockDb = {
          select: () => ({
            from: () => ({
              where: async () => mockBooks,
            }),
          }),
        };
  
        const categoryService = new CategoryService(mockDb as any);
  
        const result = await categoryService.getBooksInCategory(1);
  
        expect(result).toHaveLength(2);
      });
    });
  });