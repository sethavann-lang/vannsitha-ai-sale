import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "OpenClaw Sok Pisey | Vann Sitha Trading",
  description: "Information and privacy policy for the private OpenClaw Sok Pisey Google Workspace integration.",
};
export default function PiseyInformationLayout({children}: {children: React.ReactNode}) {
  return <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-800"><div className="mx-auto max-w-3xl rounded-2xl border border-orange-100 bg-white p-6 shadow-sm sm:p-10">
    <p className="mb-2 text-sm font-semibold text-orange-700">VANN SITHA TRADING</p>
    <nav aria-label="OpenClaw information" className="mb-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-orange-800"><Link href="/openclaw-sok-pisey">App information</Link><Link href="/openclaw-sok-pisey/privacy">Privacy Policy</Link><Link href="/openclaw-sok-pisey/terms">Terms of Use</Link></nav>
    <article className="space-y-5 text-base leading-8">{children}</article>
    <footer className="mt-10 border-t border-slate-200 pt-5 text-sm text-slate-600">Contact: <a className="underline" href="mailto:sethavann@gmail.com">sethavann@gmail.com</a><br/>OpenClaw Sok Pisey · Vann Sitha Trading</footer>
  </div></main>;
}
