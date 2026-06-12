/**
 * Dare ladder templates (PLAN-02): seven escalating real-world challenges per
 * channel, from a small honest step to a season-defining one. Editorial
 * content — ships in the fallback bundle, replaceable OTA. Custom dares come
 * later via the Companion; these are the starting rungs.
 */
import { ChannelKey } from '../scoring/config';

export const DARE_TEMPLATES: Record<ChannelKey, [string, string, string, string, string, string, string]> = {
  feeds: [
    'Eat one meal today with the phone in another room.',
    'Move the feed apps off your home screen, into one buried folder.',
    'Spend the first thirty minutes after waking without a screen.',
    'One full evening offline — tell someone in advance so it holds.',
    'Log out of every feed; let every visit cost a password.',
    'Delete one feed app for a full week, the one that takes most.',
    'A whole weekend day without feeds — plan it with someone you love.',
  ],
  series: [
    'Stop tonight at the end of one episode — stand up when the credits roll.',
    'Turn off autoplay everywhere it can be turned off.',
    'One evening this week with the TV dark, doing anything with your hands.',
    'Finish a season only on the weekend — weekday nights stay yours.',
    'Replace one episode with one chapter, in bed, on paper.',
    'A full week with no series — notice what the evenings become.',
    'Cancel one streaming service for a month and put the money somewhere visible.',
  ],
  games: [
    'Set a timer before you play; stop when it rings, mid-match if it must be.',
    'Uninstall one game that gives you nothing but the next pull.',
    'No purchases in any game for two weeks — wanting is allowed, buying is not.',
    'One whole evening of the game replaced by something you used to love.',
    'Tell a friend your weekly hours, out loud, in person.',
    'A week without the main game — keep the account, lose the habit.',
    'A month free of the one that holds you hardest. The ladder waits if you slip.',
  ],
  betting: [
    'Today, write down every urge to bet and what was happening just before.',
    'Remove every betting app; let the urge outlive the uninstall.',
    'Tell one person you trust how much last month actually cost.',
    'Block your cards at the betting sites your bank allows.',
    'A week with zero bets — move the stake money to someone who needs it.',
    'Visit gamblingtherapy or your local equivalent once, just to read.',
    'A full month clean, with a weekly check-in with the person from rung three.',
  ],
  porn: [
    'Tonight, keep the phone out of the bedroom entirely.',
    'Install a blocker — not as a cage, as a speed bump.',
    'Notice the cue once: write down when the pull comes, nothing more.',
    'A week with screens off after ten at night.',
    'Say it to one human being you trust — once, plainly.',
    'Two weeks clean; each urge becomes the craving button instead.',
    'A season goal written in your own words, kept where you pray or plan.',
  ],
  substances: [
    'One day fully clear, today, and a note on how the evening felt.',
    'Remove what lives in the house beyond today’s honest need.',
    'Tell one person what you are loosening — let them ask you about it.',
    'A clear weekend, planned ahead, with something good in the empty space.',
    'One week clear; the craving button instead of the first reach.',
    'Speak to a professional once — information, not commitment.',
    'A month, with help; mercy if you slip, and the ladder simply waits.',
  ],
  nightlife: [
    'Leave one night out an hour earlier than everyone — sleep is yours.',
    'One weekend night fully in: cook, host, or rest, by choice.',
    'Set a spending line for the night before you leave; keep it.',
    'Plan one daylight meeting with the friends you only ever see at night.',
    'Two weekends with one night out instead of two.',
    'Say one honest no to a night you don’t actually want.',
    'A month of nights that end before midnight; count what mornings become.',
  ],
  shopping: [
    'Tonight, empty every cart without buying — sleep on all of it.',
    'Unsubscribe from every store email in your inbox today.',
    'A week with nothing bought beyond food and needs.',
    'Return or give away one thing bought on impulse — feel the undoing.',
    'Delete saved cards from the shops; let buying take effort.',
    'A month of one wish list: write wants down, buy only what survives it.',
    'Put one month’s impulse total toward something with a face — a person, a cause.',
  ],
  outsourced_thinking: [
    'Answer one real question today from your own head; check after, not before.',
    'Write one paragraph — a message, a thought — with no assistant at all.',
    'A day of decisions made without asking the machine first.',
    'Do one piece of work end to end with your own reasoning; then compare.',
    'Memorize one thing worth keeping: a poem, a verse, a number.',
    'A week where the machine drafts nothing personal — only you speak as you.',
    'Teach someone something you know, from memory, face to face.',
  ],
  abandoned_skills: [
    'Touch the old skill for five minutes today — open the case, the file, the box.',
    'Clear one space for it: a desk corner, a shelf, an hour.',
    'Thirty unbroken minutes of practice, phone in another room.',
    'Show the rusty work to one kind person.',
    'A week with three short sessions — small, scheduled, kept.',
    'Finish one small piece, start to end, however rough.',
    'Give one finished thing away, or perform it once, for someone real.',
  ],
  spectator: [
    'Watch one game less this week; play anything yourself instead.',
    'Mute the commentary channels for a day — keep the silence.',
    'Replace one highlights hour with one walk, run, or kickabout.',
    'Go to one local, live, small thing instead of the big screen.',
    'A week without scores at work — the table will wait.',
    'Join one thing you can do badly in public — a class, a league, a choir.',
    'A month where you sweat more hours than you spectate.',
  ],
  relationships: [
    'Send one honest message today to someone who deserves better than your silence.',
    'One phone call this week to a person you keep meaning to call.',
    'A meal with someone, both phones face down and away.',
    'Ask one real question of someone close, and only listen.',
    'Visit someone — no occasion, no reason, just the door.',
    'Repair one small thing: the apology, the thank-you, the overdue word.',
    'Plan one standing time with someone you love, weekly, and keep it a month.',
  ],
};

