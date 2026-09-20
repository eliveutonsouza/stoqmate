import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StoreSidebar } from "./store-sidebar";

const meta: Meta<typeof StoreSidebar> = {
  title: "Layout/StoreSidebar",
  component: StoreSidebar,
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof StoreSidebar>;

export const Default: Story = {
  args: { navigate: () => {} },
  render: (args) => (
    <div style={{ height: "100vh" }}>
      <StoreSidebar {...args} />
    </div>
  ),
};
