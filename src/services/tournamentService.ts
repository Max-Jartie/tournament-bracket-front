import { Match, Player, Round, Tournament } from '../models/tournament';

const nextPowerOfTwo = (value: number): number => {
  let result = 1;
  while (result < value) result *= 2;
  return result;
};

const roundName = (roundIndex: number, totalRounds: number): string => {
  const distance = totalRounds - roundIndex;
  if (distance === 1) return 'Финал';
  if (distance === 2) return 'Полуфиналы';
  if (distance === 3) return 'Четвертьфиналы';
  return `1/${2 ** distance} финала`;
};

const makeMatch = (
  roundIndex: number,
  matchIndex: number,
  player1: Player | null = null,
  player2: Player | null = null,
  sourceMatch1Id?: string,
  sourceMatch2Id?: string,
): Match => ({
  id: `r${roundIndex}-m${matchIndex}`,
  roundIndex,
  matchIndex,
  player1,
  player2,
  winnerId: null,
  status: player1 && player2 ? 'ready' : 'pending',
  sourceMatch1Id,
  sourceMatch2Id,
});

const findMatch = (tournament: Tournament, id: string): Match | null =>
  tournament.rounds.flatMap((round) => round.matches).find((match) => match.id === id) ??
  (tournament.thirdPlaceMatch?.id === id ? tournament.thirdPlaceMatch : null);

const getPlayer = (tournament: Tournament, id: string | null): Player | null => {
  if (!id) return null;
  return tournament.players.find((player) => player.id === id) ?? null;
};

const resetMatchResult = (match: Match): void => {
  match.winnerId = null;
  match.status = match.player1 && match.player2 ? 'ready' : 'pending';
};

const setChampionFromFinal = (tournament: Tournament): void => {
  const final = tournament.rounds[tournament.rounds.length - 1]?.matches[0];
  if (final?.winnerId) {
    tournament.champion = getPlayer(tournament, final.winnerId);
  } else {
    tournament.champion = null;
  }
};

/**
 * Создаёт только ПРЕДВАРИТЕЛЬНУЮ сетку.
 * Участники размещаются в исходном порядке: никаких случайных перестановок
 * и никаких автоматических побед до нажатия «Начать турнир».
 */
export const createTournament = (players: Player[]): Tournament => {
  const bracketSize = nextPowerOfTwo(Math.max(2, players.length));
  const totalRounds = Math.log2(bracketSize);
  const rounds: Round[] = [];

  const firstRound: Match[] = [];
  for (let i = 0; i < bracketSize / 2; i += 1) {
    firstRound.push(
      makeMatch(0, i, players[i * 2] ?? null, players[i * 2 + 1] ?? null),
    );
  }
  rounds.push({ id: 'round-0', index: 0, name: roundName(0, totalRounds), matches: firstRound });

  for (let roundIndex = 1; roundIndex < totalRounds; roundIndex += 1) {
    const matchCount = bracketSize / 2 ** (roundIndex + 1);
    const matches: Match[] = [];

    for (let matchIndex = 0; matchIndex < matchCount; matchIndex += 1) {
      const source1 = rounds[roundIndex - 1].matches[matchIndex * 2];
      const source2 = rounds[roundIndex - 1].matches[matchIndex * 2 + 1];
      matches.push(
        makeMatch(
          roundIndex,
          matchIndex,
          null,
          null,
          source1?.id,
          source2?.id,
        ),
      );
    }

    rounds.push({
      id: `round-${roundIndex}`,
      index: roundIndex,
      name: roundName(roundIndex, totalRounds),
      matches,
    });
  }

  return {
    players: players.map((player) => ({ ...player, disqualified: false })),
    rounds,
    thirdPlaceMatch: totalRounds >= 2 ? makeMatch(totalRounds, 0) : null,
    champion: null,
    started: false,
  };
};

/**
 * Пересчитывает состояние сетки после запуска турнира, результата матча
 * или дисквалификации. Важное правило: один участник НЕ считается победителем,
 * пока второй источник матча не завершён. Пустой завершённый источник — это
 * единственный случай, когда соперник считается отсутствующим и участник проходит дальше.
 */
