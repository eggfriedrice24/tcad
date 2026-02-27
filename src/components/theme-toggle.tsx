import { MoonIcon, SunIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="relative"
    >
      <HugeiconsIcon icon={SunIcon} className="size-[1.2rem] rotate-0 scale-100 transition-all duration-200 dark:-rotate-90 dark:scale-0" strokeWidth={2} />
      <HugeiconsIcon icon={MoonIcon} className="absolute size-[1.2rem] rotate-90 scale-0 transition-all duration-200 dark:rotate-0 dark:scale-100" strokeWidth={2} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
