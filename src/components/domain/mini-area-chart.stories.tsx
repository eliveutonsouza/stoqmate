import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MiniAreaChart } from "./mini-area-chart";

const meta: Meta<typeof MiniAreaChart> = {
  title: "Domain/MiniAreaChart",
  component: MiniAreaChart,
};
export default meta;
type Story = StoryObj<typeof MiniAreaChart>;

export const Default: Story = {
  args: {
    data: [10, 12, 11, 14, 13, 16, 18, 17, 20, 22, 21, 24].map((v, i) => ({ d: `M${i + 1}`, v })),
    height: 160,
  },
};
