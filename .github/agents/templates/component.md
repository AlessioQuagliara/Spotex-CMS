# Component Template - Guida Agente AI

## Linee Guida Generali

Quando crei componenti, segui questi principi:
- **Single Responsibility:** Un componente = una responsabilità
- **Reusability:** Progetta per il riuso
- **Accessibility:** WCAG AA compliance
- **Performance:** Minimal re-renders
- **Type Safety:** TypeScript strict mode

## Template Base Component

```tsx
'use client'

import { FC, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MyComponentProps {
  children?: ReactNode
  className?: string
  variant?: 'default' | 'secondary'
  disabled?: boolean
  onClick?: () => void
}

/**
 * MyComponent - Breve descrizione
 * 
 * @example
 * ```tsx
 * <MyComponent variant="secondary" onClick={handleClick}>
 *   Content
 * </MyComponent>
 * ```
 */
export const MyComponent: FC<MyComponentProps> = ({
  children,
  className,
  variant = 'default',
  disabled = false,
  onClick,
}) => {
  const variantClasses = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
  }

  return (
    <div
      className={cn(
        'rounded-md p-4 transition-colors',
        variantClasses[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={onClick}
      role="button"
      aria-disabled={disabled}
    >
      {children}
    </div>
  )
}

MyComponent.displayName = 'MyComponent'
```

## Template Styled Component (usando cva)

```tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const myComponentVariants = cva(
  'rounded-md px-4 py-2 font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-input bg-background hover:bg-accent',
      },
      size: {
        sm: 'px-3 py-1 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface MyComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof myComponentVariants> {}

export const MyComponent = ({
  className,
  variant,
  size,
  ...props
}: MyComponentProps) => (
  <div
    className={cn(myComponentVariants({ variant, size }), className)}
    {...props}
  />
)
```

## Template Compound Component

```tsx
'use client'

import { FC, createContext, useContext, ReactNode } from 'react'

interface ComponentContextType {
  isOpen: boolean
}

const ComponentContext = createContext<ComponentContextType | undefined>(undefined)

export const MyComponent: FC<{ children: ReactNode; isOpen: boolean }> = ({
  children,
  isOpen,
}) => {
  return (
    <ComponentContext.Provider value={{ isOpen }}>
      {children}
    </ComponentContext.Provider>
  )
}

export const MyComponentTrigger: FC<{ children: ReactNode }> = ({ children }) => {
  const context = useContext(ComponentContext)
  if (!context) throw new Error('Must be used within MyComponent')
  
  return <button>{children}</button>
}

export const MyComponentContent: FC<{ children: ReactNode }> = ({ children }) => {
  const context = useContext(ComponentContext)
  if (!context) throw new Error('Must be used within MyComponent')
  if (!context.isOpen) return null
  
  return <div>{children}</div>
}
```

## Checklist Componente

Quando finisci un componente, verifica:

- [ ] TypeScript types sono completi
- [ ] Props ben documentate (JSDoc)
- [ ] Accessibility attributes (aria-*, role)
- [ ] Classnames usar `cn()` utility
- [ ] Dark mode supportato (via Tailwind)
- [ ] Responsive design (mobile first)
- [ ] Test file creato
- [ ] Storybook story aggiunto
- [ ] Exported da index.ts
- [ ] No console errors/warnings

## Best Practices

### 1. Naming Conventions
```tsx
// ✅ Good
interface ButtonProps { ... }
const Button: FC<ButtonProps> = (...) => { ... }

// ❌ Avoid
interface Props { ... }
const btn = (...) => { ... }
```

### 2. Prop Drilling
```tsx
// ✅ Use context for deeply nested props
const MyContext = createContext()

// ❌ Avoid
<Parent prop1={x} prop2={y} prop3={z}>
  <Child prop1={x} prop2={y} prop3={z}>
    <Grandchild prop1={x} prop2={y} prop3={z} />
  </Child>
</Parent>
```

### 3. Rendering Lists
```tsx
// ✅ Good
{items.map((item) => (
  <Item key={item.id} item={item} />
))}

// ❌ Avoid
{items.map((item, index) => (
  <Item key={index} item={item} />
))}
```

### 4. Event Handlers
```tsx
// ✅ Good
const handleClick = () => { /* ... */ }
<button onClick={handleClick}>Click</button>

// ❌ Avoid
<button onClick={() => { /* ... */ }}>Click</button>
```

### 5. Conditional Rendering
```tsx
// ✅ Good
{isOpen && <Content />}
{status === 'loading' ? <Spinner /> : <Content />}

// ❌ Avoid
{isOpen === true && <Content />}
{status === 'loading' ? <Spinner /> : null}
```

## Testing Template

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from './my-component'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent>Test</MyComponent>)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const handleClick = jest.fn()
    render(<MyComponent onClick={handleClick}>Click</MyComponent>)
    
    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalled()
  })

  it('applies variant classes', () => {
    render(<MyComponent variant="secondary">Test</MyComponent>)
    const element = screen.getByText('Test')
    expect(element).toHaveClass('bg-secondary')
  })
})
```

## Storybook Template

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { MyComponent } from './my-component'

const meta: Meta<typeof MyComponent> = {
  component: MyComponent,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Default',
  },
}

export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
}

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
}
```

## Folder Structure

```
components/
├── ui/                          # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   └── index.ts
├── layout/                      # Layout components
│   ├── header.tsx
│   ├── sidebar.tsx
│   └── index.ts
├── forms/                       # Form components
│   ├── form-field.tsx
│   ├── form-input.tsx
│   └── index.ts
└── index.ts                     # Export all
```

## Export Pattern

```tsx
// components/index.ts
export { Button } from './ui/button'
export type { ButtonProps } from './ui/button'
export { Header } from './layout/header'
export type { HeaderProps } from './layout/header'
```

---

**Last Updated:** 2026-01-14
**For:** Agente AI - Component Creation
