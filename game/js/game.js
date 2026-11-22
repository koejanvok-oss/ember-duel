/* Ember Duel — rules, turns and the duel itself. No DOM here except via EmberRender. */
(function (global) {
  'use strict';

  var MAX_LIFE = 20;
  var START_EMBER = 3;
  var MAX_EMBER = 10;
  var START_HAND = 4;

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function newFighter(name, rng, startEmber) {
    return { name: name, life: MAX_LIFE, maxLife: MAX_LIFE, shield: 0,
             ember: startEmber, maxEmber: startEmber,
             deck: global.EmberDeck.buildDeck(rng), hand: [], discard: [] };
  }

  var state = null;

  function newGame(seed) {
    var rng = global.EmberDeck.mulberry32(seed == null ? (Date.now() % 2147483647) : seed);
    state = {
      seed: seed, rng: rng, screen: 'table', turn: 'player', turnCount: 1,
      player: newFighter('You', rng, START_EMBER + 1), ai: newFighter('Kindle', rng, START_EMBER),
      aiIntent: 'attack', over: false, winner: null,
      surgeElements: { player: {}, ai: {} },
      stats: { turns: 0, cardsPlayed: 0, surges: 0, damageDealt: 0 },
      log: []
    };
    global.EmberDeck.drawCards(state.player, START_HAND, rng);
    global.EmberDeck.drawCards(state.ai, START_HAND, rng);
    state.aiIntent = global.EmberAI.chooseIntent(state.ai, state.player, rng);
    addLog('The duel begins. You strike first with a head start of ember. Kindle shows her intent: ' + global.EmberAI.INTENTS[state.aiIntent].label + '.');
    addLog('Your turn — ' + state.player.maxEmber + ' ember, draw a card and play what you can.');
    return state;
  }

  function addLog(msg) {
    if (!state) return;
    state.log.push(msg);
    if (state.log.length > 40) state.log.shift();
    if (global.EmberRender) global.EmberRender.log(msg);
  }

  function dealDamage(target, amount, sourceName) {
    if (amount <= 0) return 0;
    var absorbed = Math.min(target.shield, amount);
    target.shield -= absorbed;
    var dealt = amount - absorbed;
    target.life = Math.max(0, target.life - dealt);
    if (global.EmberRender) global.EmberRender.floatText(target === state.player ? 'player' : 'ai',
      dealt > 0 ? '-' + dealt : 'blocked', dealt > 0 ? 'dmg' : 'block');
    if (absorbed > 0) addLog(sourceName + ' hits for ' + amount + ' (' + absorbed + ' absorbed by shield).');
    else if (dealt > 0) addLog(sourceName + ' deals ' + dealt + ' damage.');
    return dealt;
  }

  function heal(fighter, amount) {
    if (amount <= 0) return;
    var before = fighter.life;
    fighter.life = Math.min(fighter.maxLife, fighter.life + amount);
    var healed = fighter.life - before;
    if (healed > 0) {
      if (global.EmberRender) global.EmberRender.floatText(fighter === state.player ? 'player' : 'ai', '+' + healed, 'heal');
      addLog(fighter.name + ' restores ' + healed + ' life.');
    }
  }

  function gainShield(fighter, amount) {
    fighter.shield += amount;
    if (global.EmberRender) global.EmberRender.floatText(fighter === state.player ? 'player' : 'ai', '+' + amount + ' shield', 'shield');
    addLog(fighter.name + ' gains ' + amount + ' shield.');
  }

  // Extra effects baked into specific cards, as their text promises.
  function cardExtra(fighter, foe, card) {
    if (card.id === 'surge' || card.id === 'undertow') {
      global.EmberDeck.drawCards(fighter, 1, state.rng);
      addLog(fighter.name + ' draws a card from the Tide.');
    } else if (card.id === 'thorn' || card.id === 'sapling') {
      heal(fighter, 2);
    } else if (card.id === 'quarry') {
      gainShield(fighter, 2);
    }
  }

  function triggerSurge(fighter, foe, element) {
    state.stats.surges++;
    var surge = global.EmberCards.SURGES[element];
    addLog('SURGE! ' + surge.text);
    if (global.EmberAudio) global.EmberAudio.sounds.surge();
    if (element === 'flame') dealDamage(foe, 3, fighter.name + "'s Flame surge");
    else if (element === 'tide') global.EmberDeck.drawCards(fighter, 1, state.rng);
    else if (element === 'leaf') heal(fighter, 3);
    else if (element === 'stone') gainShield(fighter, 4);
  }

  function resolveCard(fighter, foe, card, who) {
    var played = state.surgeElements[who];
    var isSecond = !!played[card.element];
    played[card.element] = true;

    if (card.type === 'attack') {
      if (global.EmberAudio) global.EmberAudio.sounds.damage();
      state.stats.damageDealt += (who === 'player') ? dealDamage(foe, card.value, fighter.name + "'s " + card.name) : dealDamage(foe, card.value, fighter.name + "'s " + card.name);
    } else if (card.type === 'shield') {
      if (global.EmberAudio) global.EmberAudio.sounds.shield();
      gainShield(fighter, card.value);
    } else if (card.type === 'heal') {
      if (global.EmberAudio) global.EmberAudio.sounds.heal();
      heal(fighter, card.value);
    } else if (card.type === 'draw') {
      if (global.EmberAudio) global.EmberAudio.sounds.draw();
      global.EmberDeck.drawCards(fighter, card.value, state.rng);
      addLog(fighter.name + ' draws ' + card.value + ' cards.');
    }
    cardExtra(fighter, foe, card);
    if (isSecond) triggerSurge(fighter, foe, card.element);
  }

  function playCard(who, uid) {
    if (!state || state.over || state.turn !== who) return false;
    var fighter = who === 'player' ? state.player : state.ai;
    var foe = who === 'player' ? state.ai : state.player;
    var idx = -1;
    for (var i = 0; i < fighter.hand.length; i++) if (fighter.hand[i].uid === uid) { idx = i; break; }
    if (idx === -1) return false;
    var card = fighter.hand[idx];
    if (card.cost > fighter.ember) {
      if (who === 'player') addLog('Not enough ember for ' + card.name + ' (' + card.cost + ' needed).');
      return false;
    }
    fighter.ember -= card.cost;
    fighter.hand.splice(idx, 1);
    fighter.discard.push(card);
    state.stats.cardsPlayed++;
    if (global.EmberAudio) global.EmberAudio.sounds.playCard();
    if (global.EmberRender) global.EmberRender.showPlayedCard(who, card);
    addLog(fighter.name + ' plays ' + card.name + ' (' + card.cost + ' ember).');
    resolveCard(fighter, foe, card, who);
    if (global.EmberRender) global.EmberRender.renderAll();
    checkEnd();
    return true;
  }

  function startPlayerTurn() {
    if (state.over) return;
    state.turn = 'player';
    state.turnCount++;
    state.stats.turns++;
    state.surgeElements.player = {};
    var p = state.player;
    p.shield = 0;
    p.maxEmber = Math.min(MAX_EMBER, p.maxEmber + 1);
    p.ember = p.maxEmber;
    global.EmberDeck.drawCards(p, 1, state.rng);
    // Ember storm: from turn 13 on, the table itself burns both duelists a little
    // more each round, so no duel can stall forever.
    if (state.turnCount > 12) {
      var storm = state.turnCount - 12;
      addLog('The ember storm rages — both duelists take ' + storm + ' damage.');
      dealDamage(state.player, storm, 'The ember storm');
      dealDamage(state.ai, storm, 'The ember storm');
      if (global.EmberRender) global.EmberRender.renderAll();
      checkEnd();
      if (state.over) return;
    }
    if (global.EmberAudio) global.EmberAudio.sounds.turn();
    addLog('Your turn ' + state.turnCount + ' — ' + p.maxEmber + ' ember. Kindle is ' +
      global.EmberAI.INTENTS[state.aiIntent].label + '.');
    if (global.EmberRender) global.EmberRender.renderAll();
  }

  function endPlayerTurn() {
    if (!state || state.over || state.turn !== 'player') return;
    state.turn = 'ai';
    if (global.EmberRender) global.EmberRender.renderAll();
    runAiTurn();
  }

  async function runAiTurn() {
    await sleep(500);
    if (!state || state.over) return;
    var ai = state.ai, player = state.player;
    state.surgeElements.ai = {};
    ai.shield = 0;
    ai.maxEmber = Math.min(MAX_EMBER, ai.maxEmber + 1);
    ai.ember = ai.maxEmber;
    global.EmberDeck.drawCards(ai, 1, state.rng);
    var intent = state.aiIntent;
    addLog("Kindle's turn — " + global.EmberAI.INTENTS[intent].detail);
    if (global.EmberRender) global.EmberRender.renderAll();
    await sleep(500);
    var picks = global.EmberAI.planTurn(ai, player, intent, state.rng);
    for (var i = 0; i < picks.length; i++) {
      if (state.over) break;
      playCard('ai', picks[i]);
      await sleep(600);
    }
    if (state.over) return;
    await sleep(400);
    state.aiIntent = global.EmberAI.chooseIntent(ai, player, state.rng);
    addLog('Kindle shows her next intent: ' + global.EmberAI.INTENTS[state.aiIntent].label + '.');
    startPlayerTurn();
  }

  function checkEnd() {
    if (!state || state.over) return;
    var winner = null;
    if (state.ai.life <= 0 && state.player.life <= 0) winner = state.player.life >= state.ai.life ? 'player' : 'ai';
    else if (state.ai.life <= 0) winner = 'player';
    else if (state.player.life <= 0) winner = 'ai';
    if (!winner) return;
    state.over = true;
    state.winner = winner;
    state.screen = 'end';
    if (global.EmberAudio) global.EmberAudio.sounds[winner === 'player' ? 'win' : 'lose']();
    addLog(winner === 'player' ? 'Kindle falls. The embers are yours!' : 'Kindle wins the duel.');
    if (global.EmberRender) global.EmberRender.showEnd(winner);
  }

  function getState() { return state; }

  global.EmberGame = { newGame: newGame, playCard: playCard, endPlayerTurn: endPlayerTurn,
                       startPlayerTurn: startPlayerTurn, getState: getState, addLog: addLog,
                       MAX_LIFE: MAX_LIFE };
})(typeof window !== 'undefined' ? window : globalThis);
