import type { Label } from "./types";

export const labels: Label[] = [
  { id: "l-api", name: "api" },
  { id: "l-performance", name: "performance" },
  { id: "l-accessibility", name: "accessibility" },
  { id: "l-security", name: "security" },
  { id: "l-tech-debt", name: "tech-debt" },
  { id: "l-design-system", name: "design-system" },
  { id: "l-mobile", name: "mobile" },
  { id: "l-analytics", name: "analytics" },
  { id: "l-onboarding", name: "onboarding" },
  { id: "l-billing", name: "billing" },
  { id: "l-infra", name: "infra" },
  { id: "l-docs", name: "docs" },
  { id: "l-regression", name: "regression" },
  { id: "l-customer", name: "customer-reported" },
];

export const labelsById = new Map(labels.map((label) => [label.id, label]));

export function getLabel(id: string) {
  return labelsById.get(id);
}
