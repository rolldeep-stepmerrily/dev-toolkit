import { ThemeToggle } from './theme-toggle';

export function Header() {
  return (
    <header className="flex h-14 items-center justify-end border-b bg-background px-4">
      <ThemeToggle />
    </header>
  );
}
