"use client";

import { useEffect, useState } from "react";

/** true лише після першого клієнтського рендеру — уникає hydration mismatch */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
