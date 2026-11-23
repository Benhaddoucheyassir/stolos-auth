import Image from "next/image";
import { notFound } from "next/navigation";
import { useIntlayer } from "next-intlayer/server";
import { Suspense, use } from "react";
import { isLocale, type Locale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { TEST_ACCOUNTS } from "@/lib/test-accounts";

type SearchParams = Promise<{ account?: string | string[] }>;
type Preview = { account?: string; link?: string; unavailable?: boolean };
const previewUrl = "https://app.example.com/reset-password?token=preview";
const isDevelopment = process.env.NODE_ENV === "development";

export default function EmailPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = use(params);
  if (!isLocale(locale)) notFound();

  return (
    <Suspense fallback={<ResetEmailTemplate locale={locale} showTestAccounts={isDevelopment} />}>
      <LiveResetEmail locale={locale} searchParams={searchParams} />
    </Suspense>
  );
}

async function LiveResetEmail({ locale, searchParams }: { locale: Locale; searchParams: SearchParams }) {
  const { account } = await searchParams;
  const showTestAccounts = isDevelopment || process.env.ENABLE_DEV_MAILBOX === "true";
  if (!showTestAccounts) return <ResetEmailTemplate locale={locale} />;

  const selected = TEST_ACCOUNTS.find((fixture) => fixture.email === account);
  if (!selected) return <ResetEmailTemplate locale={locale} showTestAccounts />;

  let preview: Preview = { account: selected.email };
  try {
    const mail = await prisma.devMail.findFirst({
      where: { to: selected.email, kind: "PASSWORD_RESET" },
      orderBy: { createdAt: "desc" },
      select: { content: true },
    });

    if (mail) {
      const link = new URL(mail.content);
      if (
        (link.protocol === "https:" || link.protocol === "http:") &&
        /^\/api\/auth\/reset-password\/[^/]+$/.test(link.pathname)
      ) {
        preview = { ...preview, link: mail.content };
      }
    }
  } catch {
    preview = { ...preview, unavailable: true };
  }

  return <ResetEmailTemplate locale={locale} preview={preview} showTestAccounts />;
}

function ResetEmailTemplate({ locale, preview = {}, showTestAccounts = false }: {
  locale: Locale;
  preview?: Preview;
  showTestAccounts?: boolean;
}) {
  const copy = useIntlayer("reset-email", locale);
  const action = "relative rounded-[4px] bg-[#5e4fb0] px-[16px] py-[12px] text-[16px] leading-[20px] text-white/90";

  return (
    <main className="mx-auto w-full max-w-[720px] py-[24px]">
      <div
        className="flex flex-col items-center gap-[24px] px-[clamp(16px,14vw,100px)] py-[48px] text-center tracking-normal"
        style={{ backgroundImage: "linear-gradient(162.6907906227101deg, #4b408c 0%, #272149 50%, #17132a 100%)" }}
      >
        <div className="flex items-center gap-[8px] text-[20px] leading-[24px] font-semibold text-white/90">
          <Image src="/auth/stolos-email-mark.svg" alt="" width={20} height={24} unoptimized />
          <span>Stolos</span>
        </div>
        <article aria-labelledby="reset-email-title"
          className="relative flex w-full flex-col items-center gap-[48px] overflow-hidden rounded-[12px] border border-white/[0.08] bg-black/30 px-[24px] py-[48px] shadow-[0_6px_16px_rgba(0,0,0,0.16),0_1px_5px_rgba(0,0,0,0.2)]">
          <Image src="/auth/stolos-email-watermark.svg" alt="" width={167} height={204} unoptimized
            className="pointer-events-none absolute bottom-[-76px] left-1/2 -translate-x-1/2" />
          <h1 id="reset-email-title" className="relative text-[24px] leading-[30px] font-semibold">{copy.title.value}</h1>
          {preview.link ? (
            <a href={preview.link} referrerPolicy="no-referrer" className={action}>{copy.action.value}</a>
          ) : (
            <span aria-disabled="true" className={action}>{copy.action.value}</span>
          )}
          <div className="relative flex w-full flex-col gap-[24px]">
            <div className="flex flex-col gap-[12px]">
              <p className="text-[16px] leading-[24px] text-white/60">{copy.body.value}</p>
              <p className="text-[14px] leading-[20px] text-white/40">{copy.ignore.value}</p>
            </div>
            <div className="text-[12px] leading-[18px] text-white/40">
              <p>{copy.copyLink.value}</p>
              {preview.link ? (
                <a href={preview.link} referrerPolicy="no-referrer" className="break-all text-primary">{preview.link}</a>
              ) : (
                <p className="break-all text-primary">{previewUrl}</p>
              )}
            </div>
          </div>
        </article>
        <p className="text-[14px] leading-[20px] text-white/40">
          {copy.footerBefore.value}<span className="text-white/60 underline">Histia</span>{copy.footerAfter.value}
        </p>
      </div>
      <div className="flex flex-col items-center gap-m px-m pt-m text-center text-sx">
        {showTestAccounts && (
          <form action={`/${locale}/email`} method="get" className="flex flex-wrap items-center justify-center gap-s">
            <label htmlFor="reset-preview-account">{copy.testAccount.value}</label>
            <select id="reset-preview-account" name="account" defaultValue={preview.account ?? ""}
              className="rounded-s border border-white/40 bg-[#272149] px-s py-xs">
              <option value="">{copy.chooseAccount.value}</option>
              {TEST_ACCOUNTS.map(({ email }) => <option key={email} value={email}>{email}</option>)}
            </select>
            <button type="submit" className="text-primary underline">{copy.loadMessage.value}</button>
          </form>
        )}
        {preview.account && !preview.link && (
          <p role="status">{preview.unavailable ? copy.mailUnavailable.value : copy.noMessage.value}</p>
        )}
        <a href="/code" className="text-primary underline">{copy.mailbox.value}</a>
      </div>
    </main>
  );
}
