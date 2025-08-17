/// <reference lib="esnext" />

// This file provides type definitions for the Deno runtime environment
// used by Supabase Edge Functions. This helps the local TypeScript
// compiler understand Deno-specific globals like `Deno`.

declare global {
  const EdgeRuntime: string;

  // https://deno.com/api?unstable=&s=Deno
  const Deno: {
    readonly version: {
      readonly deno: string;
      readonly v8: string;
      readonly typescript: string;
    };
    readonly build: {
      readonly target: string;
      readonly arch: string;
      readonly os: string;
      readonly vendor: string;
    };
    env: {
      get(key: string): string | undefined;
      toObject(): { [key: string]: string };
    };
  };
}

export {};