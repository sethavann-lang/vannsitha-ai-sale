import { ExternalLink, Mic } from "lucide-react";

export function VoiceStudioLink({
  label,
  newTabLabel,
  onClick,
}: {
  label: string;
  newTabLabel: string;
  onClick?: () => void;
}) {
  return (
    <a
      href="https://voice.vannsitha.com/"
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      aria-label={`${label} — ${newTabLabel}`}
      title={newTabLabel}
      className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-[16px] font-semibold text-slate-700 hover:text-orange-600 hover:bg-orange-50/70 transition-all"
    >
      <Mic className="w-5 h-5 shrink-0 text-amber-700" aria-hidden="true" />
      <span className="flex-1 min-w-0">{label}</span>
      <ExternalLink className="w-3.5 h-3.5 shrink-0 text-orange-500" aria-hidden="true" />
    </a>
  );
}
