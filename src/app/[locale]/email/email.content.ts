import { t, type Dictionary } from "intlayer";

export default {
  key: "reset-email",
  content: {
    title: t({ en: "Reset your Stolos password", fr: "Réinitialisez votre mot de passe Stolos" }),
    body: t({
      en: "Follow the reset link to choose a new password. If you did not request a reset, you can ignore this email.",
      fr: "Suivez le lien de réinitialisation pour choisir un nouveau mot de passe. Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer ce courriel.",
    }),
    mailbox: t({ en: "Open the test mailbox", fr: "Ouvrir la boîte de réception de test" }),
  },
} satisfies Dictionary;
