import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SidebarSection } from "./sidebar-section";
import { SidebarItem } from "./sidebar-item";
import { I } from "@/components/icons";

const meta: Meta<typeof SidebarSection> = {
  title: "Layout/SidebarSection",
  component: SidebarSection,
};
export default meta;
type Story = StoryObj<typeof SidebarSection>;

export const Default: Story = {
  render: () => (
    <SidebarSection label="Operação">
      <SidebarItem icon={<I.Truck size={15} />} label="Compras" badge="7" />
      <SidebarItem icon={<I.Users size={15} />} label="Fornecedores" badge="6" />
    </SidebarSection>
  ),
};
