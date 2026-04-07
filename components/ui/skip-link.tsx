"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface SkipLinkProps {
  targetId: string;
  children?: ReactNode;
}

export function SkipLink({ targetId, children }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-sky-500 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg focus:outline-none"
    >
      {children ?? "Skip to main content"}
    </a>
  );
}
