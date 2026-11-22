/* Ember Duel — Kindle, the AI rival. She telegraphs her intent, then follows it. */
(function (global) {
  'use strict';

  var INTENTS = {
    gather: { label: 'gathering embers', hint: 'She banks ember — expect a heavy turn next round.',
              detail: 'Kindle gathers embers, playing little and saving up.' },
    guard:  { label: 'raising guard',    hint: 'She will shield and mend — strike now or outlast her.',
              detail: 'Kindle raises her guard, shielding and healing.' },
    attack: { label: 'stoking flames',   hint: 'A big attack is coming — shield up or end it fast.',
              detail: 'Kindle stokes her flames and attacks hard.' }
  };

  // Pick next turn's intent from the board. Readable, not random: hurt rivals attack,
  // wounded rivals guard, and a rival with little ember gathers.
  function chooseIntent(ai, player, rng) {
    if (ai.life <= 8 && rng() < 0.65) return 'guard';
    if (player.life <= 7 && rng() < 0.7) return 'attack';
    if (ai.ember < 4 && rng() < 0.6) return 'gather';
    var roll = rng();
    if (roll < 0.45) return 'attack';
    if (roll < 0.75) return 'guard';
    return 'gather';
  }

  // Score a card for the AI under its current intent.
  function scoreCard(card, ai, player, intent) {
    var s = 0;
    var missing = ai.maxLife - ai.life;
    if (card.type === 'attack') {
      s = card.value * 2;
      if (intent === 'attack') s += 4;
      if (player.life - card.value <= 0) s += 100; // lethal
      if (player.shield > 0) s -= Math.min(player.shield, card.value);
    } else if (card.type === 'shield') {
      s = card.value + (intent === 'guard' ? 5 : 0) + (player.life < ai.life ? 1 : 0);
      if (ai.shield >= 8) s -= 4;
    } else if (card.type === 'heal') {
      s = missing > 0 ? card.value + (intent === 'guard' ? 5 : 0) : -3;
      if (missing < card.value) s -= 2;
    } else if (card.type === 'draw') {
      s = 3 + (intent === 'gather' ? 3 : 0);
    }
    // Prefer cheap cards when ember is tight; prefer element matches for surge combos.
    s -= card.cost * 0.5;
    return s;
  }

  // Plan the AI's turn: which cards to play, in order, given its intent and ember.
  // Returns an array of hand indexes. Gathering rivals play at most one cheap card.
  function planTurn(ai, player, intent, rng) {
    var ember = ai.ember;
    var hand = ai.hand.slice();
    var picks = [];
    var playedElements = {};
    var guard = intent === 'gather' ? 1 : 3; // Kindle never empties her whole hand in one turn
    var safety = 0;
    while (safety++ < 12 && picks.length < guard) {
      var best = -1, bestScore = 0;
      var affordable = [];
      for (var i = 0; i < hand.length; i++) {
        var c = hand[i];
        if (!c || c.cost > ember) continue;
        affordable.push(i);
        var sc = scoreCard(c, ai, player, intent);
        if (playedElements[c.element]) sc += 3; // surge combo is worth chasing
        if (sc > bestScore) { bestScore = sc; best = i; }
      }
      if (best === -1) break;
      // Kindle is readable, not perfect: sometimes she misreads the table.
      if (rng() < 0.25) best = affordable[Math.floor(rng() * affordable.length)];
      var card = hand[best];
      picks.push(card.uid);
      playedElements[card.element] = true;
      ember -= card.cost;
      hand[best] = null;
      if (intent === 'gather' && rng() < 0.5) break;
    }
    return picks;
  }

  global.EmberAI = { INTENTS: INTENTS, chooseIntent: chooseIntent, planTurn: planTurn };
})(typeof window !== 'undefined' ? window : globalThis);
