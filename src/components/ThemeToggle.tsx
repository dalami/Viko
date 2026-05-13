"use client";

import { useEffect, useState, startTransition } from "react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem("theme") === "dark";
    if (isDark) document.documentElement.classList.add("dark");
    startTransition(() => {
      setDark(isDark);
      setMounted(true);
    });
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  if (!mounted) return <div style={{ width: 52, height: 28 }} />;

  return (
    <button
      onClick={toggle}
      style={{
        width: 52,
        height: 28,
        borderRadius: 100,
        background: dark ? "var(--gold)" : "var(--border)",
        border: "none",
        cursor: "pointer",
        padding: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: dark ? "flex-end" : "flex-start",
        transition: "all 0.3s ease",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: dark ? "var(--black)" : "var(--white)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          transition: "all 0.3s ease",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }}
      >
        {dark ? "🌙" : "☀️"}
      </div>
    </button>
  );
}
