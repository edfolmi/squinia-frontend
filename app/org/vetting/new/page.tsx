import type { Metadata } from "next";

import { VettingCreateClient } from "./vetting-create-client";

export const metadata: Metadata = {
  title: "New Vetting Assessment - Squinia",
  description: "Create a Squinia Vetting assessment.",
};

export default function NewVettingAssessmentPage() {
  return <VettingCreateClient />;
}
