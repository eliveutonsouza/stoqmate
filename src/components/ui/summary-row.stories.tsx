import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SummaryRow } from "./summary-row";

const meta: Meta<typeof SummaryRow> = {
  title: "UI/SummaryRow",
  component: SummaryRow,
};
export default meta;
type Story = StoryObj<typeof SummaryRow>;

export const Default: Story = {
  args: { label: "Subtotal", value: "R$ 367,00" },
};

export const Destaque: Story = {
  args: { label: "Total", value: "R$ 367,00", strong: true, tone: "success" },
};
