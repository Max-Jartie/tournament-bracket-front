import { Player } from '../models/tournament';

export function ChampionBanner({ champion }: { champion: Player | null }) {
  if (!champion) return null;
  return (
    <section className="champion-banner">
      <span className="champion-banner__trophy">★</span>
      <div>
        <span className="eyebrow">Турнир завершён</span>
        <h2>{champion.name}</h2>
        <p>Победитель турнира</p>
      </div>
    </section>
  );
}
