import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  describe("rendering", () => {
    it("should render children correctly", () => {
      render(<Badge>Badge Text</Badge>);
      expect(screen.getByText("Badge Text")).toBeInTheDocument();
    });

    it("should render as a div element", () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText("Badge");
      expect(badge.tagName.toLowerCase()).toBe("div");
    });
  });

  describe("variants", () => {
    it("should render default variant", () => {
      render(<Badge variant="default">Default</Badge>);
      const badge = screen.getByText("Default");
      expect(badge).toHaveClass("bg-primary");
    });

    it("should render secondary variant", () => {
      render(<Badge variant="secondary">Secondary</Badge>);
      const badge = screen.getByText("Secondary");
      expect(badge).toHaveClass("bg-secondary");
    });

    it("should render destructive variant", () => {
      render(<Badge variant="destructive">Destructive</Badge>);
      const badge = screen.getByText("Destructive");
      expect(badge).toHaveClass("bg-destructive");
    });

    it("should render outline variant", () => {
      render(<Badge variant="outline">Outline</Badge>);
      const badge = screen.getByText("Outline");
      expect(badge).toHaveClass("text-foreground");
    });
  });

  describe("custom className", () => {
    it("should merge custom className with default classes", () => {
      render(<Badge className="custom-class">Badge</Badge>);
      const badge = screen.getByText("Badge");
      expect(badge).toHaveClass("custom-class");
    });

    it("should override default styles with custom className", () => {
      render(<Badge className="bg-green-500">Badge</Badge>);
      const badge = screen.getByText("Badge");
      expect(badge).toHaveClass("bg-green-500");
    });
  });

  describe("styling", () => {
    it("should have rounded corners", () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText("Badge");
      expect(badge).toHaveClass("rounded-full");
    });

    it("should have appropriate padding", () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText("Badge");
      expect(badge).toHaveClass("px-2.5");
      expect(badge).toHaveClass("py-0.5");
    });

    it("should have small font size", () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText("Badge");
      expect(badge).toHaveClass("text-xs");
    });

    it("should have semibold font weight", () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText("Badge");
      expect(badge).toHaveClass("font-semibold");
    });
  });

  describe("accessibility", () => {
    it("should be visible to screen readers", () => {
      render(<Badge>Status</Badge>);
      expect(screen.getByText("Status")).toBeInTheDocument();
    });

    it("should support data attributes", () => {
      render(<Badge data-testid="test-badge">Badge</Badge>);
      expect(screen.getByTestId("test-badge")).toBeInTheDocument();
    });
  });

  describe("use cases", () => {
    it("should work as a status indicator", () => {
      render(
        <Badge variant="default" className="bg-green-500">
          Active
        </Badge>,
      );
      expect(screen.getByText("Active")).toHaveClass("bg-green-500");
    });

    it("should work as a count indicator", () => {
      render(<Badge variant="destructive">99+</Badge>);
      expect(screen.getByText("99+")).toBeInTheDocument();
    });

    it("should work as a category label", () => {
      render(<Badge variant="secondary">Laptop</Badge>);
      expect(screen.getByText("Laptop")).toBeInTheDocument();
    });
  });
});
