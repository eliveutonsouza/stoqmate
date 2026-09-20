import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HubCard } from "./hub-card";
import { I } from "@/components/icons";

const meta: Meta<typeof HubCard> = {
  title: "Domain/HubCard",
  component: HubCard,
};
export default meta;
type Story = StoryObj<typeof HubCard>;

export const Default: Story = {
  args: {
    icon: <I.Box size={15} />,
    title: "Catálogo",
    desc: "Produtos, categorias e atributos de todas as lojas.",
    meta: [["SKUs", "1.688"], ["Categorias", "6"]],
    accent: true,
  },
};
