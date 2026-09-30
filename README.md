# Tournament Bracket App

Веб-приложение для организации турнирной сетки на React + TypeScript + Webpack.

## Возможности

- от 4 до 64 участников;
- добавление участника клавишей Enter;
- ограничение названия: менее 15 символов;
- удаление участников до создания сетки;
- автоматическое построение single-elimination сетки;
- автоматическая обработка BYE для количества участников, не являющегося степенью двойки;
- раунды до финала;
- выбор победителя матча нажатием на участника;
- перенос победителя в следующий раунд;
- матч за 3-е место после определения полуфиналистов;
- отображение чемпиона;
- состояния матчей: pending / ready / completed;
- перемещение сетки мышью;
- масштабирование Ctrl + колесо мыши и кнопками;
- адаптивный интерфейс;
- разделение моделей, бизнес-логики и компонентов интерфейса.

## Структура

```text
src/
├── components/
│   ├── Bracket.tsx
│   ├── BracketGrid.tsx
│   ├── ChampionBanner.tsx
│   ├── Match.tsx
│   ├── PlayerInput.tsx
│   └── TournamentControls.tsx
├── models/
│   └── tournament.ts
├── services/
│   └── tournamentService.ts
├── styles/
│   └── main.css
├── App.tsx
└── index.tsx
public/
└── index.html
package.json
tsconfig.json
webpack.config.js
eslint.config.js
.prettierrc
```

## Запуск

Требуется Node.js 18+.

```bash
npm install
npm start
```

После запуска приложение доступно на `http://localhost:8080`.

## Production-сборка

```bash
npm run build
```

Результат помещается в `dist/`.
