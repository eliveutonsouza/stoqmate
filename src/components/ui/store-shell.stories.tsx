import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StoreShell } from "./store-shell";

const meta: Meta<typeof StoreShell> = {
  title: "UI/StoreShell",
  component: StoreShell,
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof StoreShell>;

export const Default: Story = {
  args: { navigate: () => {}, breadcrumb: ["Catálogo", "Produtos"] },
  render: (args) => (
    <StoreShell {...args}>
      <div className="card" style={{ padding: 16 }}>Conteúdo da página</div>
    </StoreShell>
  ),
};
