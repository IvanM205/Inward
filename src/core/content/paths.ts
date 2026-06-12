/**
 * Paths (LIB-02, 02 §Content): 7–14 day journeys — each day one reading, one
 * question, one real-world act. The fallback bundle ships one seven-day path
 * built over the reading bank; editorial bundles add more OTA. One active
 * Path at most, no recommendations, completion ends in the world.
 */

export interface PathDay {
  readingId: string;
  question: string;
  act: string;
}

export interface Path {
  id: string;
  title: string;
  days: PathDay[];
}

export const PATHS: Path[] = [
  {
    id: 'path.returning',
    title: 'The Returning — seven days back toward your own life',
    days: [
      {
        readingId: 'reading.shortness',
        question: 'Where did yesterday actually go?',
        act: 'Tonight, write the day’s hours down once, plainly, for no one but you.',
      },
      {
        readingId: 'reading.morning',
        question: 'What deserves your first hour?',
        act: 'Tomorrow, keep the first thirty minutes after waking for it — screen elsewhere.',
      },
      {
        readingId: 'reading.deliberately',
        question: 'Which hour of today will you choose on purpose?',
        act: 'Put both hands on one hour today: one task, one place, nothing else.',
      },
      {
        readingId: 'reading.ours',
        question: 'Whose applause have you been working for?',
        act: 'Do one good thing today and tell no one at all.',
      },
      {
        readingId: 'reading.neighbor',
        question: 'Who is nearest to you, and what small thing do they need?',
        act: 'Do that small thing before the day ends — a call, a hand, a repair.',
      },
      {
        readingId: 'reading.hands',
        question: 'What did your hands once know?',
        act: 'Touch that skill for ten minutes today, badly and gladly.',
      },
      {
        readingId: 'reading.patience',
        question: 'Which question in your life deserves a season, not a search?',
        act: 'Write that question on paper and put it where you will see it for a month.',
      },
    ],
  },
  {
    id: 'path.empty-minute',
    title: 'The Empty Minute — seven days of unhurried time',
    days: [
      {
        readingId: 'reading.gift-of-boredom',
        question: 'Which waits in your day do you reflexively board up?',
        act: 'Stand in three waits today — kettle, queue, light — with empty hands.',
      },
      {
        readingId: 'reading.leisure',
        question: 'What would real rest look like tonight, if no one could see it?',
        act: 'One evening hour of true leisure: present somewhere, producing nothing.',
      },
      {
        readingId: 'reading.walking',
        question: 'What has been circling your mind that never lands?',
        act: 'Give it a thirty-minute walk, phone at home or silenced in a pocket.',
      },
      {
        readingId: 'reading.attention-love',
        question: 'Who gets your leftover attention that deserves the first of it?',
        act: 'Ten undivided minutes with that person today — nothing else in hand.',
      },
      {
        readingId: 'reading.morning',
        question: 'What did the first hour of today actually serve?',
        act: 'Tomorrow, point the first thirty minutes before any screen points you.',
      },
      {
        readingId: 'reading.enough',
        question: 'If this afternoon were singular — which it is — what would it hold?',
        act: 'Defend one afternoon hour for the thing you keep postponing.',
      },
      {
        readingId: 'reading.shortness',
        question: 'After a week of empty minutes — where does your time actually want to go?',
        act: 'Write one sentence of intent for next week and leave it on paper, not in the phone.',
      },
    ],
  },
];

export function pathById(id: string): Path | undefined {
  return PATHS.find((p) => p.id === id);
}

/* ----- Localized path text (NFR-X2) — ids and structure stay canonical. */

interface PathSk {
  title: string;
  days: { question: string; act: string }[];
}

const PATHS_SK: Record<string, PathSk> = {
  'path.returning': {
    title: 'Návrat — sedem dní späť k vlastnému životu',
    days: [
      {
        question: 'Kam vlastne odišiel včerajšok?',
        act: 'Dnes večer si raz, jednoducho, zapíš hodiny dňa — pre nikoho iného než seba.',
      },
      {
        question: 'Čo si zaslúži tvoju prvú hodinu?',
        act: 'Zajtra si prvých tridsať minút po prebudení nechaj preň — obrazovka inde.',
      },
      {
        question: 'Ktorú hodinu dneška si vyberieš naschvál?',
        act: 'Polož dnes obe ruky na jednu hodinu: jedna úloha, jedno miesto, nič iné.',
      },
      {
        question: 'Pre čí potlesk si pracoval?',
        act: 'Urob dnes jednu dobrú vec a nikomu o nej nepovedz.',
      },
      {
        question: 'Kto je ti najbližšie a akú malú vec potrebuje?',
        act: 'Urob tú malú vec do konca dňa — telefonát, ruka, oprava.',
      },
      {
        question: 'Čo kedysi vedeli tvoje ruky?',
        act: 'Dotkni sa dnes tej zručnosti na desať minút, zle a rád.',
      },
      {
        question: 'Ktorá otázka v tvojom živote si zaslúži sezónu, nie vyhľadávanie?',
        act: 'Napíš tú otázku na papier a polož ju tam, kde ju budeš mesiac vídať.',
      },
    ],
  },
  'path.empty-minute': {
    title: 'Prázdna minúta — sedem dní neuponáhľaného času',
    days: [
      {
        question: 'Ktoré čakania vo svojom dni reflexívne zatĺkaš?',
        act: 'Postoj dnes v troch čakaniach — kanvica, rad, semafor — s prázdnymi rukami.',
      },
      {
        question: 'Ako by vyzeral skutočný odpočinok dnes večer, keby ho nikto nevidel?',
        act: 'Jedna večerná hodina ozajstného voľna: byť niekde naplno a nič nevyrábať.',
      },
      {
        question: 'Čo ti krúži hlavou a nikdy nepristane?',
        act: 'Daj tomu tridsaťminútovú prechádzku, telefón doma alebo stlmený vo vrecku.',
      },
      {
        question: 'Kto dostáva zvyšky tvojej pozornosti, hoci si zaslúži jej začiatok?',
        act: 'Desať nerozdelených minút s tým človekom dnes — nič iné v rukách.',
      },
      {
        question: 'Čomu naozaj slúžila prvá hodina dneška?',
        act: 'Zajtra nasmeruj prvých tridsať minút skôr, než ťa nasmeruje obrazovka.',
      },
      {
        question: 'Keby bolo toto popoludnie jediné — a ono je — čo by v ňom bolo?',
        act: 'Ubráň jednu popoludňajšiu hodinu pre vec, ktorú stále odkladáš.',
      },
      {
        question: 'Po týždni prázdnych minút — kam vlastne chce ísť tvoj čas?',
        act: 'Napíš jednu vetu zámeru na budúci týždeň a nechaj ju na papieri, nie v telefóne.',
      },
    ],
  },
};

const isSk = (locale: string) => locale.toLowerCase().startsWith('sk');

export function pathTitle(path: Path, locale: string): string {
  return isSk(locale) ? PATHS_SK[path.id]?.title ?? path.title : path.title;
}

export function pathDayText(
  path: Path,
  dayIndex1Based: number,
  locale: string,
): { question: string; act: string } {
  const day = path.days[dayIndex1Based - 1];
  if (isSk(locale)) {
    const sk = PATHS_SK[path.id]?.days[dayIndex1Based - 1];
    if (sk) return sk;
  }
  return { question: day.question, act: day.act };
}
