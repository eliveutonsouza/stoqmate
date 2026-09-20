import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SidebarItem } from "./sidebar-item";
import { I } from "@/components/icons";

const meta: Meta<typeof SidebarItem> = {
  title: "Layout/SidebarItem",
  component: SidebarItem,
};
export default meta;
type Story = StoryObj<typeof SidebarItem>;

export const Default: Story = {
  args: { icon: <I.Home size={15} />, label: "Dashboard" },
};

export const Ativo: Story = {
  args: { icon: <I.Home size={15} />, label: "Dashboard", active: true },
};

export const ComBadge: Story = {
  args: { icon: <I.Swap size={15} />, label: "Visão da rede", badge: "4" },
};
