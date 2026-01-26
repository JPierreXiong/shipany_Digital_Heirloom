"use client";

import { Moon, SunDim } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { flushSync } from "react-dom";
import { cn } from "@/shared/lib/utils";
import { useTheme } from "next-themes";

type props = {
  className?: string;
};

export const AnimatedThemeToggler = ({ className }: props) => {
  const { theme, setTheme } = useTheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    setIsDarkMode(theme === "dark");
  }, [theme]);

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const changeTheme = async () => {
    // 禁用主题切换，只保留夜晚模式
    // 强制设置为dark模式
    if (!buttonRef.current) return;

    // 确保始终是dark模式
    if (theme !== "dark") {
      await document.startViewTransition(() => {
        flushSync(() => {
          document.documentElement.classList.add("dark");
          setTheme("dark");
          setIsDarkMode(true);
        });
      }).ready;
    }

    const { top, left, width, height } =
      buttonRef.current.getBoundingClientRect();
    const y = top + height / 2;
    const x = left + width / 2;

    const right = window.innerWidth - left;
    const bottom = window.innerHeight - top;
    const maxRad = Math.hypot(Math.max(left, right), Math.max(top, bottom));

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRad}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 700,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  };
  if (!mounted) {
    return null;
  }

  // 只显示夜晚模式按钮，禁用白天模式切换
  return (
    <button ref={buttonRef} onClick={changeTheme} className={cn(className)} disabled title="Dark mode only">
      <Moon />
    </button>
  );
};
