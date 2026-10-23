import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  document.head.querySelector('meta[name="server-time"]')?.remove();
  vi.resetModules();
});

async function loadClockWithServerTime(serverTime: number) {
  const meta = document.createElement("meta");
  meta.name = "server-time";
  meta.content = String(serverTime);
  document.head.append(meta);
  return import("./clock");
}

describe("relógio", () => {
  it("corrige o relógio do visitante pela hora do servidor", async () => {
    const { clockNow } = await loadClockWithServerTime(Date.now() + 60_000); // visitante 1 min atrasado

    expect(clockNow() - Date.now()).toBeGreaterThan(59_000);
  });

  it("sem a hora do servidor, usa o relógio local", async () => {
    vi.resetModules();
    const { clockNow } = await import("./clock");

    expect(Math.abs(clockNow() - Date.now())).toBeLessThan(1500);
  });
});
