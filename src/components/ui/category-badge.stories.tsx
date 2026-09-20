import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CategoryBadge } from "./category-badge";

const meta: Meta<typeof CategoryBadge> = {
  title: "UI/CategoryBadge",
  component: CategoryBadge,
};
export default meta;
type Story = StoryObj<typeof CategoryBadge>;

export const Default: Story = {
  args: { cat: "eletronicos" },
};

export const SemIcone: Story = {
  args: { cat: "calcados", showIcon: false },
};
