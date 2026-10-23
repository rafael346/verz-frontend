import type { Metadata } from "next";

import { MyBids } from "@/components/bids/my-bids";

export const metadata: Metadata = { title: "Meus arremates" };

export default function MyBidsPage() {
  return <MyBids />;
}
