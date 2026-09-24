import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RowMenu } from "./row-menu";

const meta: Meta<typeof RowMenu> = {
  title: "UI/RowMenu",
  component: RowMenu,
};
export default meta;
type Story = StoryObj<typeof RowMenu>;

export const Default: Story = {
  render: () => (
    <div style={{ padding: 40, display: "flex", justifyContent: "flex-end", maxWidth: 400 }}>
      <RowMenu
        items={[
          { label: "Ver detalhe", onSelect: () => {} },
          { label: "Editar", onSelect: () => {} },
          { label: "Duplicar", onSelect: () => {} },
          { label: "Desativar", tone: "danger", onSelect: () => {} },
        ]}
      />
    </div>
  ),
};
