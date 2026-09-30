import { useEffect, useRef, useState } from 'react';
import { Match as MatchModel, Player, Tournament } from '../models/tournament';
import { Match } from './Match';

interface BracketProps {
  tournament: Tournament;
  onSelectWinner: (match: MatchModel, player: Player) => void;
  onMovePlayer: (
    fromMatchId: string,
    fromSlot: 'player1' | 'player2',
    toMatchId: string,
    toSlot: 'player1' | 'player2',
  ) => void;
  onDisqualify: (player: Player) => void;
}

export function Bracket({ tournament, onSelectWinner, onMovePlayer, onDisqualify }: BracketProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 30, y: 30 });
  const drag = useRef({ active: false, x: 0, y: 0, startX: 0, startY: 0 });

  useEffect(() => {
    setScale(1);
    setOffset({ x: 30, y: 30 });
  }, [tournament.players.length, tournament.started]);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      setScale((current) => Math.min(1.5, Math.max(0.55, current + (event.deltaY < 0 ? 0.08 : -0.08))));
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, []);

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest('button')) return;
    drag.current = { active: true, x: offset.x, y: offset.y, startX: event.clientX, startY: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    setOffset({
      x: drag.current.x + event.clientX - drag.current.startX,
      y: drag.current.y + event.clientY - drag.current.startY,
    });
  };

  const endDrag = () => {
    drag.current.active = false;
  };

  return (
    <section className="bracket-section">
      <div className="bracket-toolbar">
        <div>
          <span className="eyebrow">Поле сетки</span>
          <p>{tournament.started ? 'Выбирайте победителей. Для исключения команды используйте «Дисквалифицировать».' : 'Перетаскивайте команды между слотами первого этапа. Ctrl + колёсико — масштаб.'}</p>
        </div>
        <div className="zoom-controls">
          <button type="button" onClick={() => setScale((value) => Math.max(0.55, value - 0.1))}>−</button>
          <span>{Math.round(scale * 100)}%</span>
          <button type="button" onClick={() => setScale((value) => Math.min(1.5, value + 0.1))}>+</button>
          <button type="button" onClick={() => { setScale(1); setOffset({ x: 30, y: 30 }); }}>Сброс</button>
        </div>
      </div>
      <div
        className="bracket-viewport"
        ref={viewportRef}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="bracket-canvas" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}>
          {tournament.rounds.map((round) => (
            <div className="bracket-round" key={round.id}>
              <h3>{round.name}</h3>
              <div className="bracket-round__matches">
                {round.matches.map((match) => (
                  <Match
                    key={match.id}
                    match={match}
                    started={tournament.started}
                    onSelectWinner={onSelectWinner}
                    onMovePlayer={onMovePlayer}
                    onDisqualify={onDisqualify}
                  />
                ))}
              </div>
            </div>
          ))}
          {tournament.thirdPlaceMatch && (
            <div className="bracket-round bracket-round--third">
              <h3>Матч за 3-е место</h3>
              <div className="bracket-round__matches">
                <Match
                  match={tournament.thirdPlaceMatch}
                  started={tournament.started}
                  onSelectWinner={onSelectWinner}
                  onMovePlayer={onMovePlayer}
                  onDisqualify={onDisqualify}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
