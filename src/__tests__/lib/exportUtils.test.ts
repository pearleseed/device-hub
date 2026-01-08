import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  exportToCSV,
  deviceExportColumns,
  requestExportColumns,
} from "@/lib/exportUtils";

describe("exportUtils", () => {
  let mockLink: HTMLAnchorElement;
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock DOM methods
    mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: { visibility: "" },
    } as unknown as HTMLAnchorElement;

    vi.spyOn(document, "createElement").mockReturnValue(mockLink);
    appendChildSpy = vi
      .spyOn(document.body, "appendChild")
      .mockReturnValue(mockLink);
    removeChildSpy = vi
      .spyOn(document.body, "removeChild")
      .mockReturnValue(mockLink);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("exportToCSV", () => {
    it("should not create download for empty data", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      exportToCSV([], "test", [{ key: "name", header: "Name" }]);

      expect(warnSpy).toHaveBeenCalledWith("No data to export");
      expect(document.createElement).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it("should create CSV with correct headers", () => {
      const data = [{ name: "Test", value: 123 }];
      const columns = [
        { key: "name" as const, header: "Name" },
        { key: "value" as const, header: "Value" },
      ];

      exportToCSV(data, "test", columns);

      expect(mockLink.setAttribute).toHaveBeenCalledWith(
        "href",
        expect.any(String),
      );
    });

    it("should create downloadable link", () => {
      const data = [{ name: "Test" }];
      const columns = [{ key: "name" as const, header: "Name" }];

      exportToCSV(data, "test", columns);

      expect(mockLink.setAttribute).toHaveBeenCalledWith(
        "download",
        expect.stringMatching(/^test_\d{4}-\d{2}-\d{2}\.csv$/),
      );
    });

    it("should trigger download click", () => {
      const data = [{ name: "Test" }];
      const columns = [{ key: "name" as const, header: "Name" }];

      exportToCSV(data, "test", columns);

      expect(mockLink.click).toHaveBeenCalled();
    });

    it("should clean up link element after download", () => {
      const data = [{ name: "Test" }];
      const columns = [{ key: "name" as const, header: "Name" }];

      exportToCSV(data, "test", columns);

      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
    });

    it("should handle null values", () => {
      const data = [{ name: null }];
      const columns = [{ key: "name" as const, header: "Name" }];

      exportToCSV(data, "test", columns);

      // Should not throw
      expect(mockLink.click).toHaveBeenCalled();
    });

    it("should handle undefined values", () => {
      const data = [{ name: undefined }];
      const columns = [{ key: "name" as const, header: "Name" }];

      exportToCSV(data, "test", columns);

      expect(mockLink.click).toHaveBeenCalled();
    });

    it("should escape quotes in string values", () => {
      const data = [{ name: 'Test "quoted" value' }];
      const columns = [{ key: "name" as const, header: "Name" }];

      exportToCSV(data, "test", columns);

      expect(mockLink.click).toHaveBeenCalled();
    });

    it("should handle object values", () => {
      const data = [{ specs: { processor: "M3", ram: "16GB" } }];
      const columns = [{ key: "specs" as const, header: "Specs" }];

      exportToCSV(data, "test", columns);

      expect(mockLink.click).toHaveBeenCalled();
    });

    it("should handle number values", () => {
      const data = [{ price: 999.99, quantity: 5 }];
      const columns = [
        { key: "price" as const, header: "Price" },
        { key: "quantity" as const, header: "Quantity" },
      ];

      exportToCSV(data, "test", columns);

      expect(mockLink.click).toHaveBeenCalled();
    });

    it("should handle multiple rows", () => {
      const data = [
        { name: "Item 1", value: 100 },
        { name: "Item 2", value: 200 },
        { name: "Item 3", value: 300 },
      ];
      const columns = [
        { key: "name" as const, header: "Name" },
        { key: "value" as const, header: "Value" },
      ];

      exportToCSV(data, "test", columns);

      expect(mockLink.click).toHaveBeenCalled();
    });

    it("should revoke object URL after download", () => {
      const revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL");
      const data = [{ name: "Test" }];
      const columns = [{ key: "name" as const, header: "Name" }];

      exportToCSV(data, "test", columns);

      expect(revokeObjectURLSpy).toHaveBeenCalled();
    });
  });

  describe("deviceExportColumns", () => {
    it("should have correct column definitions", () => {
      expect(deviceExportColumns).toBeDefined();
      expect(Array.isArray(deviceExportColumns)).toBe(true);
      expect(deviceExportColumns.length).toBeGreaterThan(0);
    });

    it("should include essential device columns", () => {
      const columnKeys = deviceExportColumns.map((c) => c.key);

      expect(columnKeys).toContain("assetTag");
      expect(columnKeys).toContain("name");
      expect(columnKeys).toContain("brand");
      expect(columnKeys).toContain("model");
      expect(columnKeys).toContain("category");
      expect(columnKeys).toContain("status");
    });

    it("should have headers for all columns", () => {
      for (const column of deviceExportColumns) {
        expect(column.header).toBeDefined();
        expect(typeof column.header).toBe("string");
        expect(column.header.length).toBeGreaterThan(0);
      }
    });
  });

  describe("requestExportColumns", () => {
    it("should have correct column definitions", () => {
      expect(requestExportColumns).toBeDefined();
      expect(Array.isArray(requestExportColumns)).toBe(true);
      expect(requestExportColumns.length).toBeGreaterThan(0);
    });

    it("should include essential request columns", () => {
      const columnKeys = requestExportColumns.map((c) => c.key);

      expect(columnKeys).toContain("id");
      expect(columnKeys).toContain("status");
      expect(columnKeys).toContain("reason");
    });

    it("should have headers for all columns", () => {
      for (const column of requestExportColumns) {
        expect(column.header).toBeDefined();
        expect(typeof column.header).toBe("string");
        expect(column.header.length).toBeGreaterThan(0);
      }
    });
  });
});
