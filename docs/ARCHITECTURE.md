# Stolos architecture decisions

## Milestone 1 · Internationalization and company cards

### Locale routing

- The URL determines the language. Intlayer builds typed dictionaries for French and English. French is the default.
- Next.js redirects / and /login to /fr/login, preserving query parameters. The localized root layout validates the locale, sets the document language, and provides Intlayer context. The exact /code route has its own utility layout in English.
- /email is internally rewritten to /fr/email by default or /en/email for ?locale=en. Both localized paths also work directly and take their language from the path. The shared preview shows the translated reset email copy and links to the existing /code helper for the generated reset link.
- Auth screen dictionaries follow their features. Future auth work should preserve the active locale in links and Better Auth reset callbacks and map server error codes to localized messages.

### Company cards

- The dataset lives in a server-only TypeScript module. Records use stable IDs and existing sector and status identifiers. Only the descriptions vary between the two API responses.
- GET /api/company-cards accepts an optional locale parameter. It defaults to fr and returns HTTP 400 for unsupported values. The response has a cards array with id, name, description, sectors, and status fields. This public read-only endpoint supplies the pre-authentication background.
- The login screen loads cards with TanStack Query using a locale-specific key. Intlayer translates sector and status identifiers at render time. The card query runs independently of the auth card.

### Follow-up milestones

Append approved decisions here as each milestone is reviewed. The credential forms, MFA, reset completion, and Figma styling are subsequent work.
