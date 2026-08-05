import { Flame } from "lucide-react";

const countdownLabels = ["Days", "Hours", "Mins", "Secs"] as const;

interface MegaSaleHeroProps {
  countdownValues: readonly number[];
}

export function MegaSaleHero({ countdownValues }: MegaSaleHeroProps) {
  return (
    <div className="bg-primary text-primary-foreground py-8 lg:py-12 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-accent/20 via-transparent to-accent/20" />
      <div className="relative z-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Flame size={24} className="text-accent" />
          <span className="text-[10px] tracking-[0.3em] uppercase text-accent font-medium">Limited Time</span>
          <Flame size={24} className="text-accent" />
        </div>
        <h1 className="font-display text-4xl lg:text-6xl font-bold tracking-tight">MEGA SALE</h1>
        <p className="text-lg lg:text-xl font-light mt-2 text-primary-foreground/80">Up to 30% off everything</p>
        <div className="flex items-center justify-center gap-4 mt-6">
          {countdownLabels.map((label, index) => (
            <div key={label} className="text-center">
              <div className="w-14 h-14 lg:w-16 lg:h-16 bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center text-xl lg:text-2xl font-bold">{countdownValues[index] ?? 0}</div>
              <p className="text-[9px] tracking-[0.15em] uppercase mt-1 text-primary-foreground/60">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
