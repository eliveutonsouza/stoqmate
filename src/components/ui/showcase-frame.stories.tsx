import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ShowcaseFrame } from "./showcase-frame";

const meta: Meta<typeof ShowcaseFrame> = {
  title: "UI/ShowcaseFrame",
  component: ShowcaseFrame,
};
export default meta;
type Story = StoryObj<typeof ShowcaseFrame>;

export const Default: Story = {
  args: {
    width: 800, height: 500, scale: 0.4,
    url: "stoqmate.com.br/dashboard",
    eager: true,
  },
  render: (args) => (
    <ShowcaseFrame {...args}>
      <div style={{ width: "100%", height: "100%", background: "var(--bg-sunken)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
        Tela real renderizada em miniatura
      </div>
    </ShowcaseFrame>
  ),
};

// Container estreito (< 600px): o print vira largura de celular (390px).
export const ModoCelular: Story = {
  args: { ...Default.args, mobileHeight: 520 },
  render: (args) => (
    <div data-fit-root style={{ width: 360 }}>
      <ShowcaseFrame {...args}>
        <div style={{ width: "100%", height: "100%", background: "var(--bg-sunken)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, textAlign: "center", padding: 24 }}>
          Mesma tela, em largura de celular
        </div>
      </ShowcaseFrame>
    </div>
  ),
};
