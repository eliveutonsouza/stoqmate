import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StoreSidebar } from "./store-sidebar";
import { ShellProvider } from "./shell-context";

const meta: Meta<typeof StoreSidebar> = {
  title: "Layout/StoreSidebar",
  component: StoreSidebar,
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof StoreSidebar>;

export const Default: Story = {
  args: { navigate: () => {} },
  render: (args) => (
    <div style={{ height: "100vh" }}>
      <StoreSidebar {...args} />
    </div>
  ),
};

// Com sessão: nome da empresa, unidade ativa, contadores e menu da conta.
// Perfil vendedor esconde o que ele não alcança (relatórios, configurações).
export const WithSession: Story = {
  args: { navigate: () => {} },
  render: (args) => (
    <ShellProvider
      value={{
        tenant: { id: "t1", name: "Loja Exemplo" },
        stores: [
          { id: "s1", name: "Matriz", type: "loja" },
          { id: "s2", name: "Filial Centro", type: "loja" },
        ],
        activeStore: { id: "s1", name: "Matriz", type: "loja" },
        user: { name: "Pessoa Exemplo", initials: "PE", roleId: "vendedor", role: "Vendedor" },
        counts: {
          products: 120, categories: 4, customers: 35, suppliers: 3, stores: 2,
          open_orders: 1, active_promos: 0, unread_notifications: 2,
        },
        actions: { setActiveStore: async () => ({ ok: true }), signOut: async () => {} },
      }}
    >
      <div style={{ height: "100vh" }}>
        <StoreSidebar {...args} />
      </div>
    </ShellProvider>
  ),
};
