import { useState } from 'react';
import { Bracket } from './components/Bracket';
import { ChampionBanner } from './components/ChampionBanner';
import { PlayerInput } from './components/PlayerInput';
import { TournamentControls } from './components/TournamentControls';
import { Match, Player, Tournament } from './models/tournament';
import {
  addPlayerToTournament,
  createTournament,
  disqualifyPlayer,
  movePlayer,
  removePlayerFromTournament,
  selectWinner,
  startTournament,
} from './services/tournamentService';
import './styles/main.css';

const MIN_PLAYERS = 4;
const MAX_PLAYERS = 64;

const makePlayer = (name: string): Player => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name,
});

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [notice, setNotice] = useState('');

  const addPlayer = (name: string) => {
    if (tournament?.started) return;
    const player = makePlayer(name);
    const nextPlayers = [...players, player];
    setPlayers(nextPlayers);

    if (tournament) {
      setTournament(addPlayerToTournament(tournament, player));
      setNotice(`Участник «${name}» добавлен. Предварительная сетка обновлена.`);
    }
  };

  const removePlayer = (id: string) => {
    if (tournament?.started) return;
    const player = players.find((item) => item.id === id);
    const nextPlayers = players.filter((item) => item.id !== id);
    setPlayers(nextPlayers);

    if (tournament) {
      setTournament(removePlayerFromTournament(tournament, id));
      setNotice(player ? `Участник «${player.name}» удалён. Предварительная сетка обновлена.` : 'Участник удалён.');
    }
  };

  const generate = () => {
    if (players.length < MIN_PLAYERS) {
      setNotice(`Для создания сетки необходимо минимум ${MIN_PLAYERS} участника.`);
      return;
    }

    setTournament(createTournament(players));
    setNotice('Предварительная сетка создана. Команды можно перетаскивать между слотами первого этапа.');
  };

  const start = () => {
    if (!tournament || players.length < MIN_PLAYERS) return;
    setTournament(startTournament(tournament));
    setNotice('Турнир начат. Состав сетки зафиксирован.');
  };

  const reset = () => {
    setPlayers([]);
    setTournament(null);
    setNotice('');
  };

  const handleSelectWinner = (match: Match, player: Player) => {
    if (!tournament) return;

    const updated = structuredClone(tournament);
    const target =
      updated.rounds.flatMap((round) => round.matches).find((item) => item.id === match.id) ??
      (updated.thirdPlaceMatch?.id === match.id ? updated.thirdPlaceMatch : null);

    if (!target) return;
    selectWinner(updated, target, player.id);
    setTournament(updated);

    if (updated.champion) {
      setNotice(`Турнир завершён: чемпион — ${updated.champion.name}.`);
    } else {
      setNotice(`Победитель матча: ${player.name}.`);
    }
  };

  const handleMovePlayer = (
    fromMatchId: string,
    fromSlot: 'player1' | 'player2',
    toMatchId: string,
    toSlot: 'player1' | 'player2',
  ) => {
    if (!tournament || tournament.started) return;
    setTournament(movePlayer(tournament, fromMatchId, fromSlot, toMatchId, toSlot));
    setNotice('Расположение команд изменено.');
  };

  const handleDisqualify = (player: Player) => {
    if (!tournament?.started) return;
    const updated = structuredClone(tournament);
    disqualifyPlayer(updated, player.id);
    setTournament(updated);
    setNotice(`Команда «${player.name}» дисквалифицирована.`);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-mark">TB</div>
        <div>
          <strong>Bracket Studio</strong>
          <span>Организация турниров</span>
        </div>
      </header>

      <main className="app-main">
        <TournamentControls
          playerCount={players.length}
          canGenerate={players.length >= MIN_PLAYERS}
          canStart={Boolean(tournament) && players.length >= MIN_PLAYERS}
          started={Boolean(tournament?.started)}
          onGenerate={generate}
          onStart={start}
          onReset={reset}
        />

        <div className="workspace">
          <aside className="sidebar">
            <PlayerInput
              players={players}
              maxPlayers={MAX_PLAYERS}
              disabled={Boolean(tournament?.started)}
              onAdd={addPlayer}
              onRemove={removePlayer}
            />
            <div className="rules-card">
              <h3>Правила</h3>
              <ul>
                <li>От 4 до 64 участников.</li>
                <li>«Создать сетку» только формирует предварительную расстановку.</li>
                <li>До старта команды можно перетаскивать между слотами первого этапа.</li>
                <li>До старта победители не выбираются автоматически.</li>
                <li>После старта один участник проходит только если второй источник матча завершился пустым.</li>
                <li>Дисквалификация автоматически отдаёт матч сопернику.</li>
                <li>После полуфиналов доступен матч за 3-е место.</li>
              </ul>
            </div>
          </aside>

          <div className="content">
            {notice && <div className="notice">{notice}</div>}
            {!tournament ? (
              <div className="empty-state">
                <div className="empty-state__icon">⌁</div>
                <h2>Сетка ещё не создана</h2>
                <p>Добавьте от 4 до 64 участников и нажмите «Создать сетку».</p>
              </div>
            ) : (
              <>
                <ChampionBanner champion={tournament.champion} />
                <Bracket
                  tournament={tournament}
                  onSelectWinner={handleSelectWinner}
                  onMovePlayer={handleMovePlayer}
                  onDisqualify={handleDisqualify}
                />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
