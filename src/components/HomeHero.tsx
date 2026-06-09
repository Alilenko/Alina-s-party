import { Crown, Heart } from "lucide-react";

interface HomeHeroProps {
  portraitUrl?: string | null;
  name?: string;
}

function resolvePortrait(url?: string | null): string {
  if (!url?.trim()) return "/alina-portrait.jpg";
  const trimmed = url.trim();
  if (trimmed.startsWith("/")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return trimmed;
  } catch {
    /* invalid */
  }
  return "/alina-portrait.jpg";
}

export default function HomeHero({ portraitUrl, name }: HomeHeroProps) {
  const portrait = resolvePortrait(portraitUrl);

  return (
    <section className="relative w-full px-4 pb-1 pt-2">
      <div className="relative flex min-h-[200px] items-stretch">
        <div className="flex flex-1 flex-col items-center justify-center pr-36 text-center sm:pr-40">
          <Crown
            size={18}
            className="mb-1 text-party-gold/90"
            strokeWidth={1.5}
          />
          <h1 className="party-title text-xl font-bold leading-tight tracking-[0.15em] text-party-gold-light drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
            Alina&apos;s Party
          </h1>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-[9px] text-party-gold/60">✦</span>
            <p className="text-[10px] tracking-[0.15em] text-party-cream/90 drop-shadow-md">
              Свято починається тут
            </p>
            <span className="text-[9px] text-party-gold/60">✦</span>
          </div>
        </div>

        <div className="absolute bottom-0 right-0 flex w-[140px] flex-col items-center sm:w-[156px]">
          <div className="relative">
            <div className="h-[120px] w-[120px] overflow-hidden rounded-full border-[3px] border-party-gold/90 shadow-[0_0_32px_rgba(201,169,98,0.45)] ring-4 ring-party-gold/15 sm:h-[132px] sm:w-[132px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={portrait}
                alt={name || "Аліна"}
                className="h-full w-full object-cover object-top"
              />
            </div>
            <Heart
              size={18}
              className="absolute bottom-0 right-0 fill-party-gold/35 text-party-gold"
            />
          </div>
          <p
            className="mt-1.5 text-center text-base leading-none text-party-gold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
            style={{ fontFamily: "var(--font-script), cursive" }}
          >
            Let&apos;s celebrate!
          </p>
        </div>
      </div>
    </section>
  );
}
