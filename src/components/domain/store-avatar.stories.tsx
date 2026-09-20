import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StoreAvatar } from "./store-avatar";

const meta: Meta<typeof StoreAvatar> = {
  title: "Domain/StoreAvatar",
  component: StoreAvatar,
};
export default meta;
type Story = StoryObj<typeof StoreAvatar>;

export const Default: Story = {
  args: { name: "Bonsucesso Varejo" },
};
