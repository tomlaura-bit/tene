import { expect, test, type Page } from "@playwright/test";

const session = {
  user: { email: "tom@example.com", fullName: "Tom", birthDate: "1995-01-01", nickname: "Tom", steamId64: "76561190000000000", steamPersonaName: "Tom", steamAvatarUrl: null, cs2Minutes: 6000, level: 1, status: "verified", role: "player", legalVersion: "2026-08-27", termsAcceptedAt: new Date().toISOString() },
  wallet: { availableCents: 5400, lockedCents: 0, debtCents: 0 },
  rating: { elo: 1000, level: 1, matches: 0, wins: 0, losses: 0, calibrationStatus: "staff_assigned" },
};

async function mockApi(page: Page) {
  await page.route("**/api/me", (route) => route.fulfill({ json: session }));
  await page.route("**/api/public", (route) => route.fulfill({ json: { activePlayers: 0, rooms: [], ranking: [] } }));
  await page.route("**/api/rooms", (route) => route.fulfill({ json: { rooms: [] } }));
  await page.route("**/api/chat?channel=general", (route) => route.fulfill({ json: { messages: [] } }));
}

test("abre salas y conserva la tabla de clasificación al recargar", async ({ page }) => {
  // Arrange
  await mockApi(page);
  await page.goto("/");

  // Act
  await page.getByRole("button", { name: "Ir a mi cuenta" }).click();
  await page.getByRole("button", { name: "Tabla de clasificación" }).click();

  // Assert
  await expect(page.getByRole("heading", { level: 1, name: "Ranking", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/#panel\/clasificacion$/);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Ranking", exact: true })).toBeVisible();
});

test("cada destino principal del menú abre su apartado", async ({ page }) => {
  // Arrange
  await mockApi(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Ir a mi cuenta" }).click();

  // Act + Assert
  for (const [button, heading] of [
    ["Salas", "Elige dónde competir"],
    ["Jugadores baneados", "Jugadores baneados"],
    ["Plus SUB", "Más partidas. Más identidad."],
    ["Tienda PRONTO", "Tienda TENE"],
    ["Cómo jugar", "Cómo jugar"],
    ["Preguntas frecuentes", "Preguntas frecuentes"],
  ]) {
    await page.getByRole("button", { name: button }).click();
    await expect(page.getByRole("heading", { level: 2, name: heading, exact: true })).toBeVisible();
  }
});
