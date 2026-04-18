// Tailwind v4: theme tokens live in app/globals.css (@theme block).
// This file is kept only to declare content scan paths explicitly.
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './context/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
};

export default config;
