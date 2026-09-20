import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AdminShell } from "./admin-shell";

const meta: Meta<typeof AdminShell> = {
  title: "UI/AdminShell",
  component: AdminShell,
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof AdminShell>;

export const Default: Story = {
  args: { navigate: () => {}, breadcrumb: ["Redes"] },
  render: (args) => (
    <AdminShell {...args}>
      <div className="card" style={{ padding: 16 }}>Conteúdo da página</div>
    </AdminShell>
  ),
};
