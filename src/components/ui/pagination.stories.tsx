import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { Pagination } from "./pagination";

const meta: Meta<typeof Pagination> = {
  title: "UI/Pagination",
  component: Pagination,
  args: { onPage: fn(), pageSize: 50 },
};
export default meta;
type Story = StoryObj<typeof Pagination>;

export const FirstPage: Story = {
  args: { page: 1, total: 312 },
};

export const MiddlePage: Story = {
  args: { page: 3, total: 312, noun: "produtos" },
};

export const SinglePage: Story = {
  args: { page: 1, total: 12 },
};

export const Loading: Story = {
  args: { page: 2, total: 312, pending: true },
};
