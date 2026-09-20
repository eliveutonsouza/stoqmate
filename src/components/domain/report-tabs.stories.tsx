import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ReportTabs } from "./report-tabs";

const meta: Meta<typeof ReportTabs> = {
  title: "Domain/ReportTabs",
  component: ReportTabs,
};
export default meta;
type Story = StoryObj<typeof ReportTabs>;

export const Default: Story = {
  args: { route: "/reports/sales", navigate: () => {} },
};
