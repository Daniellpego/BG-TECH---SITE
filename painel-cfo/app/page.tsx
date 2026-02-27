"use client";
import { useEffect, useRef } from "react";
import Script from "next/script";
import { bodyHTML } from "./cfo-body";

export default function CFODashboard() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = bodyHTML;
    const tryInit = () => {
      const w = window as any;
      if (w.A) w.A.init();
      else setTimeout(tryInit, 100);
    };
    tryInit();
  }, []);
  return (
    <>
      <Script src="/cfo-app.js" strategy="afterInteractive" />
      <div ref={ref} />
    </>
  );
}
