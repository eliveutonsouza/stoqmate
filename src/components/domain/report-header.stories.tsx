import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ReportHeader } from "./report-header";

const meta: Meta<typeof ReportHeader> = {
  title: "Domain/ReportHeader",
  component: ReportHeader,
};
export default meta;
type Story = StoryObj<typeof ReportHeader>;

export const Default: Story = {
  args: { title: "Curva ABC de estoque", sub: "Onde está o dinheiro parado" },
};
