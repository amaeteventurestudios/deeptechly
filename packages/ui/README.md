# DeepTechly UI

Shared presentation primitives for DeepTechly and Aperture. The package uses shadcn/ui conventions—Radix composition, class-variance-authority variants, and semantic CSS variables—while keeping DeepTechly's institutional editorial identity.

## Design rules

- Orange, black, white, and warm paper surfaces.
- Square corners, thin dark rules, and controlled hard shadows.
- Serif editorial hierarchy with mono evidence metadata.
- Visible keyboard focus and at least 44px interactive targets.
- Motion is restrained and respects `prefers-reduced-motion`.
- Evidence, source count, and confidence are first-class interface elements.

Tokens are defined in `apps/web/app/globals.css` and mapped in `apps/web/tailwind.config.ts`. Components are exported from `@deeptechly/ui`.
