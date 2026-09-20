import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SidebarGroup } from "./sidebar-group";
import { I } from "@/components/icons";

const meta: Meta<typeof SidebarGroup> = {
  title: "Layout/SidebarGroup",
  component: SidebarGroup,
};
export default meta;
type Story = StoryObj<typeof SidebarGroup>;

export const Default: Story = {
  args: {
    icon: <I.Sparkle size={15} />,
    label: "IA",
    badge: "12",
    route: "/ai/queue",
    navigate: () => {},
    items: [
      { r: "/ai", l: "Central de IA" },
      { r: "/ai/queue", l: "Fila de revisão", b: "12" },
      { r: "/ai/anomalies", l: "Anomalias", b: "5" },
    ],
  },
};
