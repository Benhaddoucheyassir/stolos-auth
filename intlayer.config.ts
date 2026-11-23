import type { IntlayerConfig } from "intlayer";
import { defaultLocale, locales } from "./src/lib/locale";

export default {
  internationalization: { locales: [...locales], defaultLocale },
  routing: { mode: "prefix-all", enableProxy: false },
} satisfies IntlayerConfig;
