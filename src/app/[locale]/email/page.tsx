import { useIntlayer } from "next-intlayer/server";
import { use } from "react";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/locale";

export default function EmailPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  if (!isLocale(locale)) notFound();
  const copy = useIntlayer("reset-email", locale);

  return (
    <main className="mx-auto w-full max-w-[36rem] p-xl">
      <article className="glassmorphism flex flex-col gap-m rounded-m p-xl">
        <h1 className="text-l font-semibold">{copy.title}</h1>
        <p>{copy.body}</p>
        <a className="text-primary underline" href="/code">{copy.mailbox}</a>
      </article>
    </main>
  );
}
