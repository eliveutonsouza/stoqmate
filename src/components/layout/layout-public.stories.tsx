import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LayoutPublic } from "./layout-public";

const meta: Meta<typeof LayoutPublic> = {
  title: "Layout/LayoutPublic",
  component: LayoutPublic,
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof LayoutPublic>;

export const Default: Story = {
  args: { navigate: () => {}, route: "/pricing" },
  render: (args) => (
    <LayoutPublic {...args}>
      <div style={{ padding: 40, textAlign: "center" }}>Conteúdo da página pública</div>
    </LayoutPublic>
  ),
};
