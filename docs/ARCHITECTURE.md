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

## Milestone 2 · Shared auth shell and credentials

### Figma reference and layout

- Implemented from [Connexion](https://www.figma.com/design/nC4do2NRJ1zqP9mern0KQb/Cas-Pratique-Dev-Web?node-id=490-960) and [Inscription](https://www.figma.com/design/nC4do2NRJ1zqP9mern0KQb/Cas-Pratique-Dev-Web?node-id=498-665). The shared shell uses the SVG export of the 169 × 167 Stolos logo node, both exported glow assets, and the frame background color #1c1835. The foreground fits within 595 px and compresses its vertical spacing at shorter heights.
- Both frames contain eight visible instances of the same Doctolib example. To honor the six-card requirement, retain the top, third, and bottom placements on each edge, with the measured offsets and 552 × 160 card geometry. The six records come from the company API. The backdrop uses the Figma company icon, French description and the Santé, Logiciel, and IA labels. The left cards are Fermée, unbadged, and Vendue from top to bottom. The three retained right cards are Fermée, with the badges beyond the viewport edge at the reference width. These are exercise fixtures.
- The French headings, form captions, tab labels, and footer strings follow Figma. The Connexion submit button reads Se connecter. The Inscription frame uses “Créer mon compte” and expects email, password, and confirmation. Better Auth requires a name, so sign-up uses the email local part as the initial name. The password confirmation stays in the form.

### State and auth integration

- The locale-aware login page renders a shared AuthShell and one glass AuthCard. The company query runs independently of the form, keyed by locale. Component-prefixed CSS classes hold layout coordinates and work with the starter Turbopack stylesheet loader. Intlayer resolves sector and status labels.
- The accessible tabs select independent React Hook Form instances with Zod schemas. Switching preserves email drafts and clears passwords and stale errors. Better Auth handles credential submission. The UI maps duplicate email to its field, displays incorrect credentials and unexpected failures at form level, and respects the server retry header when available.
- A successful credential submission navigates to the localized account route, which checks the session on the server. If Better Auth requests MFA, the selected methods move into verification handoff state in the same card. Code entry and the forgot-password action belong to follow-up milestones. The legal captions are present, and their destinations were not provided in the frames.
