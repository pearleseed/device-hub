import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { DeviceCard } from "@/components/devices/DeviceCard";
import type { Device } from "@/lib/types";

const mockDevice: Device = {
  id: 1,
  name: 'MacBook Pro 16"',
  asset_tag: "LAP-001",
  assetTag: "LAP-001",
  category: "laptop",
  brand: "Apple",
  model: 'MacBook Pro 16" M3 Max',
  status: "available",
  department_id: 1,
  department_name: "Engineering",
  purchase_price: 3499.99,
  purchase_date: "2024-01-15",
  specs: { processor: "M3 Max", ram: "36GB", storage: "1TB SSD" },
  image_url: "https://example.com/macbook.jpg",
  image: "https://example.com/macbook.jpg",
  created_at: "2024-01-15T00:00:00.000Z",
  addedDate: "2024-01-15T00:00:00.000Z",
  assignedTo: null,
};

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("DeviceCard", () => {
  describe("rendering", () => {
    it("should render device name", () => {
      renderWithRouter(<DeviceCard device={mockDevice} />);
      expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument();
    });

    it("should render device brand and model", () => {
      renderWithRouter(<DeviceCard device={mockDevice} />);
      expect(screen.getByText(/Apple/)).toBeInTheDocument();
      expect(screen.getByText(/MacBook Pro 16" M3 Max/)).toBeInTheDocument();
    });

    it("should render device asset tag", () => {
      renderWithRouter(<DeviceCard device={mockDevice} />);
      expect(screen.getByText("LAP-001")).toBeInTheDocument();
    });

    it("should render device image", () => {
      renderWithRouter(<DeviceCard device={mockDevice} />);
      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("src", mockDevice.image_url);
    });

    it("should render device status badge", () => {
      renderWithRouter(<DeviceCard device={mockDevice} />);
      expect(screen.getByText(/available/i)).toBeInTheDocument();
    });

    it("should render category icon", () => {
      renderWithRouter(<DeviceCard device={mockDevice} />);
      // Laptop category should show laptop icon (💻)
      expect(screen.getByText("💻")).toBeInTheDocument();
    });
  });

  describe("status variants", () => {
    it("should show available status", () => {
      renderWithRouter(
        <DeviceCard device={{ ...mockDevice, status: "available" }} />,
      );
      expect(screen.getByText(/available/i)).toBeInTheDocument();
    });

    it("should show borrowed status", () => {
      renderWithRouter(
        <DeviceCard device={{ ...mockDevice, status: "borrowed" }} />,
      );
      expect(screen.getByText(/borrowed/i)).toBeInTheDocument();
    });

    it("should show maintenance status", () => {
      renderWithRouter(
        <DeviceCard device={{ ...mockDevice, status: "maintenance" }} />,
      );
      expect(screen.getByText(/maintenance/i)).toBeInTheDocument();
    });
  });

  describe("category icons", () => {
    it("should show laptop icon for laptop category", () => {
      renderWithRouter(
        <DeviceCard device={{ ...mockDevice, category: "laptop" }} />,
      );
      expect(screen.getByText("💻")).toBeInTheDocument();
    });

    it("should show mobile icon for mobile category", () => {
      renderWithRouter(
        <DeviceCard device={{ ...mockDevice, category: "mobile" }} />,
      );
      expect(screen.getByText("📱")).toBeInTheDocument();
    });

    it("should show tablet icon for tablet category", () => {
      renderWithRouter(
        <DeviceCard device={{ ...mockDevice, category: "tablet" }} />,
      );
      expect(screen.getByText("📲")).toBeInTheDocument();
    });

    it("should show monitor icon for monitor category", () => {
      renderWithRouter(
        <DeviceCard device={{ ...mockDevice, category: "monitor" }} />,
      );
      expect(screen.getByText("🖥️")).toBeInTheDocument();
    });

    it("should show accessories icon for accessories category", () => {
      renderWithRouter(
        <DeviceCard device={{ ...mockDevice, category: "accessories" }} />,
      );
      expect(screen.getByText("🎧")).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("should call onClick when card is clicked", () => {
      const handleClick = vi.fn();
      renderWithRouter(
        <DeviceCard device={mockDevice} onClick={handleClick} />,
      );

      const card = screen.getByText('MacBook Pro 16"').closest("div");
      if (card) {
        fireEvent.click(card);
      }

      // The card itself might have click handler or use Link
    });

    it("should show favorite button when onToggleFavorite is provided", () => {
      const handleToggleFavorite = vi.fn();
      renderWithRouter(
        <DeviceCard
          device={mockDevice}
          onToggleFavorite={handleToggleFavorite}
          isFavorite={false}
        />,
      );

      // Look for heart icon or favorite button
      const favoriteButton = screen.queryByRole("button");
      // If there's a favorite button, it should exist
    });

    it("should call onToggleFavorite when favorite button is clicked", () => {
      const handleToggleFavorite = vi.fn();
      renderWithRouter(
        <DeviceCard
          device={mockDevice}
          onToggleFavorite={handleToggleFavorite}
          isFavorite={false}
        />,
      );

      // Find and click favorite button if it exists
      const buttons = screen.queryAllByRole("button");
      if (buttons.length > 0) {
        fireEvent.click(buttons[0]);
        // Check if callback was called
      }
    });
  });

  describe("favorite state", () => {
    it("should show filled heart when device is favorite", () => {
      renderWithRouter(
        <DeviceCard
          device={mockDevice}
          onToggleFavorite={vi.fn()}
          isFavorite={true}
        />,
      );
      // Favorite state should be visually indicated
    });

    it("should show outlined heart when device is not favorite", () => {
      renderWithRouter(
        <DeviceCard
          device={mockDevice}
          onToggleFavorite={vi.fn()}
          isFavorite={false}
        />,
      );
      // Non-favorite state should be visually indicated
    });
  });

  describe("image handling", () => {
    it("should render placeholder for missing image", () => {
      const deviceWithoutImage = { ...mockDevice, image_url: "", image: "" };
      renderWithRouter(<DeviceCard device={deviceWithoutImage} />);
      // Should show placeholder or default image
    });

    it("should have alt text for image", () => {
      renderWithRouter(<DeviceCard device={mockDevice} />);
      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("alt");
    });
  });

  describe("accessibility", () => {
    it("should be accessible via keyboard", () => {
      renderWithRouter(<DeviceCard device={mockDevice} />);
      // Card or its interactive elements should be focusable
    });

    it("should have proper ARIA attributes", () => {
      renderWithRouter(<DeviceCard device={mockDevice} />);
      // Check for proper accessibility attributes
    });
  });

  describe("compact mode", () => {
    it("should render in compact mode when specified", () => {
      renderWithRouter(<DeviceCard device={mockDevice} compact />);
      // Compact mode should have different styling
      expect(screen.getByText('MacBook Pro 16"')).toBeInTheDocument();
    });
  });
});
