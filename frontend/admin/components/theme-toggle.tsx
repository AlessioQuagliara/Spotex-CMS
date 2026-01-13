import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/providers/theme-provider'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { effectiveTheme, toggleTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={`Switch to ${effectiveTheme === 'dark' ? 'light' : 'dark'} mode`}
      className="relative h-9 w-9"
    >
      {effectiveTheme === 'light' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
