import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Field } from "./field";

describe("Field", () => {
  it("renderiza o label e os children", () => {
    render(
      <Field label="Nome">
        <input defaultValue="Fone Bluetooth ANC" />
      </Field>
    );
    expect(screen.getByText("Nome")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Fone Bluetooth ANC")).toBeInTheDocument();
  });

  it("mostra o asterisco quando required", () => {
    render(<Field label="Marca" required><input /></Field>);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("mostra a mensagem de erro no lugar da dica quando ambos existem", () => {
    render(<Field label="Preço" hint="Dica" error="Campo obrigatório"><input /></Field>);
    expect(screen.getByText("Campo obrigatório")).toBeInTheDocument();
    expect(screen.queryByText("Dica")).not.toBeInTheDocument();
  });
});
