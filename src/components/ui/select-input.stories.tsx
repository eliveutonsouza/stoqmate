import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { SelectInput } from "./select-input";

const meta: Meta<typeof SelectInput> = {
  title: "UI/SelectInput",
  component: SelectInput,
};
export default meta;
type Story = StoryObj<typeof SelectInput>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("Preto");
    return (
      <SelectInput
        options={["Preto", "Branco", "Cinza", "Azul Marinho"]}
        value={value}
        onChange={setValue}
        placeholder="Selecione a cor"
      />
    );
  },
};
