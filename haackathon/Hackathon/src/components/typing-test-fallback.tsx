import { TestHeader } from "@/components/test-header";

export function TypingTestFallback() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-8 sm:py-14" aria-busy="true">
      <TestHeader />
      <p className="mt-8 font-mono text-sm text-muted-foreground" role="status">
        Picking a sentence…
      </p>
    </main>
  );
}
