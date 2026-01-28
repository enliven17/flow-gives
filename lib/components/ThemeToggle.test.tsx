/**
 * ThemeToggle Component Tests
 * 
 * Tests for the theme toggle button component.
 * 
 * Requirements: 2.1, 2.2
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ThemeToggle } from './ThemeToggle';
import { ThemeProvider } from '../contexts';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorageMock.clear();
    document.documentElement.className = '';
  });

  it('should render toggle button', async () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /switch to light mode/i });
      expect(button).toBeInTheDocument();
    });
  });

  it('should display moon icon in dark mode', async () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button.textContent).toContain('🌙');
    });
  });

  it('should display sun icon in light mode', async () => {
    localStorageMock.setItem('stacksgives-theme', 'light');
    
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button.textContent).toContain('☀️');
    });
  });

  it('should toggle theme when clicked', async () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /switch to light mode/i });
      expect(button).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    
    act(() => {
      button.click();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
    });
  });

  it('should show label when showLabel is true', async () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeToggle showLabel={true} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Dark Mode/i)).toBeInTheDocument();
    });
  });

  it('should not show label when showLabel is false', async () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeToggle showLabel={false} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Dark Mode/i)).not.toBeInTheDocument();
    });
  });

  it('should apply custom className', async () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeToggle className="custom-class" />
      </ThemeProvider>
    );

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
    });
  });

  it('should have proper accessibility attributes', async () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('title');
      // In dark mode, should say "Switch to light mode"
      expect(button.getAttribute('aria-label')).toContain('light mode');
    });
  });

  it('should update label text when theme changes', async () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeToggle showLabel={true} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Dark Mode/i)).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    
    act(() => {
      button.click();
    });

    await waitFor(() => {
      expect(screen.getByText(/Light Mode/i)).toBeInTheDocument();
    });
  });

  it('should update icon when theme changes', async () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button.textContent).toContain('🌙');
    });

    const button = screen.getByRole('button');
    
    act(() => {
      button.click();
    });

    await waitFor(() => {
      expect(button.textContent).toContain('☀️');
    });
  });
});
