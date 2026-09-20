import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlanBadge } from "./plan-badge";

const meta: Meta<typeof PlanBadge> = {
  title: "Domain/PlanBadge",
  component: PlanBadge,
};
export default meta;
type Story = StoryObj<typeof PlanBadge>;

export const Balcao: Story = { args: { plan: "Balcão" } };
export const Controle: Story = { args: { plan: "Controle" } };
export const Rede: Story = { args: { plan: "Rede" } };
