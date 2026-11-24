# Claude Quest

A cute 3D browser adventure that teaches Claude, one world at a time. Before each world, Jesi and Sparky watch a lesson from the **Master The Claude Ecosystem** playlist (by Futurepedia) on the Theater TV. The level unlocks after about 90% of the video has really been watched, or right away if the player presses **Skip video** (tap it twice to confirm).

## How to play

1. Double-click **`Start Game.bat`**. A small window opens and the game opens in your browser at `http://localhost:8765/`.
2. Keep that window open while you play. Close it to stop the game.

The game needs to run from a web address because YouTube won't play embedded videos in a page opened straight from a file.

## Controls

| Key | What it does |
|---|---|
| WASD / arrow keys | Move |
| Space | Jump. Hold it to jump higher, and press it again in the air to double jump |
| Shift | Dash |
| E | Talk / interact |
| Drag the mouse, or Q / R | Look around |
| Mouse wheel | Zoom |
| B | Sticker Book (your cheat sheets) |
| P | Save menu |
| M | Sound on/off |

## Saving

The game saves by itself when you finish a world, collect a star or enter a world. Press **P** (or the disk button) to save to one of three slots, or to download a backup file you can load on another computer or browser. Loading puts you at the start of the world you were in, so finished worlds, stars and stickers are kept, but steps inside an unfinished world are not.

## The worlds

| World | Video lesson | Status |
|---|---|---|
| Hub: Promptopia | (none) | Done |
| 0 · Memory Portal | Understand the FULL Claude Ecosystem in One Video | Done |
| 1 · Model Meadow, plus the Token Muncher boss | Use Claude Better Than 99% of People (1:22 to 4:13) | Done |
| 2 · Context Caves, plus the Shiny Siren boss | Full Claude Tutorial: Beginner to Advanced in 19 Minutes | Done |
| 3 · Connector Cliffs, plus the Static Snake mini-boss | Use Claude Better Than 99% of People (6:00 to 7:31) | Done |
| 4 · Project Village, plus the Forgetful Golem boss | The 3 Most Powerful Claude Features Beginners Don't Know About | Done |
| 5 · Skill Kitchen, plus the Again-Again Pudding boss | Claude Skills Made Simple | Done |
| 6 · Cowork Clocktower, plus Ringo the Alarm Clock boss | Full Claude Cowork Tutorial | Done |
| 7 · Code Cloud Castle | From Zero to Claude Code in 19 Minutes (no code) | Done |
| Final boss: the Vague King (unlocks after the Grand Lesson) | Full Claude Code Tutorial for Non-Technical Beginners | Done |
| ★ Design Studio (bonus), plus the Blandy the Beige Blob boss. Opens after World 0 | A Complete Guide to the New Claude Design, and Claude Design Just Unlocked AI Motion Graphics | Done |

## Credits

Every video lesson in this game is by **[Futurepedia](https://www.youtube.com/@futurepedia_io)**, from the YouTube playlist **"Master The Claude Ecosystem"**. The videos and their content belong to their creator. Claude Quest is a fan-made learning game. It only plays the videos through YouTube's official embedded player and builds its lessons and activities around them. Please support the creator by watching, liking and subscribing on YouTube.

The credit also appears in the game: on the title screen, under every video in the Theater, in the Sticker Book and on the ending screen.

## For testing

- While the Theater is open, type `skipit` to mark the current video as watched.
- In the browser console: `jesiDev.unlockAll()` unlocks everything, and `jesiDev.reset()` wipes your saved progress.

## Files

- `index.html`, `css/style.css`: the page, the HUD, dialogue, theater and sticker book
- `js/main.js`: the game loop, camera and level flow
- `js/data.js`: the videos, the worlds and the sticker-book cheat sheets
- `js/creatures.js`, `js/creatures2.js`, `js/creatures3.js`: all the big-eyed characters (heroes, Sparky, critters, NPCs and bosses)
- `js/boss.js`: the shared boss brain (attacks, dizzy phase, power pad)
- `js/level.js`: platforms, physics, triggers, portals, gates and the learn-by-playing lesson sparks
- `js/levels/*.js`: one file per world
- `js/theater.js`: the YouTube watch-to-unlock theater
