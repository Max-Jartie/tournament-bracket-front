interface TournamentControlsProps {
  playerCount: number;
  canGenerate: boolean;
  canStart: boolean;
  started: boolean;
  onGenerate: () => void;
  onStart: () => void;
  onReset: () => void;
}

export function TournamentControls({
  playerCount,
  canGenerate,
  canStart,
  started,
  onGenerate,
  onStart,
  onReset,
}: TournamentControlsProps) {
  return (
    <section className="controls-panel">
      <div className="controls-panel__title">
        <span className="eyebrow">Турнир</span>
        <h1>Турнирная сетка</h1>
        <p>{started ? 'Турнир идёт. Состав и расположение команд зафиксированы.' : 'Сначала соберите сетку, затем запустите турнир.'}</p>
      </div>
      <div className="controls-panel__actions">
        <button className="button button--secondary" type="button" disabled={started || !canGenerate} onClick={onGenerate}>
          Создать сетку
        </button>
        <button className="button button--primary" type="button" disabled={!canStart || started} onClick={onStart}>
          Начать турнир
        </button>
        <button className="button button--secondary" type="button" onClick={onReset}>
          Очистить
        </button>
        <span className="controls-panel__count">Участников: {playerCount}</span>
      </div>
    </section>
  );
}
