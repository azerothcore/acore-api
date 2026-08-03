## Azeroth API

This project is a RESTful APIs for [AzerothCore](https://azerothcore.org).

This API support these tools:
- [ServerStatus](https://github.com/azerothcore/server-status/)
- [ArenaStats](https://github.com/azerothcore/arena-stats)
- [BG Queue Abuser Viewer](https://github.com/Helias/BG-Queue-Abuser-Viewer)
- [WoW Statistics](https://github.com/azerothcore/wow-statistics)

### Requirements

- NodeJS & npm
- MySQL
- AzerothCore database

### Installation

```
$ npm install
```

Copy the configuration file `.env.example` file into `.env` and fill it.

Run the project:
```
$ npm start
```

Now you can locally access to the API routes through [http://localhost:3000](http://localhost:3000).

### Challenge modes

The challenge-modes endpoints read the tables of the
[challenge-modes](https://github.com/r-o-b-o-t-o/challenge-modes) module, which live in a separate
Eluna schema on the same MySQL server as the characters database. Set `ELUNA_DATABASE_NAME` in
`.env` to that schema name (`ac_eluna` on ChromieCraft).

- `GET /characters/challenge_modes/leaderboard?challenge=1` — ranked characters for one challenge
  combination. `challenge` is the exact bitmask (Hardcore = 1, Ironman = 2, Bloodthirsty = 4, so
  1-7), matching the in-game Hall of Fame where every combination is its own competition. Optional
  `status` (`all`, `active`, `completed`, `dead`), `class`, `name`, `page` and `limit` (max 100).
  Characters are ranked by completion, then level, then lowest played time.
- `GET /characters/challenge_modes/stats` — per-combination totals of participants, active runs,
  completions and deaths.

### Credits

- [IntelligentQuantum](https://github.com/IntelligentQuantum)

AzerothCore: [repository](https://github.com/azerothcore) - [website](http://azerothcore.org/) - [discord chat community](https://discord.gg/PaqQRkd)
