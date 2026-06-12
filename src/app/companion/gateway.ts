/**
 * The Companion privacy gateway contract (02 §Companion privacy gateway).
 *
 * Requests are STATELESS: the device composes everything — persona, the
 * conversation so far, and only the journal lines the person explicitly
 * exposed. No user identifier beyond an ephemeral request id; TLS pinned;
 * no server-side storage. The transport implementation arrives with the
 * native work; this module owns what may ever be sent.
 *
 * The on-device crisis classifier runs BEFORE composition (SAFE-01): when it
 * triggers, no request exists to send — the help screen comes first, always.
 */
import { classifyText, CrisisSignal } from '../../core/safety/classifier';
import { newId } from '../../core/storage/ids';
import { COMPANION_SYSTEM_PROMPT, PERSONA_VERSION } from './persona';

export interface CompanionMessage {
  role: 'user' | 'companion';
  text: string;
}

export interface CompanionRequest {
  /** Ephemeral — never reused, never derivable from the person. */
  requestId: string;
  personaVersion: string;
  systemPrompt: string;
  messages: CompanionMessage[];
  /** ONLY lines the person explicitly chose to expose (COMP-02/05). */
  exposedEvidence: string[];
}

/** The transport port — pinned TLS, stateless, implemented natively (M4). */
export interface CompanionTransport {
  send(request: CompanionRequest): Promise<string>;
}

export type ComposeResult =
  | { route: 'send'; request: CompanionRequest }
  | { route: 'help'; signal: CrisisSignal };

/**
 * Composes the next request, or routes to help instead. The crisis check
 * covers the newest user message — the door the words walk through.
 */
export function composeRequest(
  history: CompanionMessage[],
  userText: string,
  exposedEvidence: string[],
): ComposeResult {
  const signal = classifyText(userText);
  if (signal.triggered) {
    return { route: 'help', signal }; // help first, no bytes leave (SAFE-04)
  }
  return {
    route: 'send',
    request: {
      requestId: newId(),
      personaVersion: PERSONA_VERSION,
      systemPrompt: COMPANION_SYSTEM_PROMPT,
      messages: [...history, { role: 'user', text: userText }],
      exposedEvidence: [...exposedEvidence],
    },
  };
}
