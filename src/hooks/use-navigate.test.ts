import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

import { useNavigate } from "./use-navigate";

describe("useNavigate", () => {
  beforeEach(() => {
    push.mockClear();
    vi.useFakeTimers();
    Object.defineProperty(window, "scrollTo", { value: vi.fn(), writable: true });
  });

  it("empurra a rota para o router do Next", () => {
    const { result } = renderHook(() => useNavigate());
    act(() => {
      result.current("/dashboard");
    });
    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("reseta o scroll da página e das áreas de conteúdo após navegar", () => {
    const contentArea = document.createElement("div");
    contentArea.setAttribute("data-content-area", "");
    contentArea.scrollTop = 100;
    document.body.appendChild(contentArea);

    const { result } = renderHook(() => useNavigate());
    act(() => {
      result.current("/products");
      vi.advanceTimersByTime(10);
    });

    expect(contentArea.scrollTop).toBe(0);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);

    document.body.removeChild(contentArea);
    vi.useRealTimers();
  });
});
