"use client";

import dynamic from "next/dynamic";
import { TypingTestFallback } from "@/components/typing-test-fallback";

const TypingTest = dynamic(
  () => import("@/components/typing-test").then((mod) => mod.TypingTest),
  { ssr: false, loading: () => <TypingTestFallback /> },
);

export default function Home() {
  return <TypingTest />;
}
