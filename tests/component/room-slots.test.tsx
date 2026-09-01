// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoomSlots } from "../../app/components/room-slots";

describe("RoomSlots", () => {
  it("muestra siempre diez espacios y el progreso correcto", () => {
    // Arrange
    const players = [{ userId: "u1", name: "Tom" }, { userId: "u2", name: "hoxhi" }];

    // Act
    render(<RoomSlots players={players} renderPlayer={(player) => <span key={player.userId}>{player.name}</span>} />);

    // Assert
    expect(screen.getByLabelText("2 de 10 jugadores")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
    expect(screen.getAllByLabelText("Slot disponible")).toHaveLength(8);
    expect(screen.getByText("Tom")).toBeInTheDocument();
  });

  it("no renderiza más de diez jugadores", () => {
    // Arrange
    const players = Array.from({ length: 12 }, (_, index) => ({ userId: `u${index}`, name: `P${index}` }));

    // Act
    render(<RoomSlots players={players} renderPlayer={(player) => <span key={player.userId}>{player.name}</span>} />);

    // Assert
    expect(screen.getByLabelText("10 de 10 jugadores")).toBeInTheDocument();
    expect(screen.queryByText("P10")).not.toBeInTheDocument();
    expect(screen.queryAllByLabelText("Slot disponible")).toHaveLength(0);
  });
});
