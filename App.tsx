/**
 * Inward — M0 shell.
 * Renders the first words of the product over the design tokens. The real
 * onboarding flow (ONB-01 breath screen first, before anything tappable)
 * lands in M1; this shell exists so the project builds and the design system
 * is visible on device.
 */
import React from 'react';
import { StatusBar } from 'react-native';
import { TerminalScreen } from './src/core/design/TerminalScreen';

function App(): React.JSX.Element {
  return (
    <>
      <StatusBar hidden />
      <TerminalScreen line="You were not made to be harvested." onExit={() => {}} />
    </>
  );
}

export default App;
