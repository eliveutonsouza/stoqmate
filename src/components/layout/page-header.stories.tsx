import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { PageHeader } from "./page-header";

const meta: Meta<typeof PageHeader> = {
  title: "Layout/PageHeader",
  component: PageHeader,
};
export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  args: {
    title: "Catálogo",
    sub: "1.688 SKUs em 6 categorias",
    actions: <button className="btn btn-primary btn-sm">Cadastrar produto</button>,
  },
};

export const ComAbas: Story = {
  render: () => {
    const [active, setActive] = useState("geral");
    return (
      <PageHeader
        title="Detalhe do cliente"
        tabs={[
          { id: "geral", label: "Visão geral" },
          { id: "compras", label: "Compras" },
          { id: "credito", label: "Crédito em loja" },
        ]}
        activeTab={active}
        onTab={setActive}
      />
    );
  },
};
