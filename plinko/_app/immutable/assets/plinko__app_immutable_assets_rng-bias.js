// Heavy RNG bias for Plinko: biases Math.random toward 0.5 so you rarely lose.
// Install: put this file at plinko/_app/immutable/assets/rng-bias.js
// Then add <script src="./_app/immutable/assets/rng-bias.js"></script> into plinko/index.html
(() => {
  const _origRandom = Math.random.bind(Math);
  // TUNE THESE FOR STRENGTH:
  // Probability of returning a strongly biased value (vs uniform)
  let BIAS_PROB = 0.97;     // 97% biased, 3% original uniform
  // Standard deviation of gaussian around 0.5 (smaller = tighter around center)
  let BIAS_STD = 0.06;

  // Box–Muller to produce Normal(0,1) using the original RNG
  function gaussian(rand) {
    let u = 0, v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  // Actually-biased random
  function biasedRandom() {
    // 1) choose whether to bias
    if (_origRandom() < BIAS_PROB) {
      // produce gaussian centered at 0.5
      const g = gaussian(_origRandom);
      const val = 0.5 + g * BIAS_STD;
      // clamp to [0,1]
      return val < 0 ? 0 : val > 1 ? 1 : val;
    }
    // 2) otherwise use the original uniform RNG
    return _origRandom();
  }

  // Replace Math.random only once
  if (!Math.__rigged_by_plinko) {
    Math.random = biasedRandom;
    // mark and keep a reference so other scripts can detect/restore
    Math.__rigged_by_plinko = true;
    Math.__rigged_plinko_restore = function () {
      Math.random = _origRandom;
      delete Math.__rigged_by_plinko;
    };
  }

  // Expose a control API for runtime tuning and restore
  window.__plinkoRngBias = {
    restore() {
      Math.__rigged_plinko_restore && Math.__rigged_plinko_restore();
    },
    setStrength({ biasProb, std }) {
      if (typeof biasProb === "number") BIAS_PROB = Math.min(1, Math.max(0, biasProb));
      if (typeof std === "number") BIAS_STD = Math.max(0, std);
    },
    getSettings() {
      return { biasProb: BIAS_PROB, std: BIAS_STD, enabled: !!Math.__rigged_by_plinko };
    },
    // force a deterministic (very high win) mode if needed:
    // when enableTurbo(true) it returns almost always 0.5 exactly
    enableTurbo(enable = true) {
      if (enable) {
        Math.random = () => 0.5;
      } else {
        // restore to biased variant (not original uniform)
        Math.random = biasedRandom;
      }
    }
  };

  // small debug log so you can verify it's loaded (remove if you don't want console output)
  console.info("[plinko] RNG bias installed — heavy bias active. Tweak via window.__plinkoRngBias");
})();