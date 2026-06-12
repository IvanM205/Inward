module.exports = {
  preset: '@react-native/jest-preset',
  // Sandboxed CI runners are slow on first render/SQL open; the default 5 s
  // per-test budget flakes there. Generous wall-clock, same assertions.
  testTimeout: 30000,
  // Full-throttle parallelism oversubscribes the sandbox and flakes suites
  // that pass in isolation; half the workers is faster in practice.
  maxWorkers: '50%',
};
