/* Ember Duel — boot, input and the screenshot/debug hooks. */
(function () {
  'use strict';

  function params() { return new URLSearchParams(window.location.search); }

  function startDuel(seed) {
    globalThis.EmberGame.newGame(seed);
    globalThis.EmberRender.showScreen('table');
    globalThis.EmberRender.renderAll();
  }

  function showTitle() {
    globalThis.EmberRender.showScreen('title');
  }

  function endScreen(win) {
    // Debug hook: jump straight to a win/loss screen for screenshots and testing.
    // The same screens are always reachable by real play.
    var s = globalThis.EmberGame.newGame(7);
    s.player.life = win ? 14 : 0;
    s.ai.life = win ? 0 : 15;
    s.stats.turns = win ? 9 : 8;
    s.stats.cardsPlayed = win ? 23 : 19;
    s.stats.surges = 4;
    s.stats.damageDealt = win ? 27 : 18;
    s.over = true;
    s.winner = win ? 'player' : 'ai';
    s.screen = 'end';
    globalThis.EmberRender.showEnd(win ? 'player' : 'ai');
  }

  function applyShot() {
    var q = params();
    var shot = q.get('shot');
    var seed = q.get('seed') ? parseInt(q.get('seed'), 10) : 7;
    if (!shot) return false;
    if (shot === 'title') { showTitle(); return true; }
    if (shot === 'table') {
      startDuel(seed);
      // Play a couple of opening moves so the table looks lived-in.
      var s = globalThis.EmberGame.getState();
      var c = s.player.hand[0];
      if (c && c.cost <= s.player.ember) globalThis.EmberGame.playCard('player', c.uid);
      return true;
    }
    if (shot === 'win') { endScreen(true); return true; }
    if (shot === 'loss') { endScreen(false); return true; }
    return false;
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (applyShot()) return;
    showTitle();

    document.getElementById('btn-start').addEventListener('click', function () {
      globalThis.EmberAudio.ensure();
      globalThis.EmberAudio.sounds.turn();
      startDuel();
    });
    document.getElementById('btn-how').addEventListener('click', function () {
      var h = document.getElementById('howto');
      h.hidden = !h.hidden;
      globalThis.EmberAudio.sounds.click();
    });
    document.getElementById('btn-end-turn').addEventListener('click', function () {
      globalThis.EmberAudio.sounds.click();
      globalThis.EmberGame.endPlayerTurn();
    });
    document.getElementById('btn-again').addEventListener('click', function () {
      globalThis.EmberAudio.sounds.turn();
      startDuel();
    });
    document.getElementById('btn-title').addEventListener('click', function () {
      showTitle();
    });

    document.addEventListener('keydown', function (e) {
      var s = globalThis.EmberGame.getState();
      if (e.key === 'm' || e.key === 'M') {
        var muted = globalThis.EmberAudio.toggleMute();
        if (s) globalThis.EmberGame.addLog(muted ? 'Sound muted.' : 'Sound on.');
        return;
      }
      if (!s || s.screen !== 'table' || s.over) {
        if ((e.key === 'Enter' || e.key === ' ') && s && s.screen === 'end') startDuel();
        return;
      }
      if (e.key >= '1' && e.key <= '9') {
        var idx = parseInt(e.key, 10) - 1;
        var card = s.player.hand[idx];
        if (card) globalThis.EmberGame.playCard('player', card.uid);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        globalThis.EmberGame.endPlayerTurn();
      }
    });
  });

  // Test hook for play-testing and screenshots (also reachable via ?shot=).
  window.__emberDuel = {
    start: startDuel,
    state: function () { return globalThis.EmberGame.getState(); },
    playCard: function (uid) { return globalThis.EmberGame.playCard('player', uid); },
    endTurn: function () { globalThis.EmberGame.endPlayerTurn(); },
    forceWin: function () { endScreen(true); },
    forceLoss: function () { endScreen(false); }
  };
})();
