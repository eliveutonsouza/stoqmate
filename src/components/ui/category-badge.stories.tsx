import { templateById } from "@/lib/category-templates";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CategoryBadge } from "./category-badge";

const meta: Meta<typeof CategoryBadge> = {
  title: "UI/CategoryBadge",
  component: CategoryBadge,
};
export default meta;
type Story = StoryObj<typeof CategoryBadge>;

export const Default: Story = {
  args: { category: templateById("eletronicos") },
};

export const SemIcone: Story = {
  args: { category: templateById("calcados"), showIcon: false },
};