export const resolveAutomaticAdvances = (tournament: Tournament): void => {
  if (!tournament.started) return;

  let changed = true;
  let guard = 0;

  while (changed && guard < 1000) {
    changed = false;
    guard += 1;

    for (let roundIndex = 0; roundIndex < tournament.rounds.length; roundIndex += 1) {
      const round = tournament.rounds[roundIndex];

      for (const match of round.matches) {
        if (match.status === 'completed' && match.winnerId) continue;

        if (roundIndex === 0) {
          if (match.player1 && match.player2) {
            if (match.status !== 'ready' || match.winnerId !== null) {
              match.status = 'ready';
              match.winnerId = null;
              changed = true;
            }
            continue;
          }

          if (match.player1 || match.player2) {
            const participant = match.player1 ?? match.player2;
            if (participant && match.status !== 'completed') {
              match.winnerId = participant.id;
              match.status = 'completed';
              changed = true;
            }
            continue;
          }

          if (match.status !== 'completed' || match.winnerId !== null) {
            match.status = 'completed';
            match.winnerId = null;
            changed = true;
          }
          continue;
        }

        const source1 = match.sourceMatch1Id ? findMatch(tournament, match.sourceMatch1Id) : null;
        const source2 = match.sourceMatch2Id ? findMatch(tournament, match.sourceMatch2Id) : null;
        if (!source1 || !source2) continue;

        const source1Resolved = source1.status === 'completed';
        const source2Resolved = source2.status === 'completed';
        if (!source1Resolved || !source2Resolved) {
          continue;
        }

        const p1 = source1.winnerId ? getPlayer(tournament, source1.winnerId) : null;
        const p2 = source2.winnerId ? getPlayer(tournament, source2.winnerId) : null;
        const oldP1 = match.player1?.id ?? null;
        const oldP2 = match.player2?.id ?? null;

        match.player1 = p1;
        match.player2 = p2;

        if (p1 && p2) {
          if (match.status !== 'ready' || match.winnerId !== null) {
            match.status = 'ready';
            match.winnerId = null;
            changed = true;
          }
        } else if (p1 || p2) {
          const participant = p1 ?? p2;
          if (match.status !== 'completed' || match.winnerId !== participant?.id) {
            match.status = 'completed';
            match.winnerId = participant?.id ?? null;
            changed = true;
          }
        } else if (match.status !== 'completed' || match.winnerId !== null) {
          match.status = 'completed';
          match.winnerId = null;
          changed = true;
        }

        if (oldP1 !== (p1?.id ?? null) || oldP2 !== (p2?.id ?? null)) {
          changed = true;
        }
      }
    }
  }

  setChampionFromFinal(tournament);
  updateThirdPlaceMatch(tournament);
};

export const startTournament = (tournament: Tournament): Tournament => {
  const updated = structuredClone(tournament);
  updated.started = true;
  resolveAutomaticAdvances(updated);
  return updated;
};

const advanceWinner = (tournament: Tournament, match: Match, winnerId: string): void => {
  if (match.status !== 'ready' || !match.player1 || !match.player2) return;
  if (![match.player1.id, match.player2.id].includes(winnerId)) return;

  match.winnerId = winnerId;
  match.status = 'completed';
  resolveAutomaticAdvances(tournament);
};

export const selectWinner = (tournament: Tournament, match: Match, winnerId: string): void => {
  if (!tournament.started) return;
  if (tournament.thirdPlaceMatch?.id === match.id) {
    if (match.status !== 'ready' || !match.player1 || !match.player2) return;
    if (![match.player1.id, match.player2.id].includes(winnerId)) return;
    match.winnerId = winnerId;
    match.status = 'completed';
    return;
  }

  advanceWinner(tournament, match, winnerId);
};

