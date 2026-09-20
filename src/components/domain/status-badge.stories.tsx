import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StatusBadge } from "./status-badge";

const meta: Meta<typeof StatusBadge> = {
  title: "Domain/StatusBadge",
  component: StatusBadge,
};
export default meta;
type Story = StoryObj<typeof StatusBadge>;

export const Ativa: Story = { args: { status: "active" } };
export const Trial: Story = { args: { status: "trial" } };
export const Inadimplente: Story = { args: { status: "past_due" } };
export const Cancelada: Story = { args: { status: "cancelled" } };
