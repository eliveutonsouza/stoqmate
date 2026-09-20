import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { I } from "./icons";

const meta: Meta = {
  title: "UI/Icons",
};
export default meta;
type Story = StoryObj;

export const Galeria: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 16 }}>
      {Object.entries(I).map(([name, Icon]) => (
        <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, fontSize: 10, color: "var(--fg-muted)" }}>
          <Icon size={18} />
          {name}
        </div>
      ))}
    </div>
  ),
};
