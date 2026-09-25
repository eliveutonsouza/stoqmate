import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ReportHeader } from "./report-header";

const meta: Meta<typeof ReportHeader> = {
  title: "Domain/ReportHeader",
  component: ReportHeader,
};
export default meta;
type Story = StoryObj<typeof ReportHeader>;

const stores = [
  { id: "s1", name: "Loja Centro" },
  { id: "s2", name: "CD Guarulhos" },
];

export const Default: Story = {
  args: {
    title: "Curva ABC de estoque",
    sub: "Onde está o dinheiro parado",
    range: { period: "30d", from: "2026-08-20", to: "2026-09-18", label: "20 ago – 18 set" },
    onRangeChange: fn(),
    stores,
    storeId: null,
    onStoreChange: fn(),
    onExport: fn(),
  },
};

export const StoreSelected: Story = {
  args: { ...Default.args, storeId: "s2" },
};

export const CustomRange: Story = {
  args: {
    ...Default.args,
    range: { period: "custom", from: "2026-09-01", to: "2026-09-10", label: "1 set – 10 set" },
  },
};

export const TitleOnly: Story = {
  args: { title: "Atributos mais vendidos" },
};
