/* Ember Duel — card definitions. All names, art and values are original. */
(function (global) {
  'use strict';

  // Four elements, told apart by colour AND shape so the game reads without colour alone.
  var ELEMENTS = {
    flame: { name: 'Flame', glyph: '▲', color: '#ff5a2a', dark: '#c22e00', glow: 'rgba(255,90,42,.45)' },
    tide:  { name: 'Tide',  glyph: '●', color: '#2aa8ff', dark: '#0b5fa8', glow: 'rgba(42,168,255,.45)' },
    leaf:  { name: 'Leaf',  glyph: '◆', color: '#3ecf5a', dark: '#157a2e', glow: 'rgba(62,207,90,.45)' },
    stone: { name: 'Stone', glyph: '■', color: '#c9a35c', dark: '#7a5c22', glow: 'rgba(201,163,92,.45)' }
  };

  // type: attack | shield | draw | heal. value is the main number on the card.
  var CARD_POOL = [
    { id: 'spark',    name: 'Ember Spark',   element: 'flame', type: 'attack', cost: 1, value: 3, text: 'Deal 3 damage.' },
    { id: 'lash',     name: 'Flame Lash',    element: 'flame', type: 'attack', cost: 2, value: 5, text: 'Deal 5 damage.' },
    { id: 'wildfire', name: 'Wildfire',      element: 'flame', type: 'attack', cost: 3, value: 8, text: 'Deal 8 damage.' },
    { id: 'cinder',   name: 'Cinder Guard',  element: 'flame', type: 'shield', cost: 1, value: 4, text: 'Gain 4 shield.' },
    { id: 'surge',    name: 'Tide Surge',    element: 'tide',  type: 'attack', cost: 1, value: 2, text: 'Deal 2 damage. Draw a card.' },
    { id: 'undertow', name: 'Undertow',      element: 'tide',  type: 'attack', cost: 2, value: 4, text: 'Deal 4 damage. Draw a card.' },
    { id: 'deep',     name: 'Deep Current',  element: 'tide',  type: 'draw',   cost: 2, value: 2, text: 'Draw 2 cards.' },
    { id: 'mist',     name: 'Mist Veil',     element: 'tide',  type: 'shield', cost: 1, value: 5, text: 'Gain 5 shield.' },
    { id: 'thorn',    name: 'Thorn Whip',    element: 'leaf',  type: 'attack', cost: 1, value: 2, text: 'Deal 2 damage. Heal 2.' },
    { id: 'bloom',    name: 'Ember Bloom',   element: 'leaf',  type: 'heal',   cost: 2, value: 6, text: 'Restore 6 life.' },
    { id: 'sapling',  name: 'Sapling Ward',  element: 'leaf',  type: 'shield', cost: 1, value: 3, text: 'Gain 3 shield. Heal 2.' },
    { id: 'grove',    name: 'Grove Mend',    element: 'leaf',  type: 'heal',   cost: 1, value: 4, text: 'Restore 4 life.' },
    { id: 'pebble',   name: 'Pebble Shot',   element: 'stone', type: 'attack', cost: 1, value: 3, text: 'Deal 3 damage.' },
    { id: 'boulder',  name: 'Boulder Fall',  element: 'stone', type: 'attack', cost: 2, value: 6, text: 'Deal 6 damage.' },
    { id: 'rampart',  name: 'Stone Rampart', element: 'stone', type: 'shield', cost: 2, value: 8, text: 'Gain 8 shield.' },
    { id: 'quarry',   name: 'Quarry Haul',   element: 'stone', type: 'draw',   cost: 1, value: 1, text: 'Draw 1 card. Gain 2 shield.' }
  ];

  // Surge bonus when two cards of the same element are played in one turn.
  var SURGES = {
    flame: { text: 'Flame surge: +3 damage!', apply: function (s) { s.bonusDamage += 3; } },
    tide:  { text: 'Tide surge: draw a card!', apply: function (s) { s.bonusDraw += 1; } },
    leaf:  { text: 'Leaf surge: heal 3!',      apply: function (s) { s.bonusHeal += 3; } },
    stone: { text: 'Stone surge: +4 shield!',  apply: function (s) { s.bonusShield += 4; } }
  };

  var uid = 0;
  function makeCard(defId) {
    var def = null;
    for (var i = 0; i < CARD_POOL.length; i++) if (CARD_POOL[i].id === defId) { def = CARD_POOL[i]; break; }
    if (!def) throw new Error('unknown card ' + defId);
    return { uid: ++uid, id: def.id, name: def.name, element: def.element,
             type: def.type, cost: def.cost, value: def.value, text: def.text };
  }

  function typeLabel(type) {
    return { attack: 'Strike', shield: 'Guard', draw: 'Flow', heal: 'Mend' }[type] || type;
  }

  global.EmberCards = { ELEMENTS: ELEMENTS, CARD_POOL: CARD_POOL, SURGES: SURGES,
                        makeCard: makeCard, typeLabel: typeLabel };
})(typeof window !== 'undefined' ? window : globalThis);
