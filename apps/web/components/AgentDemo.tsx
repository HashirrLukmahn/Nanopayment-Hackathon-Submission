"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { runQuery, registerAgent, type QueryResponse } from "@/lib/api";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card, CardBody, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { QueryReceipt } from "./QueryReceipt";

const SAMPLE_QUERIES = [
  "Why does XYZ-441 fail phase I hepatotoxicity screens?",
  "What's a good BERT fine-tuning learning rate for ≤10k labeled examples?",
  "How does NMC811 fade at 45°C?",
  "Which BTK inhibitors show CYP3A4 DDI liabilities?",
];

type Phase = "idle" | "calling-gemini" | "paying-researchers" | "done" | "error";

export function AgentDemo() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [query, setQuery] = useState<string>(SAMPLE_QUERIES[0] ?? '');
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Register a disposable API key for the public demo page.
  // If the user is logged in, the BFF will use their Bearer cookie instead
  // and the X-API-Key is ignored on the backend.
  useEffect(() => {
    const existing = typeof window !== "undefined" ? localStorage.getItem("luqman_api_key") : null;
    if (existing) {
      setApiKey(existing);
      return;
    }
    registerAgent("demo-agent-" + Math.random().toString(36).slice(2, 8))
      .then(({ apiKey }) => {
        localStorage.setItem("luqman_api_key", apiKey);
        setApiKey(apiKey);
      })
      .catch(() => {
        setApiKey("demo-key-fallback");
      });
  }, []);

  async function handleRun() {
    if (phase === "calling-gemini" || phase === "paying-researchers") return;
    setError(null);
    setResult(null);
    setPhase("calling-gemini");
    try {
      const res = await runQuery({ query, apiKey: apiKey ?? "demo-key-fallback" });
      setPhase("paying-researchers");
      setResult(res);
      setTimeout(() => setPhase("done"), Math.max(400, res.citations.length * 150));
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>Live Agent Demo</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Watch an AI pay researchers in real time as it cites their work.
          </p>
        </div>
        <PhaseBadge phase={phase} />
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Sample query chips */}
        <div className="flex flex-wrap gap-2">
          {SAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => setQuery(q)}
              className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground hover:border-accent/40 hover:text-foreground transition"
            >
              {q.length > 60 ? q.slice(0, 57) + "…" : q}
            </button>
          ))}
        </div>

        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask anything — the agent will retrieve and pay per citation…"
          className="min-h-[96px]"
        />

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {apiKey
              ? <>Key: <span className="font-mono">{apiKey.slice(0, 12)}…</span></>
              : "Registering agent…"}
          </div>
          <Button
            onClick={handleRun}
            disabled={phase === "calling-gemini" || phase === "paying-researchers"}
          >
            {phase === "calling-gemini"
              ? "Thinking…"
              : phase === "paying-researchers"
              ? "Paying…"
              : "Run Query"}
          </Button>
        </div>

        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4 pt-2 border-t border-border">
            {/* Answer */}
            <div className="rounded-md border border-border bg-muted/20 p-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Answer
              </div>
              <div className="prose prose-sm prose-invert max-w-none text-foreground/90
                [&_h1]:font-serif [&_h1]:text-xl [&_h1]:mt-4 [&_h1]:mb-2
                [&_h2]:font-serif [&_h2]:text-lg [&_h2]:mt-3 [&_h2]:mb-1.5
                [&_h3]:font-medium [&_h3]:text-base [&_h3]:mt-3 [&_h3]:mb-1
                [&_p]:leading-relaxed [&_p]:mb-2
                [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2
                [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2
                [&_li]:mb-0.5
                [&_strong]:text-foreground [&_strong]:font-semibold
                [&_code]:bg-muted/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
                [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2">
                <ReactMarkdown>{result.answer}</ReactMarkdown>
              </div>
            </div>

            {/* Payment receipt */}
            <QueryReceipt result={result} />
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function PhaseBadge({ phase }: { phase: Phase }) {
  if (phase === "calling-gemini") return <Badge variant="accent">Calling Gemini…</Badge>;
  if (phase === "paying-researchers") return <Badge variant="accent">Paying researchers…</Badge>;
  if (phase === "done") return <Badge variant="success">Settled on-chain</Badge>;
  if (phase === "error") return <Badge variant="warning">Error</Badge>;
  return <Badge variant="outline">Ready</Badge>;
}
