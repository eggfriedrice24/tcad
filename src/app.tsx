import { ThemeProvider } from "@/components/providers/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

export default function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <div className="flex min-h-screen items-center justify-center">
        <ThemeToggle />
      </div>
    </ThemeProvider>
  );
}
