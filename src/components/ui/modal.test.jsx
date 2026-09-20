import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Modal } from "./modal";

describe("Modal", () => {
  it("não renderiza nada quando open é false", () => {
    const { container } = render(<Modal open={false} onClose={() => {}} title="Título" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renderiza título, descrição e conteúdo quando aberto", () => {
    render(
      <Modal open onClose={() => {}} title="Confirmar exclusão" desc="Não pode ser desfeita.">
        <p>Conteúdo</p>
      </Modal>
    );
    expect(screen.getByText("Confirmar exclusão")).toBeInTheDocument();
    expect(screen.getByText("Não pode ser desfeita.")).toBeInTheDocument();
    expect(screen.getByText("Conteúdo")).toBeInTheDocument();
  });

  it("chama onClose ao clicar no fundo (backdrop)", () => {
    const onClose = vi.fn();
    const { container } = render(<Modal open onClose={onClose} title="T" />);
    fireEvent.click(container.firstChild);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("não chama onClose ao clicar dentro do conteúdo do modal", () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="T">
        <p>Conteúdo clicável</p>
      </Modal>
    );
    fireEvent.click(screen.getByText("Conteúdo clicável"));
    expect(onClose).not.toHaveBeenCalled();
  });
});
