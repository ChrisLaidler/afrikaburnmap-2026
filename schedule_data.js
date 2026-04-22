const SCHEDULE_DATA = (() => {
  const days = [
    { key: "mon", date: "2026-04-27", label: "Mon 27", longLabel: "Monday 27 April" },
    { key: "tue", date: "2026-04-28", label: "Tue 28", longLabel: "Tuesday 28 April" },
    { key: "wed", date: "2026-04-29", label: "Wed 29", longLabel: "Wednesday 29 April" },
    { key: "thu", date: "2026-04-30", label: "Thu 30", longLabel: "Thursday 30 April" },
    { key: "fri", date: "2026-05-01", label: "Fri 1", longLabel: "Friday 1 May" },
    { key: "sat", date: "2026-05-02", label: "Sat 2", longLabel: "Saturday 2 May" },
    { key: "sun", date: "2026-05-03", label: "Sun 3", longLabel: "Sunday 3 May" },
  ];

  const dayIndex = Object.fromEntries(days.map((day, index) => [day.key, index]));
  const series = [];
  const entries = [];
  const CATEGORY_LABELS = {
    burn: "Burn",
    music: "Music",
    performance: "Performance",
    workshop: "Workshop",
    wellness: "Wellness",
    foodDrink: "Food & Drink",
    service: "Service",
    movement: "Movement",
    community: "Community",
  };

  function toMinutes(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
  }

  function expandDays(spec) {
    if (Array.isArray(spec)) return spec;
    switch (spec) {
      case "daily": return ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
      case "mon-sat": return ["mon", "tue", "wed", "thu", "fri", "sat"];
      case "tue-sat": return ["tue", "wed", "thu", "fri", "sat"];
      case "wed-sat": return ["wed", "thu", "fri", "sat"];
      case "wed-fri": return ["wed", "thu", "fri"];
      case "thu-sat": return ["thu", "fri", "sat"];
      case "mon-thu": return ["mon", "tue", "wed", "thu"];
      case "mon-wed": return ["mon", "tue", "wed"];
      default: return spec ? [spec] : [];
    }
  }

  function normalizeCategories(values) {
    const out = [];
    const seen = new Set();
    for (const value of values || []) {
      const label = CATEGORY_LABELS[value];
      if (!label || seen.has(label)) continue;
      seen.add(label);
      out.push(label);
    }
    return out;
  }

  function inferCategories(def) {
    const text = `${def.title || ""} ${def.description || ""} ${def.timeLabel || ""}`.toLowerCase();
    const inferred = [...(def.categories || [])];
    if (/\b(dj|music|jam|open mic|broadcast|radio|beats|sound|grooves|tunes|live band|live music|party)\b/.test(text)) inferred.push("music");
    if (/\b(performance|performances|burlesque|screening|cinema|show|ritual|fashion|art walk|parade|open mic|stage)\b/.test(text)) inferred.push("performance");
    if (/\b(workshop|workshops|lesson|lessons|training|talks|experiments|open lab|readings|tarot|story time|class|classes|sign-up|sign up)\b/.test(text)) inferred.push("workshop");
    if (/\b(yoga|meditation|therapy|mindful|healing|massage|showers|sanctuary|harm reduction|testing|spa)\b/.test(text)) inferred.push("wellness");
    if (/\b(brunch|pancake|pancrepe|tea|coffee|mimosa|juice|ice cream|creme brulee|crème brûlée|bar|cocktail|wine|dawa|breakfast|food|drink|drinks|bubbles)\b/.test(text)) inferred.push("foodDrink");
    if (/\b(run|walking tour|tour|walk|parade|march|swoop)\b/.test(text)) inferred.push("movement");
    if (
      def.kind === "open"
      || /\b(volunteer|ranger|testing|ice sales|showers|check-in|check in|artifactory|arteria|booth|lost & found|office hours|hub|service|broadcast station)\b/.test(text)
    ) {
      inferred.push("service");
    }
    if (/\b(gathering|community|welcome party|family|lounge|sundowners|citizen|social)\b/.test(text)) inferred.push("community");
    return normalizeCategories(inferred);
  }

  function addSeries(def) {
    const linkedCodes = [...new Set((def.linkedCodes || []).filter(Boolean))];
    const normalized = {
      id: def.id,
      title: def.title,
      kind: def.kind || "event",
      kindLabel: def.kind === "open" ? "Open" : "Event",
      linkedCodes,
      timeLabel: def.timeLabel,
      summaryLabel: def.summaryLabel || `${def.timeLabel} · ${def.title}`,
      description: def.description || "",
      sourceLabel: def.sourceLabel || "WTF Guide 2026",
      sortStart: toMinutes(def.sortStart),
      sortEnd: toMinutes(def.sortEnd),
      estimatedEnd: toMinutes(def.estimatedEnd),
      estimatedEndNextDay: Boolean(def.estimatedEndNextDay),
      categories: inferCategories(def),
    };
    series.push(normalized);
    for (const dayKey of expandDays(def.days)) {
      const day = days[dayIndex[dayKey]];
      if (!day) continue;
      entries.push({
        id: `${def.id}-${dayKey}`,
        seriesId: def.id,
        date: day.date,
        dayKey,
        dayLabel: day.label,
        title: def.title,
        kind: normalized.kind,
        kindLabel: normalized.kindLabel,
        linkedCodes,
        timeLabel: def.timeLabel,
        description: normalized.description,
        sourceLabel: normalized.sourceLabel,
        sortStart: normalized.sortStart,
        sortEnd: normalized.sortEnd,
        estimatedEnd: normalized.estimatedEnd,
        estimatedEndNextDay: normalized.estimatedEndNextDay,
        categories: normalized.categories,
      });
    }
  }

  addSeries({
    id: "bad-cereal-killers",
    title: "Cereal Killers Munchie Mobile",
    kind: "open",
    days: "tue-sat",
    timeLabel: "9 am to 11 am",
    sortStart: "09:00",
    sortEnd: "11:00",
    linkedCodes: ["BAD"],
    summaryLabel: "Tue-Sat 9 am-11 am · Cereal Killers Munchie Mobile",
    description: "Crunchy comfort for dusty dancers and sunrise survivors at BabaDoof.",
  });
  addSeries({
    id: "bad-antarean-pyramid-party",
    title: "Antarean Pyramid Party",
    kind: "event",
    days: "wed",
    timeLabel: "Sunset",
    sortStart: "18:30",
    linkedCodes: ["BAD"],
    summaryLabel: "Wed sunset · Antarean Pyramid Party",
    description: "BabaDoof's Wednesday sunset party with bowls, banter, fire performances, and chaos.",
  });
  addSeries({
    id: "bad-bass-banging-bash",
    title: "Bass-Banging Bash",
    kind: "event",
    days: "daily",
    timeLabel: "After dark",
    sortStart: "21:00",
    linkedCodes: ["BAD"],
    summaryLabel: "Nightly after dark · Bass-Banging Bash",
    description: "Nightly bowls, banter, fire performances, and full-blown chaos at BabaDoof.",
  });
  addSeries({
    id: "404-vegan-brunch",
    title: "Vegan Brunch",
    kind: "event",
    days: "daily",
    timeLabel: "11 am-ish",
    sortStart: "11:00",
    linkedCodes: ["404"],
    summaryLabel: "Daily 11 am-ish · Vegan brunch",
    description: "Camp 404's best vegan brunch in Tankwa Town.",
  });
  addSeries({
    id: "404-love-is-a-spectrum",
    title: "Love is a Spectrum",
    kind: "event",
    days: "thu",
    timeLabel: "Thursday around 12 pm",
    sortStart: "12:00",
    linkedCodes: ["404"],
    categories: ["community", "performance"],
    sourceLabel: "User-supplied event",
    summaryLabel: "Thu around 12 pm · Love is a Spectrum",
    description: "After brunch at Camp 404, join the Love is a Spectrum matchmaking shenanigans in the cosy lounge. Participants answer a few questions, meet possible matches through a series of curated activities, and can then elope onward into further purple-wedding chaos if the moment feels right. You may also find the crew roaming the playa in wedding finery.",
  });
  addSeries({
    id: "but-beasts-bazaar",
    title: "Beasts Bazaar",
    kind: "event",
    days: ["wed", "fri"],
    timeLabel: "1 pm to 3 pm",
    sortStart: "13:00",
    sortEnd: "15:00",
    linkedCodes: ["BUT"],
    categories: ["foodDrink", "community"],
    summaryLabel: "Wed/Fri 1 pm-3 pm · Beasts Bazaar",
    description: "Market-day window at Buttery Beasts with hot food, cold drinks, buttery beats, and beastly assistance.",
  });
  addSeries({
    id: "del-pancrepes",
    title: "Pancrepes",
    kind: "open",
    days: "daily",
    timeLabel: "9 am to 12-ish",
    sortStart: "09:00",
    sortEnd: "12:00",
    linkedCodes: ["DEL"],
    summaryLabel: "Daily 9 am-12-ish · Pancrepes",
    description: "Daily flip of pancrepes at Camp DelicioZA, until the batter runs out.",
  });
  addSeries({
    id: "sam-tarot-readings",
    title: "Tarot Readings",
    kind: "event",
    days: "wed-sat",
    timeLabel: "2 pm to 4 pm",
    sortStart: "14:00",
    sortEnd: "16:00",
    linkedCodes: ["SAM"],
    summaryLabel: "Wed-Sat 2 pm-4 pm · Tarot readings",
    description: "Mystical tarot readings for clarity, reflection, and a thoughtful pause in the desert.",
  });
  addSeries({
    id: "cgc-check-in",
    title: "Departure Check-in",
    kind: "open",
    days: "daily",
    timeLabel: "11 am to 2 pm",
    sortStart: "11:00",
    sortEnd: "14:00",
    linkedCodes: ["CGC"],
    summaryLabel: "Daily 11 am-2 pm · Departure check-in",
    description: "Check in, collect a boarding pass, and check the day's departure schedule at Concept Ground Control.",
  });
  addSeries({
    id: "dis-main-party",
    title: "DisFUNKtion Takeover",
    kind: "event",
    days: "thu",
    timeLabel: "5 pm",
    sortStart: "17:00",
    linkedCodes: ["DIS", "MHV"],
    categories: ["music", "performance", "community"],
    summaryLabel: "Thu 5 pm · DisFUNKtion Takeover at Mad Hatter's Village",
    description: "DisFUNKtion takes over Mad Hatter's Village – get weird... get wild... get a little off-beat.",
  });
  addSeries({
    id: "eno-psy-jol",
    title: "PSY-Jol-Wednesday",
    kind: "event",
    days: "wed",
    timeLabel: "After dark",
    sortStart: "21:00",
    linkedCodes: ["ENO"],
    categories: ["music", "community"],
    summaryLabel: "Wed after dark · PSY-Jol-Wednesday",
    description: "A stomp with glowing sand, sweet treats, and groovy-eclectic jols at Enos Nookie.",
  });
  addSeries({
    id: "fam-family-therapy",
    title: "Family Therapy",
    kind: "event",
    days: "daily",
    timeLabel: "11 am",
    sortStart: "11:00",
    linkedCodes: ["FAM"],
    summaryLabel: "Daily 11 am · Family therapy",
    description: "Daily family therapy in the lounge at Family Business.",
  });
  addSeries({
    id: "chillaz-morning-programme",
    title: "Morning Programme",
    kind: "event",
    days: "daily",
    timeLabel: "9:30 am to 1 pm",
    sortStart: "09:30",
    sortEnd: "13:00",
    linkedCodes: ["CHL"],
    categories: ["wellness", "workshop", "community"],
    summaryLabel: "Daily 9:30 am-1 pm · Chillaz morning programme",
    description: "Yoga, meditation, isiXhosa lessons, workshops, poetry, and conversation on the Chillaz stage.",
  });
  addSeries({
    id: "chillaz-afternoon-stage",
    title: "Afternoon Stage",
    kind: "event",
    days: "daily",
    timeLabel: "3:30 pm to 7 pm",
    sortStart: "15:30",
    sortEnd: "19:00",
    linkedCodes: ["CHL"],
    categories: ["music", "performance", "community"],
    summaryLabel: "Daily 3:30 pm-7 pm · Chillaz afternoon stage",
    description: "Live music, jam sessions, open mic, and other afternoon offerings on the Chillaz stage.",
  });
  addSeries({
    id: "chillaz-night-stage",
    title: "Night DJs and Performances",
    kind: "event",
    days: "daily",
    timeLabel: "8 pm to midnight",
    sortStart: "20:00",
    sortEnd: "24:00",
    linkedCodes: ["CHL"],
    categories: ["music", "performance"],
    summaryLabel: "Daily 8 pm-midnight · Chillaz night stage",
    description: "DJs and performances carrying the Chillaz magic into the night.",
  });
  addSeries({
    id: "chillaz-sunday-sessions",
    title: "Sunday Sessions",
    kind: "event",
    days: "sun",
    timeLabel: "9:30 am to 1 pm",
    sortStart: "09:30",
    sortEnd: "13:00",
    linkedCodes: ["CHL"],
    categories: ["music", "performance", "community"],
    summaryLabel: "Sun 9:30 am-1 pm · Sunday Sessions",
    description: "A special Sunday daytime line-up at Chillaz. Check the chalkboard for the exact mix of offerings.",
  });
  addSeries({
    id: "chillaz-welcome-party",
    title: "Welcome Party",
    kind: "event",
    days: "mon",
    timeLabel: "Monday night",
    sortStart: "20:00",
    linkedCodes: ["CHL"],
    categories: ["music", "community"],
    summaryLabel: "Mon night · Chillaz welcome party",
    description: "Welcome party on Monday night at Chillaz.",
  });
  addSeries({
    id: "gow-dance-floor",
    title: "Mutant Dance Floor",
    kind: "open",
    days: "daily",
    timeLabel: "12 pm to 12 am",
    sortStart: "12:00",
    sortEnd: "24:00",
    linkedCodes: ["GOW"],
    summaryLabel: "Daily 12 pm-12 am · Mutant dance floor",
    description: "Garden of Weeden runs sound on the mutant dance floor every day.",
  });
  addSeries({
    id: "tgm-workshop-morning",
    title: "Workshop Help Window",
    kind: "open",
    days: "mon-sat",
    timeLabel: "10 am to 12 pm",
    sortStart: "10:00",
    sortEnd: "12:00",
    linkedCodes: ["TGM"],
    summaryLabel: "Mon-Sat 10 am-12 pm · Workshop help",
    description: "Working Greasemonkeys may appear to help sentient beings fix their mechanical mishaps.",
  });
  addSeries({
    id: "tgm-workshop-afternoon",
    title: "Workshop Help Window",
    kind: "open",
    days: "mon-sat",
    timeLabel: "1 pm to 3 pm",
    sortStart: "13:00",
    sortEnd: "15:00",
    linkedCodes: ["TGM"],
    summaryLabel: "Mon-Sat 1 pm-3 pm · Workshop help",
    description: "A second staffed Greasemonkeys workshop window for bikes, generators, and wobbly tyres.",
  });
  addSeries({
    id: "hug-story-time",
    title: "Story Time for Kids",
    kind: "event",
    days: "daily",
    timeLabel: "9:30 am",
    sortStart: "09:30",
    linkedCodes: ["HUG"],
    summaryLabel: "Daily 9:30 am · Story time for kids",
    description: "Story time in the little bookie nook at Huggas and the Little Bookie Nook.",
  });
  addSeries({
    id: "imb-sunset-session",
    title: "Sunset Session",
    kind: "event",
    days: "daily",
    timeLabel: "Sunset",
    sortStart: "18:30",
    linkedCodes: ["IMB"],
    summaryLabel: "Daily at sunset · Sunset session",
    description: "Deep grooves, cultural connection, and intentional gathering at Imbizo Lounge.",
  });
  addSeries({
    id: "xon-golden-hour-gathering",
    title: "Golden Hour Gathering",
    kind: "event",
    days: "daily",
    timeLabel: "60-90 min before sunset (check blackboard)",
    sortStart: "17:00",
    linkedCodes: ["XON"],
    categories: ["music", "movement", "community"],
    sourceLabel: "User-supplied event",
    summaryLabel: "Check blackboard · Golden Hour Gathering",
    description: "Ossewa Nova gathers when the moment feels right and moves together into the golden hour. Bring a drum, a bell, a violin, a rhythm, or just yourself. Walk, play, sway, or simply come as you are. This does not happen every day, so check the blackboard at camp for the timing.",
  });
  addSeries({
    id: "jel-creme-brulee",
    title: "Creme Brulee",
    kind: "event",
    days: "daily",
    timeLabel: "9 pm",
    sortStart: "21:00",
    linkedCodes: ["JEL"],
    summaryLabel: "Daily 9 pm · Creme brulee",
    description: "Creme brulee at Jelly People, followed by tea, toning, and other surprises through the week.",
  });
  addSeries({
    id: "kre-creme-brulee",
    title: "Creme Brulee",
    kind: "event",
    days: "daily",
    timeLabel: "9 pm",
    sortStart: "21:00",
    linkedCodes: ["KRE"],
    summaryLabel: "Daily 9 pm · Creme brulee",
    description: "Creme brulee at Kreme, with tea ceremonies, fitness sessions, and more surprises through the week.",
  });
  addSeries({
    id: "lct-mantis",
    title: "MANTIS",
    kind: "event",
    days: "wed-fri",
    timeLabel: "After sunset",
    sortStart: "19:00",
    linkedCodes: ["LCT"],
    summaryLabel: "Wed-Fri after sunset · MANTIS",
    description: "A contemporary dance ritual at La Casa Timeless.",
  });
  addSeries({
    id: "lpp-sunset-bar",
    title: "Sunset Bar",
    kind: "open",
    days: "daily",
    timeLabel: "Sunset",
    sortStart: "18:30",
    linkedCodes: ["LPP"],
    summaryLabel: "Daily at sunset · Sunset bar",
    description: "Pastis, bubbles, and the first step into the night at Le Petit Paris.",
  });
  addSeries({
    id: "lum-day-dj",
    title: "Daytime DJ",
    kind: "open",
    days: "daily",
    timeLabel: "11 am to 5 pm",
    sortStart: "11:00",
    sortEnd: "17:00",
    linkedCodes: ["LUM"],
    summaryLabel: "Daily 11 am-5 pm · Daytime DJ",
    description: "DJ on the camo-shade dance floor with food, wine, and braai fire at Luminosity Lounge.",
  });
  addSeries({
    id: "mar-sunset-lounge",
    title: "Sunset Lounge",
    kind: "open",
    days: "daily",
    timeLabel: "Sunset",
    sortStart: "18:30",
    linkedCodes: ["MAR"],
    summaryLabel: "Daily at sunset · Sunset lounge",
    description: "Shade, sweet sounds, chilled vibes, and a raised lounge facing the Binnekring at MARAH.",
  });
  addSeries({
    id: "tcr-kiwiburn-meetup",
    title: "Kiwiburn Meetup",
    kind: "event",
    days: "tue",
    timeLabel: "Tuesday 2 pm",
    sortStart: "14:00",
    linkedCodes: ["TCR"],
    categories: ["community", "foodDrink"],
    sourceLabel: "User-supplied event",
    summaryLabel: "Tue 2 pm · Kiwiburn Meetup",
    description: "Join the exported Kiwiburn camp at Two Couches & a Rug to meet, relax, and celebrate. Expect a loose afternoon of Kiwi connections, possible chocolate-coated pineapple lollies, kiwi dip, maybe a Battle of the Marmites, maybe karaoke, and whatever else the moment turns into.",
  });
  addSeries({
    id: "mim-mimosas",
    title: "Mimosas and Groovy Beats",
    kind: "open",
    days: "daily",
    timeLabel: "From 12 pm",
    sortStart: "12:00",
    linkedCodes: ["MIM"],
    summaryLabel: "Daily from 12 pm · Mimosas and beats",
    description: "Ice-cold mimosas, rogue rhythm, and daytime mischief at Mimosa Avenue.",
  });
  addSeries({
    id: "pap-afro-house",
    title: "Afro House Afternoons",
    kind: "event",
    days: "daily",
    timeLabel: "1 pm to 4 pm-ish",
    sortStart: "13:00",
    sortEnd: "16:00",
    linkedCodes: ["PAP"],
    categories: ["music", "community"],
    summaryLabel: "Daily 1 pm-4 pm-ish · Afro house afternoons",
    description: "Afro house, Afrobeats, and amapiano afternoons at Pamoja Project.",
  });
  addSeries({
    id: "pic-afternoon-party",
    title: "Afternoon Party",
    kind: "event",
    days: "daily",
    timeLabel: "3 pm-ish",
    sortStart: "15:00",
    linkedCodes: ["PIC"],
    summaryLabel: "Daily 3 pm-ish · Afternoon party",
    description: "Refreshing pickled pleasures, bubbly beverages, and bouncy beats at Pickles & Pickles.",
  });
  addSeries({
    id: "plt-sundowners",
    title: "Sundowners",
    kind: "open",
    days: "daily",
    timeLabel: "From 4 pm",
    sortStart: "16:00",
    linkedCodes: ["PLT"],
    summaryLabel: "Daily from 4 pm · Sundowners",
    description: "Sundowners and route plotting before the Binnekring tour sets off.",
  });
  addSeries({
    id: "plt-tour",
    title: "Hop-on Hop-off Walking Tour",
    kind: "event",
    days: "daily",
    timeLabel: "5 pm-ish",
    sortStart: "17:00",
    linkedCodes: ["PLT"],
    summaryLabel: "Daily 5 pm-ish · Walking tour",
    description: "A partially qualified walking tour of the Binnekring with outlandish soundtracks.",
  });
  addSeries({
    id: "rrh-sundowners",
    title: "Golden Hour Dance Floor",
    kind: "event",
    days: "wed-sat",
    timeLabel: "4 pm to 8 pm",
    sortStart: "16:00",
    sortEnd: "20:00",
    linkedCodes: ["RRH"],
    summaryLabel: "Wed-Sat 4 pm-8 pm · Golden hour dance floor",
    description: "Silky tunes, sundowners, and sunset energy at the Ra Ra Hive.",
  });
  addSeries({
    id: "sac-beauty-bar",
    title: "Beauty Bar",
    kind: "event",
    days: "daily",
    timeLabel: "3:30 pm to 5:30 pm",
    sortStart: "15:30",
    sortEnd: "17:30",
    linkedCodes: ["SAC"],
    summaryLabel: "Daily 3:30 pm-5:30 pm · Beauty Bar",
    description: "Transformation in the Sacred Garden chill space, with fantasy decor and costume-swap energy.",
  });
  addSeries({
    id: "sac-tea-ceremony",
    title: "Tea Ceremony",
    kind: "event",
    days: "daily",
    timeLabel: "9 pm to 10 pm",
    sortStart: "21:00",
    sortEnd: "22:00",
    linkedCodes: ["SAC"],
    summaryLabel: "Daily 9 pm-10 pm · Tea ceremony",
    description: "Evening tea ceremony in Sacred Garden Camp.",
  });
  addSeries({
    id: "tan-dawa-bar",
    title: "Dawa Bar",
    kind: "open",
    days: "daily",
    timeLabel: "Afternoons",
    sortStart: "14:00",
    linkedCodes: ["TAN"],
    summaryLabel: "Daily afternoons · Dawa bar",
    description: "A ginger-based Kenyan drink, served hot or cold, with hydration and conversation.",
  });
  addSeries({
    id: "tas-builders-breakfast",
    title: "Builders' Breakfast",
    kind: "event",
    days: "mon-thu",
    timeLabel: "Morning",
    sortStart: "08:00",
    linkedCodes: ["TAS"],
    summaryLabel: "Mon-Thu mornings · Builders' breakfast",
    description: "Breakfast and extra hands, saws, and axes for artists who need help with artworks.",
  });
  addSeries({
    id: "ins-ice-cream",
    title: "Ice Creams and Beats",
    kind: "event",
    days: "daily",
    timeLabel: "12 pm-ish",
    sortStart: "12:00",
    linkedCodes: ["INS"],
    summaryLabel: "Daily 12 pm-ish · Ice creams and beats",
    description: "Scoops, beats, and Binnekring treats at The inside scoop.",
  });
  addSeries({
    id: "kee-nourishment",
    title: "Nourishment of the Flame",
    kind: "event",
    days: "mon-sat",
    timeLabel: "2 pm to 3 pm",
    sortStart: "14:00",
    sortEnd: "15:00",
    linkedCodes: ["KEE"],
    summaryLabel: "Mon-Sat 2 pm-3 pm · Nourishment of the Flame",
    description: "Braai-bread broken in ritual gathering at The Keepers.",
  });
  addSeries({
    id: "tlr-grand-opening",
    title: "Hotel Grand Opening",
    kind: "event",
    days: "tue",
    timeLabel: "Tuesday sunset",
    sortStart: "18:30",
    linkedCodes: ["TLR"],
    summaryLabel: "Tue sunset · Hotel grand opening",
    description: "Welcome drinks with freaky beats as The Last Resort opens for the week.",
  });
  addSeries({
    id: "pan-pancakes",
    title: "Pancake Service",
    kind: "event",
    days: "daily",
    timeLabel: "9 am to 11 am",
    sortStart: "09:00",
    sortEnd: "11:00",
    linkedCodes: ["PAN"],
    summaryLabel: "Daily 9 am-11 am · Pancakes",
    description: "Morning pancakes filled with love at The Pancake People.",
  });
  addSeries({
    id: "sps-burlesque",
    title: "Burlesque Show",
    kind: "event",
    days: "thu-sat",
    timeLabel: "Early evening",
    sortStart: "18:00",
    linkedCodes: ["SPS"],
    summaryLabel: "Thu-Sat early evening · Burlesque show",
    description: "Glitz, glamour, and delicious trouble at The Steampunk Saloon.",
  });
  addSeries({
    id: "sps-swing-dance-workshop",
    title: "Swing Dance Workshop",
    kind: "event",
    days: "wed",
    timeLabel: "Wednesday 11 am",
    sortStart: "11:00",
    linkedCodes: ["SPS"],
    categories: ["workshop", "movement", "community"],
    sourceLabel: "User-supplied event",
    summaryLabel: "Wed 11 am · Swing Dance Workshop",
    description: "A Swing Dance Workshop at The Steampunk Saloon led by Muriel Gravenor.",
  });
  addSeries({
    id: "slc-screenings",
    title: "Cinema Screenings",
    kind: "event",
    days: "daily",
    timeLabel: "Sunset till late",
    sortStart: "18:30",
    linkedCodes: ["SLC"],
    summaryLabel: "Daily from sunset · Cinema screenings",
    description: "Family-friendly musicals at first, followed by arthouse, world cinema, and classics.",
  });
  addSeries({
    id: "tea-service",
    title: "Tea Service",
    kind: "open",
    days: "daily",
    timeLabel: "11 am until late",
    sortStart: "11:00",
    estimatedEnd: "02:00",
    estimatedEndNextDay: true,
    linkedCodes: ["TEA"],
    summaryLabel: "Daily 11 am-late · Tea service",
    description: "Caffeinated and herbal teas with desert views at the Teahouse at the End of the Universe.",
  });
  addSeries({
    id: "tws-showers",
    title: "Showers",
    kind: "open",
    days: "mon-sat",
    timeLabel: "8 am to 12 pm",
    sortStart: "08:00",
    sortEnd: "12:00",
    linkedCodes: ["TWS"],
    summaryLabel: "Mon-Sat 8 am-12 pm · Showers",
    description: "Bring your own 5L of water and step out divine at The Wet Spot.",
  });
  addSeries({
    id: "thi-daytime-oasis",
    title: "Daytime Oasis",
    kind: "open",
    days: "daily",
    timeLabel: "10 am to 6 pm",
    sortStart: "10:00",
    sortEnd: "18:00",
    linkedCodes: ["THI"],
    summaryLabel: "Daily 10 am-6 pm · Daytime oasis",
    description: "Berry shots, daytime parties, and a sunset chill zone with music at THIRSTY.",
  });
  addSeries({
    id: "tif-open-lab",
    title: "Open Lab",
    kind: "open",
    days: "daily",
    timeLabel: "From 3 pm",
    sortStart: "15:00",
    linkedCodes: ["TIF"],
    summaryLabel: "Daily from 3 pm · Open lab",
    description: "Open board, open mic, talks, experiments, and anyone can run a session at This is Fine Lab.",
  });
  addSeries({
    id: "tul-morning-workshops",
    title: "Morning Workshops",
    kind: "event",
    days: "daily",
    timeLabel: "Around 10-ish",
    sortStart: "10:00",
    linkedCodes: ["TUL"],
    summaryLabel: "Daily around 10-ish · Morning workshops",
    description: "Creativity, presence, and collective expression at Tulpa.",
  });
  addSeries({
    id: "tul-signature-party-tue",
    title: "Signature Party",
    kind: "event",
    days: "tue",
    timeLabel: "After dark",
    sortStart: "21:00",
    linkedCodes: ["TUL"],
    summaryLabel: "Tue after dark · Signature party",
    description: "One of Tulpa's two signature parties blending music, art, and connection.",
  });
  addSeries({
    id: "tul-signature-party-thu",
    title: "Signature Party",
    kind: "event",
    days: "thu",
    timeLabel: "After dark",
    sortStart: "21:00",
    linkedCodes: ["TUL"],
    summaryLabel: "Thu after dark · Signature party",
    description: "The second Tulpa signature party, with music, art, and connection.",
  });
  addSeries({
    id: "cc-conscious-hour",
    title: "Conscious Hour",
    kind: "event",
    days: "daily",
    timeLabel: "3 pm to 4 pm",
    sortStart: "15:00",
    sortEnd: "16:00",
    linkedCodes: ["CC"],
    categories: ["wellness"],
    summaryLabel: "Daily 3 pm-4 pm · Conscious hour",
    description: "A daily hour for deeper, more intimate conversation at Conscious Couching.",
  });
  addSeries({
    id: "ec-ego-incineration",
    title: "Ego Incineration",
    kind: "event",
    days: "fri",
    timeLabel: "Friday evening",
    sortStart: "19:00",
    linkedCodes: ["EC"],
    summaryLabel: "Fri evening · Ego incineration",
    description: "All unclaimed egos are incinerated on Friday evening at the Ego Check Booth.",
  });
  addSeries({
    id: "the-herald-wed",
    title: "The Herald",
    kind: "event",
    days: "wed",
    timeLabel: "3 pm",
    sortStart: "15:00",
    categories: ["performance"],
    summaryLabel: "Wed 3 pm · The Herald",
    description: "A moving performance by Kyla Davis.",
  });
  addSeries({
    id: "the-herald-fri-morning",
    title: "The Herald",
    kind: "event",
    days: "fri",
    timeLabel: "10 am",
    sortStart: "10:00",
    categories: ["performance"],
    summaryLabel: "Fri 10 am · The Herald",
    description: "A moving performance by Kyla Davis.",
  });
  addSeries({
    id: "the-herald-fri-afternoon",
    title: "The Herald",
    kind: "event",
    days: "fri",
    timeLabel: "3 pm",
    sortStart: "15:00",
    categories: ["performance"],
    summaryLabel: "Fri 3 pm · The Herald",
    description: "A moving performance by Kyla Davis.",
  });
  addSeries({
    id: "naked-spectrum-art-walk",
    title: "Naked Spectrum Art Walk",
    kind: "event",
    days: "fri",
    timeLabel: "Friday from 1-ish",
    sortStart: "13:00",
    sortEnd: "15:00",
    linkedCodes: ["BDS"],
    categories: ["performance", "movement", "community"],
    summaryLabel: "Fri from 1-ish · Naked Spectrum art walk",
    description: "A body-positive art walk / human parade leaving from Birthday Suits Theme Camp and roving in and around the Binnekring for an hour or two.\n\nWhat's that walking kaalgat in the desert wearing nothing but boots and looking as colourful as my auntie's home-sewn quilt? It's the Naked Spectrum parading their hueman-ness in celebration of their human form. Undressing to express radical acceptance of our radical selves radically! Please ask for consent before taking any close photographs. Art by Matt-hue.",
  });
  addSeries({
    id: "critical-tits-workshop",
    title: "Pastie-Making Workshop & Burlesque",
    kind: "event",
    days: "sat",
    timeLabel: "2 pm",
    sortStart: "14:00",
    sortEnd: "16:30",
    linkedCodes: ["SPS"],
    categories: ["performance", "workshop", "community"],
    summaryLabel: "Sat 2 pm · Pastie-Making Workshop & Burlesque",
    description: "A celebration of body freedom and radical self-expression at the Steampunk Saloon. Come make your pasties and enjoy some burlesque before the Critical Tits Parade. All femme and nonbinary bodies welcome!",
  });
  addSeries({
    id: "critical-tits-parade",
    title: "Critical Tits Parade",
    kind: "event",
    days: "sat",
    timeLabel: "4:30 pm",
    sortStart: "16:30",
    linkedCodes: ["SPS"],
    categories: ["performance", "community"],
    summaryLabel: "Sat 4:30 pm · Critical Tits Parade",
    description: "The topless parade kicks off at 4:30 pm, ending with a champagne party. Come sparkle, strut, and celebrate! All femme and nonbinary bodies welcome!",
  });
  addSeries({
    id: "die-saamte-market",
    title: "Die Saamte Market",
    kind: "event",
    days: "sat",
    timeLabel: "1 pm-ish until sunset",
    sortStart: "13:00",
    categories: ["music", "performance", "foodDrink", "community"],
    sourceLabel: "User-supplied event",
    summaryLabel: "Sat 1 pm-ish until sunset · Die Saamte Market",
    description: "A daytime festive market somewhere on the Binnekring with music, gifts, food, drinks, strange little interactions, mutant vehicles, performances, and general beautiful chaos. Everyone is welcome to wander, meet people, dance, discover something unexpected, and enjoy the afternoon. If you want to bring a mutant vehicle, gift, food, drinks, a game, an installation, a performance, or any other interactive experience into the market, reach out directly to the organiser.",
  });
  addSeries({
    id: "alex-convention",
    title: "The Alex Convention",
    kind: "event",
    days: "thu",
    timeLabel: "Thursday lunchtime",
    sortStart: "12:30",
    categories: ["community"],
    summaryLabel: "Thu lunchtime · The Alex Convention",
    description: "The Great Gathering of Alexes: roll calls, rituals, ridiculousness, and snacks for the Alexocalypse.",
  });
  addSeries({
    id: "prism-run",
    title: "The Prism Run",
    kind: "event",
    days: "thu",
    timeLabel: "7:30 am",
    sortStart: "07:30",
    sortEnd: "09:30",
    linkedCodes: ["TB"],
    categories: ["movement", "community"],
    summaryLabel: "Thu 7:30 am · The Prism Run",
    description: "Unleash your inner light and scatter into scandalous colour on a 5km or 10km loop through the dusty heart of AfrikaBurn. Join us at Triple Bypass, 7:30 am on Thursday, 30 April. Bring a curated goodie bag, chase ice-cold bubbly, and sprint for one of our coveted, ever-vanishing upcycled medals. Run. Shine. Transform.",
  });
  addSeries({
    id: "friday-moop-swoop",
    title: "Friday MOOP Swoop",
    kind: "event",
    days: "fri",
    timeLabel: "2 pm-ish",
    sortStart: "14:00",
    linkedCodes: ["OCC"],
    categories: ["movement", "community", "service"],
    summaryLabel: "Fri 2 pm-ish · MOOP Swoop",
    description: "On Friday at 2 pm(ish), you're invited to gather at the OCC, dressed in your finest regalia, to take part in a massive group MOOP swoop. Oh! The things you'll find on the floor in Tankwa Town… This is not a chore, it's a carnival! If you've got a trombone or tambourine, bring it along and help to create a net-positive cacophony. By Conductor Coco and the MOOP Majorettes.",
  });
  addSeries({
    id: "dpw-parade",
    title: "DPW Parade",
    kind: "event",
    days: "fri",
    timeLabel: "3 pm-ish",
    sortStart: "15:00",
    categories: ["performance", "community"],
    summaryLabel: "Fri 3 pm-ish · DPW Parade",
    description: "The DPW crew remix their identities and cruise around the Binnekring in their work-vehicle chariots.",
  });
  addSeries({
    id: "dmv-mutant-parade",
    title: "Mutant Parade",
    kind: "event",
    days: "fri",
    timeLabel: "4:30 pm onward",
    sortStart: "16:30",
    linkedCodes: ["DMV"],
    categories: ["movement", "community", "performance"],
    summaryLabel: "Fri 4:30 pm onward · Mutant Parade",
    description: "Meet outside the DMV facing north at 4:30 pm on Friday afternoon. The parade proceeds along the Binnekring, with permission to drive on the Binnekring, to 12-ish; then along Rainbow and back down to 6-ish; and from there on to 2-ish.",
  });
  addSeries({
    id: "wh0es-burn",
    title: "WH0ES Burn",
    kind: "event",
    days: "fri",
    timeLabel: "Friday 6 pm",
    sortStart: "18:00",
    linkedCodes: ["WH"],
    categories: ["burn", "community"],
    summaryLabel: "Fri 6 pm · WH0ES burn",
    description: "WH0ES burns at 6 pm on Friday afternoon.",
  });
  addSeries({
    id: "sc-sunrise-practice",
    title: "Sunrise Meditation and Yoga",
    kind: "event",
    days: "daily",
    timeLabel: "Sunrise",
    sortStart: "06:00",
    linkedCodes: ["SC"],
    summaryLabel: "Daily at sunrise · Meditation and yoga",
    description: "Sunrise meditations and gentle yoga at SongCatcher: The Continuum.",
  });
  addSeries({
    id: "xsp-spikey-emergence",
    title: "Spikey Emergence",
    kind: "event",
    days: "daily",
    timeLabel: "15:30",
    sortStart: "15:30",
    linkedCodes: ["XSP"],
    summaryLabel: "Daily 15:30 · Spikey emergence",
    description: "Spikey cocoons and croons to melodic, funky, uplifting dance tunes.",
  });
  addSeries({
    id: "rft-live-broadcast",
    title: "Live Broadcast Window",
    kind: "open",
    days: "daily",
    timeLabel: "9-ish to 5-ish",
    sortStart: "09:00",
    sortEnd: "17:00",
    linkedCodes: ["RFT"],
    summaryLabel: "Daily 9-ish-5-ish · Live broadcast",
    description: "Radio Free Tankwa stays live with weather, schedules, interviews, DJs, and general kakpraat.",
  });
  addSeries({
    id: "rft-broadcast-signup",
    title: "Broadcast Slot Sign-up",
    kind: "open",
    days: "daily",
    timeLabel: "10-ish to 5 pm",
    sortStart: "10:00",
    sortEnd: "17:00",
    linkedCodes: ["RFT"],
    categories: ["service", "workshop", "community"],
    summaryLabel: "Daily 10-ish-5 pm · Broadcast slot sign-up",
    description: "Every morning the schedule board gets wiped clean and hour-long Radio Free Tankwa slots open up through the day.",
  });
  addSeries({
    id: "rft-bedtime-stories",
    title: "Bedtime Stories and Chaotic Nonsense",
    kind: "event",
    days: "daily",
    timeLabel: "2 am-ish",
    sortStart: "02:00",
    linkedCodes: ["RFT"],
    summaryLabel: "Daily 2 am-ish · Bedtime stories / nonsense",
    description: "After-hours Radio Free Tankwa might still be broadcasting bedtime stories or chaotic nonsense.",
  });
  addSeries({
    id: "art-artifactory",
    title: "Artifactory Open",
    kind: "open",
    days: "daily",
    timeLabel: "9 am to late",
    sortStart: "09:00",
    linkedCodes: ["ART"],
    summaryLabel: "Daily 9 am-late · Artifactory",
    description: "History, collateral, archival news, photographs, and moving visuals from the story of AfrikaBurn.",
  });
  addSeries({
    id: "art-arteria",
    title: "Arteria Open",
    kind: "open",
    days: "daily",
    timeLabel: "9 am to 3 pm",
    sortStart: "09:00",
    sortEnd: "15:00",
    linkedCodes: ["ART"],
    summaryLabel: "Daily 9 am-3 pm · Arteria",
    description: "Check in with the Art Team, find the artwork map, burn times, and the happenings chalkboard at Arteria.",
  });
  addSeries({
    id: "occ-main-hub-mon-wed",
    title: "OCC Main Hub Hours",
    kind: "open",
    days: "mon-wed",
    timeLabel: "9 am to 7 pm",
    sortStart: "09:00",
    sortEnd: "19:00",
    linkedCodes: ["OCC"],
    categories: ["service", "community"],
    summaryLabel: "Mon-Wed 9 am-7 pm · OCC main hub",
    description: "The official OCC business hours for the main civic hub during the first half of the burn week.",
  });
  addSeries({
    id: "occ-main-hub-thu-sun",
    title: "OCC Main Hub Hours",
    kind: "open",
    days: ["thu", "fri", "sat", "sun"],
    timeLabel: "9 am to 5 pm",
    sortStart: "09:00",
    sortEnd: "17:00",
    linkedCodes: ["OCC"],
    categories: ["service", "community"],
    summaryLabel: "Thu-Sun 9 am-5 pm · OCC main hub",
    description: "The official OCC business hours for the main civic hub later in the burn week.",
  });
  addSeries({
    id: "volunteer-booth",
    title: "Volunteer Booth Open",
    kind: "open",
    days: "daily",
    timeLabel: "10 am to 7 pm",
    sortStart: "10:00",
    sortEnd: "19:00",
    linkedCodes: ["VOL"],
    summaryLabel: "Daily 10 am-7 pm · Volunteer Booth",
    description: "Check in for shifts, sign up for something new, or grab the latest intel on what is happening in the dust.",
  });
  addSeries({
    id: "sanctuary-testing-morning",
    title: "Harm Reduction and Testing",
    kind: "open",
    days: "daily",
    timeLabel: "10 am to 12 pm",
    sortStart: "10:00",
    sortEnd: "12:00",
    linkedCodes: ["SAN"],
    summaryLabel: "Daily 10 am-12 pm · Testing and harm reduction",
    description: "Daily testing and safety support at the Sanctuary Hub.",
  });
  addSeries({
    id: "sanctuary-testing-afternoon",
    title: "Harm Reduction and Testing",
    kind: "open",
    days: "daily",
    timeLabel: "3 pm to 5 pm",
    sortStart: "15:00",
    sortEnd: "17:00",
    linkedCodes: ["SAN"],
    summaryLabel: "Daily 3 pm-5 pm · Testing and harm reduction",
    description: "An afternoon testing and safety window at the Sanctuary Hub.",
  });
  addSeries({
    id: "rangers-training",
    title: "Ranger Training",
    kind: "event",
    days: "mon-wed",
    timeLabel: "9 am",
    sortStart: "09:00",
    linkedCodes: ["RNG", "XRK"],
    summaryLabel: "Mon-Wed 9 am · Ranger training",
    description: "Training for people keen to step up and join the Rangers.",
  });
  addSeries({
    id: "ice-sales",
    title: "Ice Sales",
    kind: "open",
    days: "mon-sat",
    timeLabel: "11 am to 1 pm",
    sortStart: "11:00",
    sortEnd: "13:00",
    linkedCodes: ["ICE"],
    summaryLabel: "Mon-Sat 11 am-1 pm · Ice sales",
    description: "The only place in Tankwa Town where money still matters: ice at Die Yskas.",
  });
  addSeries({
    id: "dance-of-1000-flames",
    title: "The Dance of 1,000 Flames",
    kind: "event",
    days: "sat",
    timeLabel: "Saturday at sunset",
    sortStart: "18:30",
    linkedCodes: ["404"],
    categories: ["performance", "community"],
    summaryLabel: "Sat at sunset · The Dance of 1,000 Flames",
    description: "The biggest Fire Dancing Jam in Africa! Gathered around the Clan before it burns on Saturday, all the fire dancers of Burn will share their love of Fire and Flow with you. NB: Fire Dancers must meet at Camp 404 on Saturday at Sunset before Spinning. Any experienced spinners welcome! More info at Camp 404.",
  });
  addSeries({
    id: "burnt-sugar-mon",
    title: "Burnt Sugar and Salvation",
    kind: "event",
    days: "mon",
    timeLabel: "Monday during the day",
    sortStart: "12:00",
    linkedCodes: ["LPP"],
    categories: ["performance", "wellness", "community"],
    summaryLabel: "Mon during the day · Burnt Sugar and Salvation",
    description: "Lay down with kindness to yourself all that no longer serves you. Let what has been carried too long be given to the dust and the dusk, your offering as the sun sets, your confession setting you free. The space is safe; the ritual is guided, renewed, and revered. Near to Le Petit Paris. By Monique Woodborne and Salome Schonken.",
  });
  addSeries({
    id: "burnt-sugar-fri",
    title: "Burnt Sugar and Salvation",
    kind: "event",
    days: "fri",
    timeLabel: "Friday at sunset",
    sortStart: "18:30",
    linkedCodes: ["LPP"],
    categories: ["performance", "wellness", "community"],
    summaryLabel: "Fri at sunset · Burnt Sugar and Salvation",
    description: "Lay down with kindness to yourself all that no longer serves you. Let what has been carried too long be given to the dust and the dusk, your offering as the sun sets, your confession setting you free. The space is safe; the ritual is guided, renewed, and revered. Near to Le Petit Paris. By Monique Woodborne and Salome Schonken.",
  });
  addSeries({
    id: "the-last-drop-wed",
    title: "The Last Drop",
    kind: "event",
    days: "wed",
    timeLabel: "3 pm",
    sortStart: "15:00",
    categories: ["performance"],
    summaryLabel: "Wed 3 pm · The Last Drop",
    description: "A powerful 10-minute physical theatre production portraying the harsh water struggles faced by citizens of Makhanda. Performed in expressive masks with no dialogue, the play relies on raw physical language to tell a deeply human story. By Ntomboxolo Donyeli.",
  });
  addSeries({
    id: "the-last-drop-fri-morning",
    title: "The Last Drop",
    kind: "event",
    days: "fri",
    timeLabel: "10 am",
    sortStart: "10:00",
    categories: ["performance"],
    summaryLabel: "Fri 10 am · The Last Drop",
    description: "A powerful 10-minute physical theatre production portraying the harsh water struggles faced by citizens of Makhanda. Performed in expressive masks with no dialogue, the play relies on raw physical language to tell a deeply human story. By Ntomboxolo Donyeli.",
  });
  addSeries({
    id: "the-last-drop-fri-afternoon",
    title: "The Last Drop",
    kind: "event",
    days: "fri",
    timeLabel: "3 pm",
    sortStart: "15:00",
    categories: ["performance"],
    summaryLabel: "Fri 3 pm · The Last Drop",
    description: "A powerful 10-minute physical theatre production portraying the harsh water struggles faced by citizens of Makhanda. Performed in expressive masks with no dialogue, the play relies on raw physical language to tell a deeply human story. By Ntomboxolo Donyeli.",
  });
  addSeries({
    id: "unbirthday-party",
    title: "The Unbirthday Party",
    kind: "event",
    days: "daily",
    timeLabel: "Throughout the day",
    sortStart: "12:00",
    categories: ["performance", "community"],
    summaryLabel: "Daily · The Unbirthday Party",
    description: "Celebrate your unbirthday every day in the whackiest of ways at the Burn! By Natalie Stewart.",
  });

  // Mad Hatter's Village — daily rhythm
  addSeries({
    id: "mhv-coffee-tea",
    title: "Coffee & Tea Service",
    kind: "open",
    days: "daily",
    timeLabel: "9 am to 11 am",
    sortStart: "09:00",
    sortEnd: "11:00",
    linkedCodes: ["MHV"],
    categories: ["foodDrink", "community"],
    summaryLabel: "Daily 9 am-11 am · Coffee & Tea at Mad Hatter's Village",
    description: "Start the morning right at Mad Hatter's Village with coffee and tea service from 9 to 11 am.",
  });
  addSeries({
    id: "mhv-intentional-session",
    title: "Intentional Session",
    kind: "event",
    days: "daily",
    timeLabel: "11 am to 1 pm",
    sortStart: "11:00",
    sortEnd: "13:00",
    linkedCodes: ["MHV"],
    categories: ["wellness", "community", "workshop"],
    summaryLabel: "Daily 11 am-1 pm · Intentional Session at Mad Hatter's Village",
    description: "Mid-morning intentional session at Mad Hatter's Village — a space for connection, creativity, and conscious gathering before the day tips into mischief.",
  });
  addSeries({
    id: "mhv-lounge-sessions",
    title: "Lounge Sessions",
    kind: "open",
    days: "daily",
    timeLabel: "1 pm to 5 pm",
    sortStart: "13:00",
    sortEnd: "17:00",
    linkedCodes: ["MHV"],
    categories: ["music", "community"],
    summaryLabel: "Daily 1 pm-5 pm · Lounge Sessions at Mad Hatter's Village",
    description: "Afternoon lounge sessions at Mad Hatter's Village — settle in before the Extravaganza tips the village into chaos.",
  });
  addSeries({
    id: "mhv-extravaganza",
    title: "Mad Hatter's Extravaganza",
    kind: "event",
    days: ["tue", "wed", "thu", "fri", "sat"],
    timeLabel: "5 pm",
    sortStart: "17:00",
    sortEnd: "19:00",
    linkedCodes: ["MHV"],
    categories: ["music", "performance", "community"],
    summaryLabel: "Daily 5 pm · Mad Hatter's Extravaganza",
    description: "Every day at 5 pm the village tips into mischief. The wheel spins. Drinks flow. Music rises. Things get a little out of hand. Each day a different camp takes over — come find out who's running things today.",
  });
  addSeries({
    id: "mhv-djs",
    title: "DJs",
    kind: "open",
    days: "daily",
    timeLabel: "7 pm to 2 am",
    sortStart: "19:00",
    sortEnd: "26:00",
    linkedCodes: ["MHV"],
    categories: ["music"],
    summaryLabel: "Daily 7 pm-2 am · DJs at Mad Hatter's Village",
    description: "DJs carry the Mad Hatter's Village energy into the night, every night from 7 pm to 2 am.",
  });

  // Mad Hatter's Village — daily takeovers
  addSeries({
    id: "mhv-opening-mon",
    title: "Lounge Opening Night",
    kind: "event",
    days: "mon",
    timeLabel: "8 pm",
    sortStart: "20:00",
    linkedCodes: ["MHV"],
    categories: ["music", "community"],
    summaryLabel: "Mon 8 pm · Mad Hatter's Village Lounge Opening",
    description: "The Mad Hatters have arrived on the Binnekring. Lounge Opening from 8 pm on Monday night — come play with us.",
  });
  addSeries({
    id: "mhv-sexico-city",
    title: "Sexico City Takeover",
    kind: "event",
    days: "tue",
    timeLabel: "5 pm",
    sortStart: "17:00",
    linkedCodes: ["SEX", "MHV"],
    categories: ["music", "performance", "community"],
    summaryLabel: "Tue 5 pm · Sexico City Takeover at Mad Hatter's Village",
    description: "Sexico City takes over Mad Hatter's Village on Tuesday – the Mexpocalypse is now.",
  });
  addSeries({
    id: "mhv-family-business",
    title: "Family Business Takeover",
    kind: "event",
    days: "wed",
    timeLabel: "5 pm",
    sortStart: "17:00",
    linkedCodes: ["FAM", "MHV"],
    categories: ["music", "performance", "community"],
    summaryLabel: "Wed 5 pm · Family Business Takeover at Mad Hatter's Village",
    description: "Family Business takes over Mad Hatter's Village on Wednesday – madness is the dress code!",
  });
  addSeries({
    id: "mhv-cymatica",
    title: "Cymatica Takeover",
    kind: "event",
    days: "fri",
    timeLabel: "5 pm",
    sortStart: "17:00",
    linkedCodes: ["CYM", "MHV"],
    categories: ["music", "performance", "community"],
    summaryLabel: "Fri 5 pm · Cymatica Takeover at Mad Hatter's Village",
    description: "Cymatica takes over Mad Hatter's Village on Friday – lose yourself in sound, frequency, and flow.",
  });
  addSeries({
    id: "mhv-curiocity",
    title: "CurioCity Takeover",
    kind: "event",
    days: "sat",
    timeLabel: "5 pm",
    sortStart: "17:00",
    linkedCodes: ["CUR", "MHV"],
    categories: ["music", "performance", "community"],
    summaryLabel: "Sat 5 pm · CurioCity Takeover at Mad Hatter's Village",
    description: "CurioCity takes over Mad Hatter's Village on Saturday – the unexpected is everything expected.",
  });
  addSeries({
    id: "mhv-jam-jam",
    title: "Sunday Jam Jam Party",
    kind: "event",
    days: "sun",
    timeLabel: "Post-Temple Burn",
    sortStart: "21:00",
    linkedCodes: ["MHV"],
    categories: ["music", "community"],
    summaryLabel: "Sun post-Temple Burn · Sunday Jam Jam Party",
    description: "The last hurrah... under the stars. Slip into your PJs and join the Jam Jam Session at Mad Hatter's Village Lounge after Temple Burn. Come land before we all let go. Follow the lasers.",
  });

  addSeries({
    id: "guided-art-tour",
    title: "Guided Art Tour",
    kind: "event",
    days: "wed",
    timeLabel: "4 pm to 7 pm",
    sortStart: "16:00",
    sortEnd: "19:00",
    linkedCodes: ["PAN"],
    categories: ["community", "movement"],
    summaryLabel: "Wed 4 pm-7 pm · Guided Art Tour, starting at The Pancake People",
    description: "A guided tour of the Binnekring artworks, starting at The Pancake People (3-ish and Binnekring) at 4 pm on Wednesday. A lovely way to explore the art with a knowledgeable guide. Open to all.",
  });
  addSeries({
    id: "tankwa-mask-workshop",
    title: "Mask-Making Workshop",
    kind: "event",
    days: "wed",
    timeLabel: "9 am",
    sortStart: "09:00",
    sortEnd: "12:00",
    linkedCodes: ["MAL"],
    categories: ["workshop", "wellness", "community"],
    summaryLabel: "Wed 9 am · Mask-Making Workshop at MAHALA",
    description: "A 3-hour deep dive into releasing the patterns, habits, and beliefs that bind us — and dreaming into what we want to create. Reconnect to who you innately are and celebrate that beauty. The process involves meditation, movement, mask-making, dialogue, and ceremonial release. All materials provided. At MAHALA. Note: this workshop is fully booked — but the Unmasked Ball at 6 pm is open to all. A mask is the only requirement for the ball.",
  });
  addSeries({
    id: "tankwa-unmasked-ball",
    title: "The Tankwa Unmasked Ball",
    kind: "event",
    days: "wed",
    timeLabel: "6 pm",
    sortStart: "18:00",
    linkedCodes: ["UB"],
    categories: ["performance", "music", "community"],
    summaryLabel: "Wed 6 pm · The Tankwa Unmasked Ball — near the Clan",
    description: "As the sun begins its slow descent over the playa, a constellation of musicians gathers — strings, voices, and rhythms weaving together to breathe orchestral magic into the desert air. Adorn yourself in your most ethereal desert finery: flowing gowns, tailored suits, textures kissed by dust and light. Don a mask that reveals as much as it conceals. As darkness deepens and the music swells, we arrive at the great unmasking — a moment of truth, vulnerability, and recognition. Near the Clan. A mask is the only requirement. Come as you are not. Leave as you are.",
  });
  addSeries({
    id: "calling-all-crones",
    title: "Calling All Crones",
    kind: "event",
    days: "fri",
    timeLabel: "5:30 pm",
    sortStart: "17:30",
    linkedCodes: ["EM"],
    categories: ["wellness", "community"],
    summaryLabel: "Fri 5:30 pm · Calling All Crones — at the Temple",
    description: "A council of wise women gathers at the Temple at 5:30 pm on Friday 1 May to welcome in the Flower Full Moon and call in peace to shift the current global structures. This gathering is for crones — all menopausal women who have ceased menstruation. Mature men over 50 who feel called are also welcome to form a circle around the women, holding a silent, strong container of spaciousness and reverent presence. Please bring a crown to wear — flowers, jewels, feathers, etc. Initiated by Leigh Barratt.",
  });

  entries.sort((a, b) =>
    a.date.localeCompare(b.date)
    || (a.sortStart ?? 0) - (b.sortStart ?? 0)
    || a.kind.localeCompare(b.kind)
    || a.title.localeCompare(b.title)
  );

  const byDate = Object.fromEntries(days.map((day) => [day.date, []]));
  const byLinkedCode = {};
  const seriesById = Object.fromEntries(series.map((item) => [item.id, item]));
  const seriesByLinkedCode = {};

  for (const item of entries) {
    byDate[item.date].push(item);
    for (const code of item.linkedCodes) {
      (byLinkedCode[code] ||= []).push(item);
    }
  }

  for (const item of series) {
    for (const code of item.linkedCodes) {
      (seriesByLinkedCode[code] ||= []).push(item);
    }
  }

  for (const code of Object.keys(byLinkedCode)) {
    byLinkedCode[code].sort((a, b) =>
      a.date.localeCompare(b.date)
      || (a.sortStart ?? 0) - (b.sortStart ?? 0)
      || a.title.localeCompare(b.title)
    );
  }

  for (const code of Object.keys(seriesByLinkedCode)) {
    seriesByLinkedCode[code].sort((a, b) =>
      (a.sortStart ?? 0) - (b.sortStart ?? 0)
      || a.title.localeCompare(b.title)
    );
  }

  return {
    days,
    entries,
    byDate,
    byLinkedCode,
    series,
    seriesById,
    seriesByLinkedCode,
  };
})();
