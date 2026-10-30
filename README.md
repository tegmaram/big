# 🎮 Open Source Game Launcher

A fully open-source game launcher with **142 MIT-licensed HTML5 games**. Play instantly in your browser — no installs, no signups, no server, no hidden code.

🌐 **Live on GitHub Pages:** `https://<your-username>.github.io/<repo>/`

---

## What's included

| Item | Count |
|------|-------|
| Games | 215 (142 open-source + 73 external links) |
| Categories | 10 (Puzzle, Arcade, Shooter, Racing, Sports, Platformer, Casual, Board, Word & Quiz, 3D) |
| License | MIT (launcher + open-source games; external links keep their own licenses) |
| Build step | None — pure HTML/CSS/JS |

## Games

Includes classics and originals: **2048, Tetris, Pac-Man, Snake, Chess, Sudoku, Doodle Jump, Flappy, Breakout, Car Race (3D), Stack Tower (3D), Space Fighter, Wordle, Math Quest, Ludo, Carrom,** and many more.

## External games (Classroom Resources / Google Sites)

73 additional games are linked from the [Classroom Resources Google Site](https://sites.google.com/view/drive-u-7-home/home). These are **external links** — clicking them opens the game on its original site in a new tab. They're marked with an orange **"EXTERNAL"** badge in the launcher.

Examples: Survival Race, Snow Rider, Basket Random, Paper.io 2, Slither.io 2, Moto X3M Winter, Basket Random, Soccer Random, Knife Hit, Granny, GTA Simulator, CS 1.6, and many more.

These are included as links only — no game code is copied, so each game retains its own license and terms.

Every game is a standalone HTML page under `games/<category>/<slug>/index.html` with its own assets. Games open in a new tab when you click them.

## How it works

1. `index.html` — the launcher UI (search, category filters, game grid)
2. `games.json` — manifest of all 142 games (name, category, path, tags, description)
3. `app.js` — loads `games.json`, renders the grid, handles search/filter/click
4. `style.css` — responsive, dark-theme styling
5. `games/` — all 142 game folders, each self-contained
6. `test.html` — test suite that loads each game in a hidden iframe and reports PASS/FAIL

No backend server is needed. Everything runs static on GitHub Pages.

## Test suite

Open `test.html` to run the automated test suite. It attempts to load every game in a hidden iframe and reports which ones pass or fail:

```
Total: 142   Passed: 142   Failed: 0
```

## Adding a new game

1. Create a folder: `games/<category>/<slug>/`
2. Add your `index.html` and any `assets/` it needs
3. Add an entry to `games.json`:
   ```json
   {
     "id": "my-game",
     "name": "My Game",
     "category": "arcade",
     "path": "games/arcade/my-game/index.html",
     "tech": "html",
     "tags": ["fun", "quick"],
     "description": "A short description."
   }
   ```
4. Commit and push — GitHub Pages redeploys automatically.

## Classroom / unblocked games

This launcher focuses on **open-source** games whose source is visible on GitHub. Many "Classroom 6x" / Google Sites games (Among Us, Vex, Moto X3M, Cookie Clicker, etc.) are **copyrighted** and not open source, so they cannot legally be bundled here. You can still add them as external links in `games.json` if you want them listed — just set `"path"` to their URL.

## License

- **Launcher code** (`index.html`, `style.css`, `app.js`, `test.html`, `games.json`, `README.md`): MIT License
- **Games**: each game keeps its own license (all are MIT or similarly permissive, sourced from [sausi-7/games](https://github.com/sausi-7/games))

See `LICENSE` and `registry.json` (original manifest) for details.

## Deploy to GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Set source to **Deploy from a branch** → `main` (or `master`) → `/ (root)`
4. Your site is live at `https://<user>.github.io/<repo>/`

The `.nojekyll` file is included so GitHub Pages serves all files as-is.

---

Built with ❤️ for open-source gaming. All source visible, nothing hidden.