import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("utils", () => {
  describe("cn (className merger)", () => {
    it("should merge class names", () => {
      const result = cn("class1", "class2");
      expect(result).toBe("class1 class2");
    });

    it("should handle conditional classes", () => {
      const isActive = true;
      const result = cn("base", isActive && "active");
      expect(result).toBe("base active");
    });

    it("should filter out falsy values", () => {
      const result = cn("base", false, null, undefined, "valid");
      expect(result).toBe("base valid");
    });

    it("should merge tailwind classes correctly", () => {
      const result = cn("p-4", "p-8");
      expect(result).toBe("p-8"); // tailwind-merge should handle this
    });

    it("should handle conflicting tailwind classes", () => {
      const result = cn("bg-red-500", "bg-blue-500");
      expect(result).toBe("bg-blue-500"); // Last one wins
    });

    it("should handle array of classes", () => {
      const result = cn(["class1", "class2"]);
      expect(result).toBe("class1 class2");
    });

    it("should handle object syntax", () => {
      const result = cn({ active: true, disabled: false });
      expect(result).toBe("active");
    });

    it("should handle mixed inputs", () => {
      const result = cn("base", ["array-class"], { "object-class": true });
      expect(result).toBe("base array-class object-class");
    });

    it("should return empty string for no input", () => {
      const result = cn();
      expect(result).toBe("");
    });

    it("should handle empty string input", () => {
      const result = cn("", "class");
      expect(result).toBe("class");
    });

    it("should deduplicate classes", () => {
      const result = cn("flex", "flex");
      expect(result).toBe("flex");
    });

    it("should handle complex tailwind merges", () => {
      const result = cn("text-sm text-gray-500", "text-lg");
      expect(result).toBe("text-gray-500 text-lg");
    });

    it("should handle responsive classes", () => {
      const result = cn("md:p-4", "lg:p-8");
      expect(result).toBe("md:p-4 lg:p-8");
    });

    it("should handle hover states", () => {
      const result = cn("hover:bg-blue-500", "hover:bg-red-500");
      expect(result).toBe("hover:bg-red-500");
    });
  });
});
