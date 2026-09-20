import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MetricsRow } from "./metrics-row";

const meta: Meta<typeof MetricsRow> = {
  title: "Domain/MetricsRow",
  component: MetricsRow,
};
export default meta;
type Story = StoryObj<typeof MetricsRow>;

export const Default: Story = {
  args: {
    metrics: [
      { label: "Receita do mês", value: "R$ 412.680", delta: "+12,4%", trend: "up", sub: "vs. mês anterior", spark: [12, 14, 11, 15, 17, 19, 18, 22] },
      { label: "Unidades vendidas", value: "4.286", delta: "+8,1%", trend: "up", sub: "1.142 vendas", spark: [10, 12, 11, 13, 14, 12, 15, 18] },
      { label: "Itens em estoque", value: "16.330", delta: "-2,3%", trend: "down", sub: "1.688 SKUs", spark: [25, 24, 24, 23, 22, 21, 21, 20] },
      { label: "Giro de estoque", value: "3,2×", delta: "+0,4", trend: "up", sub: "média 38 dias", spark: [20, 21, 22, 21, 23, 24, 23, 25] },
    ],
  },
};
