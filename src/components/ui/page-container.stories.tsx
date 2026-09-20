import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Page } from "./page-container";

const meta: Meta<typeof Page> = {
  title: "UI/Page",
  component: Page,
};
export default meta;
type Story = StoryObj<typeof Page>;

export const Default: Story = {
  render: () => (
    <Page>
      <div className="card" style={{ padding: 16 }}>Bloco 1</div>
      <div className="card" style={{ padding: 16 }}>Bloco 2</div>
    </Page>
  ),
};
