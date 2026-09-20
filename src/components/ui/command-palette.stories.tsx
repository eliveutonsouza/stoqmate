import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CommandPalette } from "./command-palette";

const meta: Meta<typeof CommandPalette> = {
  title: "UI/CommandPalette",
  component: CommandPalette,
  parameters: {
    docs: {
      description: {
        component:
          "Overlay invisível até o atalho ⌘K/Ctrl+K disparar. Abra o painel de interações e pressione Ctrl+K sobre o canvas para ver o resultado.",
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof CommandPalette>;

export const Store: Story = {
  args: { navigate: () => {} },
};

export const Admin: Story = {
  args: { navigate: () => {}, admin: true },
};
