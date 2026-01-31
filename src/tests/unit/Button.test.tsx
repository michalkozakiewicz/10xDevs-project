import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button Component", () => {
  // Czyszczenie DOM po każdym teście
  afterEach(() => {
    cleanup();
  });

  it("renderuje button z tekstem", () => {
    render(<Button>Kliknij mnie</Button>);
    expect(screen.getByRole("button", { name: /kliknij mnie/i })).toBeInTheDocument();
  });

  it("wywołuje onClick handler po kliknięciu", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Kliknij</Button>);

    const button = screen.getByRole("button", { name: /kliknij/i });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renderuje disabled button", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button", { name: /disabled/i })).toBeDisabled();
  });

  it("nie wywołuje onClick gdy button jest disabled", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );

    const button = screen.getByRole("button", { name: /disabled/i });
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("renderuje button z różnymi wariantami", () => {
    const { rerender } = render(<Button variant="default">Default</Button>);
    expect(screen.getByRole("button", { name: /default/i })).toBeInTheDocument();

    rerender(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByRole("button", { name: /destructive/i })).toBeInTheDocument();

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole("button", { name: /outline/i })).toBeInTheDocument();
  });
});
