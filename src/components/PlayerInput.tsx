import { useState } from 'react';
import { Player } from '../models/tournament';

interface PlayerInputProps {
  players: Player[];
  maxPlayers: number;
  disabled: boolean;
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
}

export function PlayerInput({ players, maxPlayers, disabled, onAdd, onRemove }: PlayerInputProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if (disabled) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Введите название участника.');
      return;
    }
    if (trimmed.length >= 15) {
      setError('Название должно содержать меньше 15 символов.');
      return;
    }
    if (players.length >= maxPlayers) {
      setError(`Достигнут максимум: ${maxPlayers} участников.`);
      return;
    }
    if (players.some((player) => player.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Такой участник уже добавлен.');
      return;
    }
    onAdd(trimmed);
    setName('');
    setError('');
  };

  return (
    <section className="player-input">
      <div className="player-input__heading">
        <div>
          <h2>Участники</h2>
          <p>{players.length} из {maxPlayers}</p>
        </div>
        <span className="player-input__hint">{disabled ? 'Турнир начат' : 'Enter — добавить'}</span>
      </div>

      <div className="player-input__form">
        <input
          value={name}
          maxLength={14}
          disabled={disabled}
          placeholder="Название участника"
          aria-label="Название участника"
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit();
          }}
        />
        <button type="button" className="button button--primary" disabled={disabled} onClick={submit}>
          Добавить
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="player-list">
        {players.length === 0 ? (
          <div className="player-list__empty">Добавьте минимум 4 участника.</div>
        ) : (
          players.map((player, index) => (
            <div className="player-list__item" key={player.id}>
              <span><b>{index + 1}</b>{player.name}</span>
              <button
                type="button"
                className="icon-button"
                disabled={disabled}
                onClick={() => onRemove(player.id)}
                aria-label={`Удалить ${player.name}`}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
