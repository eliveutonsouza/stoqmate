import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FormPageFooter } from "./form-page-footer";

const meta: Meta<typeof FormPageFooter> = {
  title: "UI/FormPageFooter",
  component: FormPageFooter,
};
export default meta;
type Story = StoryObj<typeof FormPageFooter>;

export const Default: Story = {
  args: {
    onCancel: () => {},
    onSave: () => {},
    saveLabel: "Salvar fornecedor",
  },
};
