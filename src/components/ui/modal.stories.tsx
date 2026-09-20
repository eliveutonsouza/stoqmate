import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Modal } from "./modal";

const meta: Meta<typeof Modal> = {
  title: "UI/Modal",
  component: Modal,
};
export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Confirmar exclusão"
        desc="Esta ação não pode ser desfeita."
        footer={<button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancelar</button>}
      >
        <p>Conteúdo do modal.</p>
      </Modal>
    );
  },
};
