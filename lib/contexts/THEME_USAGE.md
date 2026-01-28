# Theme Context Usage Guide

## Overview

The Theme Context provides dark/light mode state management for the StacksGives platform. It includes theme persistence in localStorage and automatic application of theme classes to the document element.

## Features

- **Dark/Light Mode**: Toggle between dark and light themes
- **Persistence**: Theme preference is saved to localStorage
- **Auto-apply**: Theme class is automatically applied to `<html>` element
- **SSR-safe**: Prevents hydration mismatches in Next.js
- **Customizable**: Configurable storage key and default theme

## Setup

### 1. Wrap your app with ThemeProvider

In your root layout (`app/layout.tsx`):

```tsx
import { ThemeProvider } from '@/lib/contexts';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider defaultTheme="dark" storageKey="stacksgives-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 2. Use the theme in your components

```tsx
'use client';

import { useTheme } from '@/lib/contexts';

export function MyComponent() {
  const { theme, isDark, toggleTheme, setTheme } = useTheme();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>Is dark mode: {isDark ? 'Yes' : 'No'}</p>
      
      <button onClick={toggleTheme}>
        Toggle Theme
      </button>
      
      <button onClick={() => setTheme('dark')}>
        Set Dark
      </button>
      
      <button onClick={() => setTheme('light')}>
        Set Light
      </button>
    </div>
  );
}
```

## API Reference

### ThemeProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | required | Child components |
| `defaultTheme` | `'dark' \| 'light'` | `'dark'` | Default theme when no stored preference exists |
| `storageKey` | `string` | `'stacksgives-theme'` | localStorage key for persisting theme |

### useTheme Hook

Returns a `ThemeContextValue` object with:

| Property | Type | Description |
|----------|------|-------------|
| `theme` | `'dark' \| 'light'` | Current theme |
| `isDark` | `boolean` | Whether current theme is dark |
| `toggleTheme` | `() => void` | Toggle between dark and light |
| `setTheme` | `(theme: Theme) => void` | Set theme explicitly |

## ThemeToggle Component

A pre-built button component for toggling themes:

```tsx
import { ThemeToggle } from '@/lib/components';

export function Header() {
  return (
    <header>
      <h1>StacksGives</h1>
      <ThemeToggle showLabel={true} />
    </header>
  );
}
```

### ThemeToggle Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `showLabel` | `boolean` | `false` | Show "Dark Mode" / "Light Mode" label |

## Styling with Tailwind CSS

The theme context applies a class (`dark` or `light`) to the `<html>` element. Use Tailwind's dark mode variant to style components:

```tsx
<div className="bg-background-primary text-text-primary">
  <h1 className="text-accent-primary">Hello World</h1>
  <p className="text-text-secondary">This text adapts to the theme</p>
</div>
```

The Tailwind config already includes dark theme colors:

```typescript
colors: {
  background: {
    primary: '#0a0a0a',      // Main background
    secondary: '#141414',    // Card backgrounds
    tertiary: '#1e1e1e',     // Elevated surfaces
  },
  text: {
    primary: '#ffffff',      // Main text
    secondary: '#a3a3a3',    // Secondary text
    muted: '#737373',        // Muted text
  },
  accent: {
    primary: '#3b82f6',      // Blue accent
    secondary: '#8b5cf6',    // Purple accent
    success: '#10b981',      // Green for success
    warning: '#f59e0b',      // Orange for warnings
    error: '#ef4444',        // Red for errors
  },
}
```

## Examples

### Example 1: Theme-aware Component

```tsx
'use client';

import { useTheme } from '@/lib/contexts';

export function ThemeAwareCard() {
  const { isDark } = useTheme();

  return (
    <div className="p-6 rounded-lg bg-background-secondary border border-border-default">
      <h2 className="text-xl font-bold text-text-primary">
        Theme-Aware Card
      </h2>
      <p className="text-text-secondary">
        Currently in {isDark ? 'dark' : 'light'} mode
      </p>
    </div>
  );
}
```

### Example 2: Custom Theme Toggle

```tsx
'use client';

import { useTheme } from '@/lib/contexts';

export function CustomThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setTheme('light')}
        className={`px-4 py-2 rounded ${
          theme === 'light' 
            ? 'bg-accent-primary text-white' 
            : 'bg-background-secondary text-text-secondary'
        }`}
      >
        Light
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`px-4 py-2 rounded ${
          theme === 'dark' 
            ? 'bg-accent-primary text-white' 
            : 'bg-background-secondary text-text-secondary'
        }`}
      >
        Dark
      </button>
    </div>
  );
}
```

### Example 3: Theme Persistence Check

```tsx
'use client';

import { useEffect } from 'react';
import { useTheme } from '@/lib/contexts';

export function ThemeDebug() {
  const { theme } = useTheme();

  useEffect(() => {
    console.log('Current theme:', theme);
    console.log('Stored theme:', localStorage.getItem('stacksgives-theme'));
  }, [theme]);

  return (
    <div className="p-4 bg-background-secondary rounded">
      <p>Check console for theme debug info</p>
    </div>
  );
}
```

## Best Practices

1. **Always use the context**: Don't manually manipulate localStorage or document classes
2. **Use Tailwind colors**: Leverage the pre-configured theme colors for consistency
3. **Client components only**: The `useTheme` hook only works in client components (`'use client'`)
4. **Avoid flash**: The ThemeProvider prevents flash of unstyled content by not rendering until mounted
5. **Test both themes**: Always test your components in both dark and light modes

## Troubleshooting

### Theme not persisting

Make sure localStorage is available and not blocked by browser settings.

### Hydration mismatch errors

The ThemeProvider already handles this by not rendering until mounted. If you still see errors, ensure you're not accessing theme state during SSR.

### Theme not applying

Check that:
1. ThemeProvider is wrapping your app
2. You're using the `useTheme` hook inside a client component
3. The Tailwind config includes the theme colors

## Requirements

This implementation satisfies:
- **Requirement 2.1**: Dark theme implementation across all pages and components
- **Requirement 2.2**: Appropriate dark background colors with sufficient contrast
