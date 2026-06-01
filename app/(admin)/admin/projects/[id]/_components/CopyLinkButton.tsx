"use client";

import { useState } from "react";

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-3 border border-[#1e1e1e] bg-[#141414] rounded px-4 py-3">
      <span className="flex-1 text-sm text-[#888] font-mono truncate">{url}</span>
      <button
        onClick={handleCopy}
        className="shrink-0 rounded bg-[#1e1e1e] px-3 py-1.5 text-xs text-[#f0efec] hover:bg-amber-400 hover:text-[#0e0e0e] transition-colors"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
