import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CreditMeter } from "./credit-meter";

const meta: Meta<typeof CreditMeter> = {
  title: "Domain/CreditMeter",
  component: CreditMeter,
};
export default meta;
type Story = StoryObj<typeof CreditMeter>;

export const Confortavel: Story = { args: { used: 1184, total: 1500 } };
export const NoLimite: Story = { args: { used: 1500, total: 1500 } };
