import type { Metadata } from "next";

import { SellerDashboard } from "@/components/seller/dashboard";

export const metadata: Metadata = { title: "Painel do leiloeiro" };

export default function SellerPage() {
  return <SellerDashboard />;
}
