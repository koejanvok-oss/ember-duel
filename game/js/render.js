/* Ember Duel — DOM rendering, card animation and floating combat text. */
(function (global) {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function showScreen(name) {
    ['screen-title', 'screen-table', 'screen-end'].forEach(function (id) {
      $(id).hidden = (id !== 'screen-' + name);
    });
  }

  function cardEl(card, opts) {
    opts = opts || {};
    var el = global.EmberCards.ELEMENTS[card.element];
    var div = document.createElement('div');
    div.className = 'card el-' + card.element + (opts.playable ? ' playable' : '') +
      (opts.disabled ? ' disabled' : '') + (opts.back ? ' card-back' : '');
    div.dataset.uid = card.uid;
    if (opts.back) {
      div.innerHTML = '<div class="card-back-glyph">▲</div>';
      return div;
    }
    div.innerHTML =
      '<div class="card-cost">' + card.cost + '</div>' +
      '<div class="card-glyph" style="color:' + el.color + '">' + el.glyph + '</div>' +
      '<div class="card-name">' + card.name + '</div>' +
      '<div class="card-type">' + el.name + ' · ' + global.EmberCards.typeLabel(card.type) + '</div>' +
      '<div class="card-value">' + card.value + '</div>' +
      '<div class="card-text">' + card.text + '</div>' +
      (opts.keyHint ? '<div class="card-key">' + opts.keyHint + '</div>' : '');
    if (opts.onClick) div.addEventListener('click', function () { opts.onClick(card); });
    return div;
  }

  function renderAll() {
    var s = global.EmberGame.getState();
    if (!s) return;
    showScreen(s.screen === 'end' ? 'end' : 'table');
    if (s.screen === 'end') return;

    // Life bars
    $('player-life-fill').style.width = (s.player.life / s.player.maxLife * 100) + '%';
    $('ai-life-fill').style.width = (s.ai.life / s.ai.maxLife * 100) + '%';
    $('player-life-text').textContent = s.player.life + ' / ' + s.player.maxLife;
    $('ai-life-text').textContent = s.ai.life + ' / ' + s.ai.maxLife;
    $('player-ember-text').textContent = s.player.ember + ' / ' + s.player.maxEmber + ' ember';
    $('ai-ember-text').textContent = s.ai.ember + ' / ' + s.ai.maxEmber + ' ember';
    $('player-shield-text').textContent = s.player.shield > 0 ? '🛡 ' + s.player.shield + ' shield' : '';
    $('ai-shield-text').textContent = s.ai.shield > 0 ? '🛡 ' + s.ai.shield + ' shield' : '';
    $('deck-counts').textContent = 'Deck ' + s.player.deck.length + ' · Discard ' + s.player.discard.length +
      ' · Turn ' + s.turnCount;

    // Intent
    var intent = global.EmberAI.INTENTS[s.aiIntent];
    $('intent-text').textContent = s.turn === 'ai' ? 'Kindle is acting…' :
      'Kindle is ' + intent.label + ' — ' + intent.hint;
    $('turn-text').textContent = s.over ? 'Duel over' : s.turn === 'player' ? 'Your turn' : "Kindle's turn";
    $('turn-text').className = 'turn-text ' + (s.turn === 'player' ? 'your-turn' : 'ai-turn');
    $('btn-end-turn').disabled = s.turn !== 'player' || s.over;

    // AI hand (face down)
    var aiHand = $('ai-hand');
    aiHand.innerHTML = '';
    s.ai.hand.forEach(function (c) { aiHand.appendChild(cardEl(c, { back: true })); });

    // Player hand
    var hand = $('player-hand');
    hand.innerHTML = '';
    s.player.hand.forEach(function (c, i) {
      var playable = s.turn === 'player' && !s.over && c.cost <= s.player.ember;
      hand.appendChild(cardEl(c, {
        playable: playable, disabled: !playable,
        keyHint: String(i + 1),
        onClick: function (card) {
          if (global.EmberGame.playCard('player', card.uid)) {
            if (global.EmberAudio) global.EmberAudio.sounds.click();
          } else if (global.EmberAudio) global.EmberAudio.sounds.click();
        }
      }));
    });

    // Log
    var logEl = $('log');
    logEl.innerHTML = '';
    s.log.slice(-8).forEach(function (line) {
      var p = document.createElement('div');
      p.textContent = line;
      logEl.appendChild(p);
    });
    logEl.scrollTop = logEl.scrollHeight;
  }

  function log(msg) {
    var s = global.EmberGame.getState();
    if (!s || s.screen !== 'table') return;
    var logEl = $('log');
    if (!logEl) return;
    var p = document.createElement('div');
    p.textContent = msg;
    logEl.appendChild(p);
    while (logEl.children.length > 8) logEl.removeChild(logEl.firstChild);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function showPlayedCard(who, card) {
    var area = $('played-area');
    if (!area) return;
    var div = cardEl(card, {});
    div.classList.add('played-card', who === 'player' ? 'from-player' : 'from-ai');
    area.appendChild(div);
    while (area.children.length > 4) area.removeChild(area.firstChild);
    setTimeout(function () { div.classList.add('settle'); }, 30);
    setTimeout(function () { if (div.parentNode) div.classList.add('fade'); }, 2600);
    setTimeout(function () { if (div.parentNode) div.parentNode.removeChild(div); }, 3200);
  }

  function floatText(who, text, kind) {
    var layer = $('float-layer');
    if (!layer) return;
    var anchor = who === 'player' ? document.querySelector('.player-side') : document.querySelector('.ai-side');
    if (!anchor) return;
    var rect = anchor.getBoundingClientRect();
    var span = document.createElement('div');
    span.className = 'float-text ' + kind;
    span.textContent = text;
    span.style.left = (rect.left + rect.width / 2) + 'px';
    span.style.top = (rect.top + 10) + 'px';
    layer.appendChild(span);
    setTimeout(function () { if (span.parentNode) span.parentNode.removeChild(span); }, 1400);
    if (kind === 'dmg') {
      document.getElementById('app').classList.add('shake');
      setTimeout(function () { document.getElementById('app').classList.remove('shake'); }, 300);
    }
  }

  function showEnd(winner) {
    var s = global.EmberGame.getState();
    showScreen('end');
    var win = winner === 'player';
    $('end-title').textContent = win ? 'VICTORY' : 'DEFEAT';
    $('end-title').className = 'end-title ' + (win ? 'win' : 'lose');
    $('end-emblem').textContent = win ? '▲' : '●';
    $('end-emblem').className = 'end-emblem ' + (win ? 'win' : 'lose');
    $('end-sub').textContent = win
      ? 'Kindle bows to the embers. The duel — and the table — are yours.'
      : 'Kindle takes the embers this time. Shuffle up and challenge her again.';
    $('end-stats').innerHTML =
      '<div>Turns played <b>' + s.stats.turns + '</b></div>' +
      '<div>Cards played <b>' + s.stats.cardsPlayed + '</b></div>' +
      '<div>Surges triggered <b>' + s.stats.surges + '</b></div>' +
      '<div>Damage you dealt <b>' + s.stats.damageDealt + '</b></div>';
  }

  global.EmberRender = { renderAll: renderAll, log: log, showPlayedCard: showPlayedCard,
                         floatText: floatText, showEnd: showEnd, showScreen: showScreen };
})(typeof window !== 'undefined' ? window : globalThis);
