import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AdminSidebar } from "./admin-sidebar";

const meta: Meta<typeof AdminSidebar> = {
  title: "Layout/AdminSidebar",
  component: AdminSidebar,
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof AdminSidebar>;

export const Default: Story = {
  args: { navigate: () => {} },
  render: (args) => (
    <div style={{ height: "100vh" }}>
      <AdminSidebar {...args} />
    </div>
  ),
};
