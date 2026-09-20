import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TextareaInput } from "./textarea-input";

const meta: Meta<typeof TextareaInput> = {
  title: "UI/TextareaInput",
  component: TextareaInput,
};
export default meta;
type Story = StoryObj<typeof TextareaInput>;

export const Default: Story = {
  args: { placeholder: "Observações internas sobre o produto..." },
};
