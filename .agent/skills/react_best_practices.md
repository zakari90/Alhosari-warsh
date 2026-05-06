# React & Next.js Best Practices

This document outlines the core principles and best practices for developing in this repository, leveraging React 19 and Next.js 15+.

## 1. Component Architecture
- **Server Components by Default**: Favor Server Components for data fetching and static rendering. Only use `use client` when interactivity (hooks, event listeners) is strictly required.
- **Small, Focused Components**: Break down large components into smaller, reusable ones. A component should ideally do one thing well.
- **Composition over Props Drilling**: Use component composition (passing components as children or props) to avoid passing props through many layers.

## 2. State Management
- **Keep State Local**: Lift state up only as far as necessary. Avoid global state for things that can be handled locally.
- **URL as State**: Use search params and URL segments for state that should be shareable or survives page refreshes (e.g., filters, active tab).
- **React 19 Actions**: Use Actions for form submissions and state transitions. Favor the `useActionState` and `useFormStatus` hooks for handling form states.

## 3. Data Fetching
- **Server-Side Fetching**: Fetch data in Server Components using `async/await`.
- **Streaming & Suspense**: Use `Suspense` boundaries to stream slow data fetching and provide meaningful loading states.
- **Caching**: Leverage Next.js's built-in fetch cache and `revalidateTag` / `revalidatePath` for granular cache control.

## 4. Performance
- **React Compiler**: Since `babel-plugin-react-compiler` is enabled, avoid manual `useMemo` and `useCallback` unless specifically needed for stability (e.g., as dependencies in manual `useEffect`s that the compiler might not optimize yet).
- **Image Optimization**: Always use `next/image` for automatic optimization, lazy loading, and prevention of layout shift.
- **Dynamic Imports**: Use `next/dynamic` for large client-side components to reduce initial bundle size.

## 5. Effects & Cleanup
- **Avoid Overusing `useEffect`**: If you can derive data during render or handle it in an event/action, do so.
- **Always Clean Up**: Ensure every `useEffect` returns a cleanup function if it sets up subscriptions, timers, or event listeners.

## 6. TypeScript
- **Strict Typing**: Avoid `any`. Use interfaces and types for props and data structures.
- **Inference**: Let TypeScript infer types where obvious, but be explicit for complex objects and exported functions.
- **Prop Types**: Use `interface Props { ... }` for component props to improve readability and documentation.

## 7. Styling
- **CSS Variables**: Use the design system defined in `globals.css` via CSS variables for consistency.
- **Scoped Styles**: Favor CSS Modules or Tailwind (if requested) to prevent global style leakage.

## 8. PWA & Service Workers
- **Serwist Best Practices**: When modifying service workers, ensure that precaching and runtime caching strategies are clearly separated.
- **Offline First**: Always consider how a component behaves when `isOnline` is false. Use the `useConnectivity` hook to provide graceful fallbacks.
