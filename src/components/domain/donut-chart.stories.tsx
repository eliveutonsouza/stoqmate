import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DonutChart } from "./donut-chart";

const meta: Meta<typeof DonutChart> = {
  title: "Domain/DonutChart",
  component: DonutChart,
};
export default meta;
type Story = StoryObj<typeof DonutChart>;

export const Default: Story = {
  args: {
    segments: [
      { value: 68, color: "var(--accent)" },
      { value: 34, color: "var(--fg)" },
      { value: 25, color: "var(--bg-sunken)" },
    ],
    center: <div style={{ textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 600 }}>127</div><div style={{ fontSize: 10 }}>LOJAS</div></div>,
  },
};
