import { Match as MatchModel, Player } from '../models/tournament';

interface MatchProps {
  match: MatchModel;
  started: boolean;
  onSelectWinner: (match: MatchModel, player: Player) => void;
  onMovePlayer: (
    fromMatchId: string,
    fromSlot: 'player1' | 'player2',
    toMatchId: string,
    toSlot: 'player1' | 'player2',
  ) => void;
  onDisqualify: (player: Player) => void;
}

export function Match({ match, started, onSelectWinner, onMovePlayer, onDisqualify }: MatchProps) {
  const canChoose = started && match.status === 'ready' && Boolean(match.player1 && match.player2);

  const playerRow = (player: Player | null, position: 1 | 2, slot: 'player1' | 'player2') => {
    const isWinner = Boolean(player && match.winnerId === player.id);
    const isDisqualified = Boolean(player?.disqualified);
    const draggable = Boolean(player && !started && match.roundIndex === 0);

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const data = event.dataTransfer.getData('application/x-bracket-player');
      if (!data) return;
      const [fromMatchId, fromSlot] = data.split(':') as [string, 'player1' | 'player2'];
      onMovePlayer(fromMatchId, fromSlot, match.id, slot);
    };

    return (
      <div
        className={`match__player-wrap ${isDisqualified ? 'match__player-wrap--disqualified' : ''}`}
        onDragOver={(event) => {
          if (!started) event.preventDefault();
        }}
        onDrop={handleDrop}
      >
        <button
          type="button"
          className={`match__player ${isWinner ? 'match__player--winner' : ''} ${isDisqualified ? 'match__player--disqualified' : ''}`}
          disabled={!canChoose || !player || isDisqualified}
          draggable={draggable}
          onDragStart={(event) => {
            if (!player) return;
            event.dataTransfer.setData('application/x-bracket-player', `${match.id}:${slot}`);
            event.dataTransfer.effectAllowed = 'move';
          }}
          onClick={() => player && onSelectWinner(match, player)}
          aria-label={player ? `Выбрать ${player.name} победителем` : `Позиция ${position} пуста`}
        >
          <span>{isDisqualified ? 'Дисквалифицирован' : player?.name ?? 'Пусто'}</span>
          {isWinner && <small>Победитель</small>}
        </button>
        {started && player && !isDisqualified && (
          <button
            type="button"
            className="match__disqualify"
            onClick={() => onDisqualify(player)}
          >
            Дисквалифицировать
          </button>
        )}
      </div>
    );
  };

  const statusText = match.status === 'completed' ? 'Завершён' : match.status === 'ready' ? 'Готов' : 'Ожидание';

  return (
    <article className={`match match--${match.status}`}>
      <div className="match__header">
        <span>Матч {match.matchIndex + 1}</span>
        <span>{statusText}</span>
      </div>
      <div className="match__players">
        {playerRow(match.player1, 1, 'player1')}
        {playerRow(match.player2, 2, 'player2')}
      </div>
    </article>
  );
}
