/* Ember Duel — deck building, shuffling and drawing. */
(function (global) {
  'use strict';

  // A 30-card deck: two copies of most cards, one of the heavy hitters.
  var DECK_LIST = [
    'spark', 'spark', 'lash', 'lash', 'wildfire', 'cinder', 'cinder',
    'surge', 'surge', 'undertow', 'deep', 'mist', 'mist',
    'thorn', 'thorn', 'bloom', 'sapling', 'sapling', 'grove', 'grove',
    'pebble', 'pebble', 'boulder', 'boulder', 'rampart', 'quarry', 'quarry',
    'lash', 'undertow', 'bloom'
  ];

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(arr, rng) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function buildDeck(rng) {
    var cards = DECK_LIST.map(function (id) { return global.EmberCards.makeCard(id); });
    return shuffle(cards, rng);
  }

  // Draw n cards from deck into hand; reshuffle the discard pile when the deck runs dry.
  function drawCards(fighter, n, rng) {
    var drawn = [];
    for (var i = 0; i < n; i++) {
      if (fighter.deck.length === 0) {
        if (fighter.discard.length === 0) break;
        fighter.deck = shuffle(fighter.discard, rng);
        fighter.discard = [];
      }
      drawn.push(fighter.deck.pop());
    }
    fighter.hand = fighter.hand.concat(drawn);
    return drawn;
  }

  global.EmberDeck = { buildDeck: buildDeck, drawCards: drawCards, mulberry32: mulberry32,
                       shuffle: shuffle, DECK_SIZE: DECK_LIST.length };
})(typeof window !== 'undefined' ? window : globalThis);
