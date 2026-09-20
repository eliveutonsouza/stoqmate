import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppHeader } from "./app-header";

const meta: Meta<typeof AppHeader> = {
  title: "Layout/AppHeader",
  component: AppHeader,
};
export default meta;
type Story = StoryObj<typeof AppHeader>;

export const Loja: Story = {
  args: { breadcrumb: ["Bonsucesso Varejo", "Catálogo", "Produtos"], navigate: () => {}, contextSwitch: "store" },
};

export const Admin: Story = {
  args: { breadcrumb: ["Console", "Redes"], navigate: () => {}, contextSwitch: "admin" },
};
