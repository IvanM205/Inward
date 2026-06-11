/**
 * QuietVeil — the full-night overlay with one line (06 §Components):
 * Unplug Mode and the Stillness Switch render this and nothing else. The app
 * is dark except the line; leaving happens through the OS (home), or Android
 * back, which simply closes the app — the window itself ends silently.
 */
import React from 'react';
import { TerminalScreen } from './TerminalScreen';

export interface QuietVeilProps {
  line: string;
  /** Android back — the host closes the app; the quiet keeps running. */
  onLeave: () => void;
}

export function QuietVeil({ line, onLeave }: QuietVeilProps): React.JSX.Element {
  // Visually and behaviorally a terminal state: night, one serif line, exit
  // only — so it IS one, kept as its own named component per 06.
  return <TerminalScreen line={line} onExit={onLeave} />;
}