/** Дисквалификация доступна только после начала турнира. */
export const disqualifyPlayer = (tournament: Tournament, playerId: string): void => {
  if (!tournament.started) return;

  const player = tournament.players.find((item) => item.id === playerId);
  if (!player || player.disqualified) return;

  for (const item of tournament.players) {
    if (item.id === playerId) item.disqualified = true;
  }

  for (const round of tournament.rounds) {
    for (const match of round.matches) {
      if (match.player1?.id === playerId) match.player1 = { ...match.player1, disqualified: true };
      if (match.player2?.id === playerId) match.player2 = { ...match.player2, disqualified: true };

      const hasDisqualified1 = match.player1?.id === playerId;
      const hasDisqualified2 = match.player2?.id === playerId;
      if (!hasDisqualified1 && !hasDisqualified2) continue;

      const opponent = hasDisqualified1 ? match.player2 : match.player1;
      if (opponent && (match.status === 'ready' || match.winnerId === playerId)) {
        match.winnerId = opponent.id;
        match.status = 'completed';
      } else if (!opponent && (match.status !== 'completed' || match.winnerId === playerId)) {
        match.winnerId = null;
        match.status = 'completed';
      }
    }
  }

  if (tournament.thirdPlaceMatch) {
    const third = tournament.thirdPlaceMatch;
    if (third.player1?.id === playerId) third.player1 = { ...third.player1, disqualified: true };
    if (third.player2?.id === playerId) third.player2 = { ...third.player2, disqualified: true };
    const d1 = third.player1?.id === playerId;
    const d2 = third.player2?.id === playerId;
    if (d1 || d2) {
      const opponent = d1 ? third.player2 : third.player1;
      if (opponent && (third.status === 'ready' || third.winnerId === playerId)) {
        third.winnerId = opponent.id;
        third.status = 'completed';
      } else if (!opponent && (third.status !== 'completed' || third.winnerId === playerId)) {
        third.winnerId = null;
        third.status = 'completed';
      }
    }
  }

  resolveAutomaticAdvances(tournament);
};

export const movePlayer = (
  tournament: Tournament,
  fromMatchId: string,
  fromSlot: 'player1' | 'player2',
  toMatchId: string,
  toSlot: 'player1' | 'player2',
): Tournament => {
  const updated = structuredClone(tournament);
  if (updated.started) return updated;
  if (fromMatchId === toMatchId && fromSlot === toSlot) return updated;

  const fromMatch = findMatch(updated, fromMatchId);
  const toMatch = findMatch(updated, toMatchId);
  if (!fromMatch || !toMatch) return updated;
  if (fromMatch.roundIndex !== 0 || toMatch.roundIndex !== 0) return updated;
  if (fromMatch.status === 'completed' || toMatch.status === 'completed') return updated;

  const moving = fromMatch[fromSlot];
  if (!moving) return updated;

  const target = toMatch[toSlot];
  fromMatch[fromSlot] = target;
  toMatch[toSlot] = moving;
  resetMatchResult(fromMatch);
  resetMatchResult(toMatch);
  return updated;
};

export const addPlayerToTournament = (tournament: Tournament, player: Player): Tournament => {
  if (tournament.started) return tournament;
  if (tournament.players.some((item) => item.name.toLowerCase() === player.name.toLowerCase())) return tournament;

  // Добавление до начала турнира перестраивает только ПРЕДВАРИТЕЛЬНУЮ сетку.
  // Расстановка остаётся детерминированной, случайного shuffle нет.
  return createTournament([...tournament.players, player]);
};

export const removePlayerFromTournament = (tournament: Tournament, playerId: string): Tournament => {
  if (tournament.started) return tournament;
  return createTournament(tournament.players.filter((player) => player.id !== playerId));
};

export const updateThirdPlaceMatch = (tournament: Tournament): void => {
  const third = tournament.thirdPlaceMatch;
  if (!third || tournament.rounds.length < 2) return;

  const semifinalRound = tournament.rounds[tournament.rounds.length - 2];
  if (semifinalRound.matches.length !== 2) return;

  const losers = semifinalRound.matches.map((match) => {
    if (!match.winnerId || !match.player1 || !match.player2) return null;
    return match.player1.id === match.winnerId ? match.player2 : match.player1;
  });

  if (losers[0] && losers[1]) {
    third.player1 = losers[0];
    third.player2 = losers[1];
    third.winnerId = null;
    third.status = 'ready';
  }
};

export const getTournamentWinner = (tournament: Tournament): Player | null => tournament.champion;
