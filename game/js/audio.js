/* Ember Duel — all sound is generated with WebAudio in code; no audio files. */
(function (global) {
  'use strict';

  var ctx = null;
  var muted = false;

  function ensure() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, when, slideTo) {
    if (muted) return;
    var c = ensure();
    if (!c) return;
    var t = c.currentTime + (when || 0);
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function noise(dur, vol, when, lowpass) {
    if (muted) return;
    var c = ensure();
    if (!c) return;
    var t = c.currentTime + (when || 0);
    var len = Math.floor(c.sampleRate * dur);
    var buf = c.createBuffer(1, len, c.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = c.createBufferSource();
    src.buffer = buf;
    var filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass || 1200;
    var gain = c.createGain();
    gain.gain.setValueAtTime(vol || 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(gain).connect(c.destination);
    src.start(t);
  }

  var sounds = {
    click: function () { tone(660, 0.07, 'triangle', 0.08); },
    playCard: function () { tone(520, 0.12, 'triangle', 0.14, 0, 780); noise(0.08, 0.06, 0, 3000); },
    draw: function () { tone(880, 0.06, 'sine', 0.07, 0, 1100); },
    damage: function () { tone(160, 0.22, 'sawtooth', 0.16, 0, 70); noise(0.18, 0.14, 0, 500); },
    shield: function () { tone(340, 0.16, 'sine', 0.12, 0, 520); tone(510, 0.16, 'sine', 0.08, 0.05, 680); },
    heal: function () { tone(523, 0.14, 'sine', 0.11); tone(659, 0.14, 'sine', 0.11, 0.09); tone(784, 0.22, 'sine', 0.11, 0.18); },
    surge: function () { tone(440, 0.1, 'square', 0.07); tone(660, 0.1, 'square', 0.07, 0.08); tone(880, 0.18, 'square', 0.07, 0.16); },
    turn: function () { tone(392, 0.1, 'triangle', 0.1); tone(523, 0.12, 'triangle', 0.1, 0.09); },
    win: function () {
      [523, 659, 784, 1047, 784, 1047].forEach(function (f, i) { tone(f, 0.22, 'triangle', 0.13, i * 0.13); });
    },
    lose: function () {
      [392, 330, 262, 196].forEach(function (f, i) { tone(f, 0.3, 'sine', 0.12, i * 0.18); });
    }
  };

  function toggleMute() { muted = !muted; return muted; }

  global.EmberAudio = { sounds: sounds, toggleMute: toggleMute,
                        isMuted: function () { return muted; }, ensure: ensure };
})(typeof window !== 'undefined' ? window : globalThis);
