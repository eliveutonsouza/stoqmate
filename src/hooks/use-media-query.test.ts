import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMediaQuery } from "./use-media-query";

type Listener = (e: { matches: boolean }) => void;

function mockMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<Listener>();
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    get matches() { return matches; },
    media: query,
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    removeEventListener: (_: string, l: Listener) => listeners.delete(l),
  }));
  return {
    set(next: boolean) {
      matches = next;
      listeners.forEach((l) => l({ matches: next }));
    },
    listenerCount: () => listeners.size,
  };
}

describe("useMediaQuery", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("devolve o estado atual da media query", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery("(max-width: 640px)"));
    expect(result.current).toBe(true);
  });

  it("atualiza quando a largura cruza o breakpoint", () => {
    const mq = mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(max-width: 640px)"));
    expect(result.current).toBe(false);
    act(() => mq.set(true));
    expect(result.current).toBe(true);
  });

  it("remove o listener ao desmontar", () => {
    const mq = mockMatchMedia(false);
    const { unmount } = renderHook(() => useMediaQuery("(max-width: 640px)"));
    expect(mq.listenerCount()).toBe(1);
    unmount();
    expect(mq.listenerCount()).toBe(0);
  });
});