export function dareLadderFor(channel: ChannelKey): string[] {
  return [...DARE_TEMPLATES[channel]];
}

export const DARE_TEMPLATES_SK: Record<ChannelKey, [string, string, string, string, string, string, string]> = {
  feeds: [
    'Zjedz dnes jedno jedlo s telefónom v inej izbe.',
    'Presuň feedové appky z domovskej obrazovky do jedného zastrčeného priečinka.',
    'Prvých tridsať minút po prebudení prežis bez obrazovky.',
    'Jeden celý večer offline — povedz to vopred niekomu, nech to drží.',
    'Odhlás sa zo všetkých feedov; nech každá návšteva stojí heslo.',
    'Vymaž na celý týždeň jednu feedovú appku, tú, ktorá berie najviac.',
    'Celý víkendový deň bez feedov — naplánuj ho s niekým, koho máš rád.',
  ],
  series: [
    'Dnes večer skonči na konci jednej epizódy — vstaň, keď bežia titulky.',
    'Vypni automatické prehrávanie všade, kde sa dá.',
    'Jeden večer v týždni s tmavou telkou, čokoľvek rukami.',
    'Dopozeraj sezónu iba cez víkend — večery v týždni ostávajú tvoje.',
    'Nahraď jednu epizódu jednou kapitolou, v posteli, na papieri.',
    'Celý týždeň bez seriálov — všimni si, čím sa stanú večery.',
    'Zruš na mesiac jednu streamovaciu službu a polož tie peniaze na viditeľné miesto.',
  ],
  games: [
    'Nastav si časovač pred hraním; skonči, keď zazvoní, hoci aj uprostred zápasu.',
    'Odinštaluj jednu hru, ktorá ti nedáva nič okrem ďalšieho ťahu.',
    'Dva týždne žiadne nákupy v žiadnej hre — chcieť sa smie, kupovať nie.',
    'Jeden celý večer hry nahradený niečím, čo si kedysi miloval.',
    'Povedz kamarátovi svoje týždenné hodiny, nahlas, osobne.',
    'Týždeň bez hlavnej hry — účet si nechaj, zvyk pusti.',
    'Mesiac bez tej, ktorá ťa drží najpevnejšie. Ak pošmykneš, rebrík počká.',
  ],
  betting: [
    'Dnes si zapíš každé nutkanie staviť a čo sa dialo tesne predtým.',
    'Odstráň všetky stávkové appky; nech nutkanie prežije odinštalovanie.',
    'Povedz jednému človeku, ktorému veríš, koľko minulý mesiac naozaj stál.',
    'Zablokuj si karty na stávkových stránkach, ak to tvoja banka dovolí.',
    'Týždeň bez jedinej stávky — vklady pošli niekomu, kto ich potrebuje.',
    'Navštív raz gamblingovú poradňu alebo jej stránku, len čítať.',
    'Celý čistý mesiac, s týždennou kontrolou u človeka z tretej priečky.',
  ],
  porn: [
    'Dnes v noci nechaj telefón úplne mimo spálne.',
    'Nainštaluj si blokovač — nie ako klietku, ako spomaľovač.',
    'Všimni si raz ten podnet: zapíš, kedy ťah prichádza, nič viac.',
    'Týždeň s obrazovkami vypnutými po desiatej večer.',
    'Povedz to raz, jednoducho, jednému človeku, ktorému veríš.',
    'Dva čisté týždne; každé nutkanie nech ide cez tlačidlo nutkania.',
    'Sezónny cieľ napísaný vlastnými slovami, uložený tam, kde plánuješ alebo stíchaš.',
  ],
  substances: [
    'Jeden úplne čistý deň, dnes, a poznámka, aký bol večer.',
    'Odstráň z domu, čo presahuje dnešnú úprimnú potrebu.',
    'Povedz jednému človeku, čo rozpletáš — nech sa ťa na to pýta.',
    'Čistý víkend, naplánovaný vopred, s niečím dobrým v prázdnom mieste.',
    'Jeden čistý týždeň; namiesto prvého siahnutia tlačidlo nutkania.',
    'Porozprávaj sa raz s odborníkom — informácia, nie záväzok.',
    'Mesiac, s pomocou; milosť, ak pošmykneš — rebrík jednoducho počká.',
  ],
  nightlife: [
    'Odíď z jedného večera o hodinu skôr než všetci — spánok je tvoj.',
    'Jeden víkendový večer celkom doma: navar, hosti, alebo oddychuj, podľa seba.',
    'Urči si hranicu míňania pred odchodom; dodrž ju.',
    'Naplánuj jedno denné stretnutie s priateľmi, ktorých vídaš len v noci.',
    'Dva víkendy s jedným večerom vonku namiesto dvoch.',
    'Povedz jedno úprimné nie večeru, ktorý v skutočnosti nechceš.',
    'Mesiac večerov končiacich pred polnocou; spočítaj, čím sa stanú rána.',
  ],
  shopping: [
    'Dnes večer vyprázdni všetky košíky bez nákupu — vyspi sa na to.',
    'Odhlás sa dnes zo všetkých obchodných e-mailov.',
    'Týždeň bez nákupov okrem jedla a potrieb.',
    'Vráť alebo daruj jednu impulzívne kúpenú vec — precíť to odčinenie.',
    'Vymaž uložené karty z obchodov; nech nákup stojí námahu.',
    'Mesiac jedného zoznamu prianí: chcenia píš, kupuj len to, čo prežije.',
    'Daj mesačný súčet impulzov niečomu s tvárou — človeku, veci, ktorá má zmysel.',
  ],
  outsourced_thinking: [
    'Odpovedz dnes na jednu skutočnú otázku z vlastnej hlavy; over až potom.',
    'Napíš jeden odsek — správu, myšlienku — úplne bez asistenta.',
    'Deň rozhodnutí bez toho, aby si sa najprv pýtal stroja.',
    'Urob jednu prácu od začiatku do konca vlastným uvažovaním; potom porovnaj.',
    'Nauč sa naspamäť niečo, čo stojí za nosenie: báseň, verš, číslo.',
    'Týždeň, v ktorom stroj nepíše nič osobné — ako ty hovoríš len ty.',
    'Nauč niekoho niečo, čo vieš, spamäti, tvárou v tvár.',
  ],
  abandoned_skills: [
    'Dotkni sa dnes starej zručnosti na päť minút — otvor puzdro, súbor, krabicu.',
    'Uvoľni jej jedno miesto: roh stola, policu, hodinu.',
    'Tridsať neprerušených minút cviku, telefón v inej izbe.',
    'Ukáž zahrdzavenú prácu jednému láskavému človeku.',
    'Týždeň s tromi krátkymi cvičeniami — malé, naplánované, dodržané.',
    'Dokonči jeden malý kus, od začiatku do konca, hocijako nahrubo.',
    'Jednu hotovú vec daruj, alebo ju raz predveď, niekomu skutočnému.',
  ],
  spectator: [
    'Pozri tento týždeň o jeden zápas menej; čokoľvek si zahraj sám.',
    'Stíš na deň komentátorské kanály — nechaj si to ticho.',
    'Nahraď hodinu zostrihov jednou prechádzkou, behom alebo loptou.',
    'Choď na jednu miestnu, živú, malú vec namiesto veľkej obrazovky.',
    'Týždeň bez výsledkov v práci — tabuľka počká.',
    'Pridaj sa k niečomu, čo smieš robiť zle a verejne — kurz, liga, zbor.',
    'Mesiac, v ktorom viac hodín potíš než prizeráš.',
  ],
  relationships: [
    'Pošli dnes jednu úprimnú správu niekomu, kto si zaslúži viac než tvoje ticho.',
    'Jeden telefonát tento týždeň človeku, ktorému stále chceš zavolať.',
    'Jedno jedlo s niekým, oba telefóny obrazovkou dole a ďaleko.',
    'Polož jednu skutočnú otázku niekomu blízkemu a len počúvaj.',
    'Navštív niekoho — bez príležitosti, bez dôvodu, len dvere.',
    'Oprav jednu malú vec: ospravedlnenie, poďakovanie, dlhované slovo.',
    'Naplánuj jeden stály čas s niekým, koho máš rád, týždenne, a drž ho mesiac.',
  ],
};

/**
 * Display text for a dare. Ladders are SEEDED with the canonical English
 * text (locale changes never rewrite history); template dares render
 * per-locale at display time, custom dares (M4) always show as written.
 */
export function localizedDareText(
  channel: ChannelKey,
  rung: number,
  storedText: string,
  source: 'template' | 'custom' | 'circle',
  locale: string,
): string {
  if (source === 'template' && locale.toLowerCase().startsWith('sk')) {
    return DARE_TEMPLATES_SK[channel][rung - 1] ?? storedText;
  }
  return storedText;
}
