import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Sparkline } from "./sparkline";

const meta: Meta<typeof Sparkline> = {
  title: "Domain/Sparkline",
  component: Sparkline,
};
export default meta;
type Story = StoryObj<typeof Sparkline>;

export const Default: Story = {
  args: { data: [12, 14, 11, 15, 17, 19, 18, 22, 24, 21, 26, 28], color: "var(--success)" },
};
