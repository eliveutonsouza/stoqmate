import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SettingsLayout } from "./settings-layout";

const meta: Meta<typeof SettingsLayout> = {
  title: "UI/SettingsLayout",
  component: SettingsLayout,
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof SettingsLayout>;

export const Default: Story = {
  args: { navigate: () => {} },
  render: (args) => (
    <SettingsLayout {...args}>
      <div className="card" style={{ padding: 16 }}>Conteúdo da página de configurações</div>
    </SettingsLayout>
  ),
};
