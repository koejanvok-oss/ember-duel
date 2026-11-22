[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/koejanvok-oss/ember-duel/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/koejanvok-oss/ember-duel/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

# Ember Duel

Ember Duel — an original two-player card battler of ember and elements, played against a readable AI rival.

You duel Kindle, a rival who always tells you her next move. Each side has 20 life. Every turn you gain ember and draw a card; cards cost ember and strike, shield, draw or heal. Four elements — Flame ▲, Tide ●, Leaf ◆, Stone ■ — are told apart by colour *and* shape, and playing two cards of the same element in one turn triggers a surge bonus. Read Kindle's intent banner ("gathering embers", "raising guard", "stoking flames") and counter it before her turn lands.

- Played with mouse and keyboard: click a card (or press 1–5) to play it, Enter/Space ends your turn, M mutes sound.
- Title screen, table, win and loss screens; cards slide and snap, damage numbers float, and all sound is generated live with WebAudio — no audio files.
- Static files only: no build step, no network requests. All game code, art and sounds are original.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser.

Entered on [make.fun](https://make.fun/?ref=koejanvok-oss&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards
