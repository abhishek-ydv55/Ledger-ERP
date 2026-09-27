# Frontend Architecture & Guidelines

This frontend application follows a strict set of architectural principles and design patterns. All future AI assistant sessions and developers MUST strictly follow these decisions.

---

## 1. Component Architecture & Modularization

The frontend is built using **Angular 18+ Standalone Components ONLY**.
- **NO NgModules**: All components, directives, and pipes MUST be declared as `standalone: true`.
- **Strict Mode**: Stricter type checking and Angular template type checking enabled.
- **Folder Structure**:
  - `src/app/core/`: Singleton services (`ApiService`, `AuthService`, `TenantService`), HTTP interceptors, and guards.
  - `src/app/shared/`: Reusable UI components, directives, pipes, and utility functions.
  - `src/app/features/`: One folder per feature module containing feature components and lazy-loaded routes:
    - `auth`
    - `dashboard`
    - `users`
    - `parties`
    - `items`
    - `inventory`
    - `sales`
    - `purchases`
    - `payments`
    - `banking`
    - `accounting`
    - `expenses`
    - `reports`
    - `audit`

---

## 2. Styling & Design Principles

- **Tailwind CSS ONLY**: All layout and component styling MUST use Tailwind CSS utility classes.
- **NO Angular Material Theme**: Do NOT import or use `@angular/material` theme styles.
- **Angular CDK Primitives**: `@angular/cdk` is configured and used for headless overlay, dialog, tree, and accessibility primitives.
- **Animations**: `provideAnimations()` is enabled in `app.config.ts`.

---

## 3. Environment & API Configuration

- Development environment (`environment.ts`): `apiBaseUrl = 'http://localhost:8080/api/v1'`
- Production environment (`environment.prod.ts`): `apiBaseUrl = '/api/v1'`

---

## Design System

*(Placeholder section to be populated by Design System configuration)*
