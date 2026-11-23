import { t, type Dictionary } from "intlayer";

export default {
  key: "reset-email",
  content: {
    title: t({ en: "Reset your password", fr: "Réinitialisez votre mot de passe" }),
    action: t({ en: "Choose a new password", fr: "Choisir un nouveau mot de passe" }),
    body: t({ en: "We received a request to reset your Stolos account password. This link expires in one hour.", fr: "Nous avons reçu une demande de réinitialisation du mot de passe de votre compte Stolos. Ce lien expire dans une heure." }),
    ignore: t({ en: "If you didn’t make this request, you can ignore this message. Your password will stay the same.", fr: "Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer ce message : votre mot de passe reste inchangé." }),
    copyLink: t({ en: "Or copy this link into your browser:", fr: "Ou copiez ce lien dans votre navigateur :" }),
    footerBefore: t({ en: "This is an automated message from ", fr: "Ceci est un message automatique de " }),
    footerAfter: t({ en: ". Please do not reply.", fr: ". Merci de ne pas y répondre." }),
    mailbox: t({ en: "Open the test mailbox", fr: "Ouvrir la boîte de réception de test" }),
    testAccount: t({ en: "Test account", fr: "Compte de test" }),
    chooseAccount: t({ en: "Choose a test account", fr: "Choisissez un compte de test" }),
    loadMessage: t({ en: "Show latest email", fr: "Afficher le dernier courriel" }),
    noMessage: t({ en: "No password reset email is available for this test account.", fr: "Aucun courriel de réinitialisation n’est disponible pour ce compte de test." }),
    mailUnavailable: t({ en: "The test mailbox is temporarily unavailable.", fr: "La boîte de réception de test est temporairement indisponible." }),
  },
} satisfies Dictionary;
