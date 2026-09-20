import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EmptyState } from "./empty-state";
import { I } from "@/components/icons";

const meta: Meta<typeof EmptyState> = {
  title: "UI/EmptyState",
  component: EmptyState,
};
export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    icon: <I.Box size={18} />,
    title: "Nenhum produto cadastrado",
    desc: "Cadastre manualmente ou importe uma planilha para começar.",
    action: <button className="btn btn-primary btn-sm">Cadastrar produto</button>,
  },
};
