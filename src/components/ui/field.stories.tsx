import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Field } from "./field";
import { TextInput } from "./text-input";

const meta: Meta<typeof Field> = {
  title: "UI/Field",
  component: Field,
};
export default meta;
type Story = StoryObj<typeof Field>;

export const Default: Story = {
  render: () => (
    <Field label="Nome do produto" hint="Como aparece no catálogo" required>
      <TextInput placeholder="Fone Bluetooth ANC" />
    </Field>
  ),
};

export const ComErro: Story = {
  render: () => (
    <Field label="Preço de venda" error="Preço não pode ser menor que o de compra" required>
      <TextInput placeholder="0,00" />
    </Field>
  ),
};
