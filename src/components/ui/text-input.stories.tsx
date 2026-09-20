import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TextInput } from "./text-input";

const meta: Meta<typeof TextInput> = {
  title: "UI/TextInput",
  component: TextInput,
};
export default meta;
type Story = StoryObj<typeof TextInput>;

export const Default: Story = {
  args: { placeholder: "Fone Bluetooth ANC" },
};

export const Mono: Story = {
  args: { mono: true, defaultValue: "ELE-FONE-PR-128" },
};

export const ComPrefixo: Story = {
  args: { prefix: "R$", placeholder: "0,00" },
};
