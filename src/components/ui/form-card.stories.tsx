import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FormCard } from "./form-card";
import { Field } from "./field";
import { TextInput } from "./text-input";

const meta: Meta<typeof FormCard> = {
  title: "UI/FormCard",
  component: FormCard,
};
export default meta;
type Story = StoryObj<typeof FormCard>;

export const Default: Story = {
  render: () => (
    <FormCard title="Identificação" desc="Dados básicos do produto">
      <Field label="Marca" required><TextInput placeholder="Foneclear" /></Field>
      <Field label="Nome do produto" required><TextInput placeholder="Fone Bluetooth ANC" /></Field>
    </FormCard>
  ),
};
