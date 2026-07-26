/**
 * Single source of truth for all Elevation Church Manchester details.
 *
 * Items marked CONFIRM are unverified — they render as visible placeholders or are
 * hidden entirely rather than being guessed. Fill them in here and the whole site updates.
 */

/** Set to false to hide anything still awaiting confirmation from the live site. */
export const SHOW_UNCONFIRMED = true;

export const church = {
  name: "Elevation Church Manchester",
  legalName: "The Elevation Church UK",
  shortName: "TEC Manchester",
  tagline: "Making Greatness Common",
  mission:
    "To empower you to achieve the highest level of distinction and greatness in life, serving God and humanity with passion.",
  bedrockScripture: {
    reference: "Matthew 23:11",
    text: "He who is greatest among you shall be your servant.",
  },
  launched: "1 May 2023",
  charityNumber: "1195403", // CONFIRM: that Manchester gives under this entity
  registeredOffice:
    "Crown House, 27 Old Gloucester Street, London WC1N 3AX",
} as const;

export const service = {
  day: "Sunday",
  startTime: "10:30am",
  doorsOpen: "10:00am", // CONFIRM
  approxDuration: "about 90 minutes", // CONFIRM
  timeConfirmed: false, // CONFIRM doors + end time, then set true
} as const;

export const location = {
  venue: "Mary Seacole Building",
  campus: "University of Salford",
  city: "Manchester",
  postcode: "M6 6PU",
  country: "United Kingdom",
  get full() {
    return `${this.venue}, ${this.campus}, ${this.city} ${this.postcode}`;
  },
  mapsQuery: "Mary Seacole Building, University of Salford, M6 6PU",
  get mapsUrl() {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      this.mapsQuery,
    )}`;
  },
  get embedUrl() {
    return `https://www.google.com/maps?q=${encodeURIComponent(
      this.mapsQuery,
    )}&output=embed`;
  },
} as const;

export const contact = {
  /** CONFIRM: Manchester inbox. Global fallback used until confirmed. */
  email: "info@elevationng.org",
  emailConfirmed: false,
  /** Global helpline. CONFIRM: a UK/Manchester number. */
  helpline: { label: "0700 ELEVATE", tel: "+2347003538283" },
  ukPhone: null as string | null, // CONFIRM
} as const;

export const socials = [
  {
    name: "Instagram",
    handle: "@elevationmanchester",
    href: "https://instagram.com/elevationmanchester",
  },
  {
    name: "Facebook",
    handle: "@elevationmanchester",
    href: "https://facebook.com/elevationmanchester",
  },
  {
    name: "YouTube",
    handle: "The Elevation Church Manchester",
    href: "https://www.youtube.com/channel/UCQ96VzcFQzUAUTTTEcPJ17w",
  },
  {
    name: "X",
    handle: "@elevationmanche",
    href: "https://x.com/elevationmanche",
  },
  {
    name: "Linktree",
    handle: "linktr.ee/elevationmanchester",
    href: "https://linktr.ee/elevationmanchester",
  },
] as const;

export const leadership = [
  {
    name: "Pastor Tosin Babalola",
    role: "Resident Pastor, Manchester",
    bio: "Pastor Tosin leads the Manchester expression of The Elevation Church, which launched on 1 May 2023.",
  },
  {
    name: "Pastor Godman Akinlabi",
    role: "Lead Pastor & Founder",
    bio: "Pastor Godman founded The Elevation Church in Lagos, Nigeria on 10 October 2010, and leads the global family of expressions alongside Pastor Bola Akinlabi.",
  },
  {
    name: "Pastor Bola Akinlabi",
    role: "Founding Pastor",
    bio: "Pastor Bola serves alongside Pastor Godman in leading The Elevation Church globally.",
  },
] as const;

/** Core values — the ASHLIE acrostic. */
export const values = [
  { letter: "A", name: "Accountability" },
  { letter: "S", name: "Service" },
  { letter: "H", name: "Humility" },
  { letter: "L", name: "Love" },
  { letter: "I", name: "Integrity" },
  { letter: "E", name: "Excellence" },
] as const;

export const personality = [
  "Humble",
  "Simple",
  "Youthful",
  "Audacious",
  "Intelligent",
  "Compassionate",
  "Friendly",
] as const;

export const beliefs = [
  {
    title: "One God, three persons",
    body: "There is one God, manifested in three persons — Father, Son and Holy Spirit.",
    scripture: "Deuteronomy 6:4",
  },
  {
    title: "Jesus Christ",
    body: "Jesus Christ is the Son of God, and the only way to the Father.",
    scripture: "Matthew 1:18–25; John 14:6",
  },
  {
    title: "The Bible",
    body: "The Bible is God's inspired Word.",
    scripture: "2 Timothy 3:16",
  },
  {
    title: "Salvation",
    body: "All people need salvation, and it is received freely by grace through faith — believing in your heart and confessing with your mouth.",
    scripture: "Romans 3:23; Romans 10:9; Ephesians 2:8",
  },
  {
    title: "Death, resurrection and return",
    body: "Jesus died, rose again and is coming again; the dead will rise.",
    scripture: "1 Corinthians 15:4; Acts 1:11; 1 Thessalonians 4:16–17",
  },
  {
    title: "Baptism and the Lord's Supper",
    body: "We practise Water Baptism and the Lord's Supper.",
    scripture: "Matthew 28:19; Matthew 26:26–29",
  },
  {
    title: "The Holy Spirit and healing",
    body: "We believe in the Baptism of the Holy Spirit, and that healing is provided in the atonement of Christ.",
    scripture: "Mark 16:17–18; Acts 1:8; James 5:14–15; 1 Peter 2:24",
  },
] as const;

/** The Growth Track — four next steps. */
export const growthTrack = [
  {
    step: "01",
    title: "Know God",
    body: "Begin a relationship with Jesus.",
    scripture: "John 17:3",
  },
  {
    step: "02",
    title: "Find Freedom",
    body: "Take the Membership Class and join a Connect Group.",
    scripture: "John 8:32–36",
  },
  {
    step: "03",
    title: "Discover Purpose",
    body: "Grow through TECi and Maturity School.",
    scripture: "1 Peter 2:9; Ephesians 2:10",
  },
  {
    step: "04",
    title: "Make Greatness Common",
    body: "Serve on the G-Squad and step into leadership.",
    scripture: "Matthew 23:11",
  },
] as const;

export const kidsAndYouth = [
  {
    name: "The Seeds",
    forWho: "Children's Church, including a baby class",
    body: "A safe, fun and faith-building space for our youngest every Sunday.",
  },
  {
    name: "412 Nation",
    forWho: "Teens Church",
    body: "Where teenagers belong, ask real questions and build real friendships.",
  },
  {
    name: "Surge",
    forWho: "Youth ministry",
    body: "The Elevation Church's global youth ministry.",
  },
] as const;

/** G-Squad units you can serve on at Manchester. */
export const serveTeams = [
  "Care",
  "Family Life",
  "Men of Honour",
  "Missions",
  "Worship",
  "Ushering",
  "Hospitality & Guest Management",
  "Protocol & Traffic Management",
  "The Jewels (women)",
  "Maturity",
  "Surge (youth)",
  "4One",
  "Production",
  "Multimedia",
  "Setup & Sound",
  "Media & Broadcasting",
  "Membership",
  "Communications",
  "Prayer",
  "The Seeds",
] as const;

export const supportMinistries = [
  {
    name: "Family Life",
    body: "Marriage, premarital and parenting counselling.",
  },
  { name: "Counselling", body: "Confidential support when life is hard." },
  { name: "CareerPro", body: "Career counselling and professional guidance." },
  { name: "Care Unit", body: "Benevolence and practical support for those in need." },
] as const;

export const giving = {
  paypalUrl:
    "https://www.paypal.com/donate/?hosted_button_id=L3ZEPY5K8QV6Y&source=qr",
  bank: {
    accountName: "The Elevation Church UK MAN",
    accountNumber: "49654219",
    sortCode: "23-05-80",
  },
  chequePayableTo: "The Elevation Church UK",
  giftAidAvailable: true,
} as const;

export const brand = {
  /**
   * Flip to true once the real artwork is in /public/brand — see the README
   * there for the exact filenames. Until then the Logo component falls back to
   * a typographic stand-in rather than 404-ing three images on every page.
   */
  hasLogoFiles: false,
  logo: {
    /** Blue mark + blue wordmark. For white/light backgrounds. */
    colour: "/brand/logo-colour.svg",
    /** All-white. For the ink footer, dark hero and mobile menu. */
    white: "/brand/logo-white.svg",
    /** Solid navy. For light backgrounds needing more contrast than the blue. */
    navy: "/brand/logo-navy.svg",
  },
  /** Natural aspect ratio of the supplied lockups (~3.3:1). */
  logoAspect: { width: 190, height: 58 },
} as const;

/**
 * Site-wide announcement bar. Change `id` when the message changes so it
 * re-appears for anyone who dismissed the previous one.
 *
 * Kept factual — no invented events.
 */
export const announcement = {
  id: "2026-visit-us",
  headline: "New here?",
  body: "Join us Sundays at 10:30am — Mary Seacole Building, University of Salford.",
  href: "/im-new",
  linkLabel: "Plan your visit",
} as const;

export const nav = [
  { label: "I'm New", href: "/im-new" },
  {
    label: "About",
    href: "/about",
    children: [
      { label: "Our Story", href: "/about#our-story" },
      { label: "Vision & Values", href: "/about#vision-values" },
      { label: "Leadership", href: "/about#leadership" },
      { label: "What We Believe", href: "/about/what-we-believe" },
    ],
  },
  { label: "Watch", href: "/watch" },
  { label: "Events", href: "/events" },
  { label: "Get Involved", href: "/get-involved" },
  { label: "Prayer", href: "/prayer" },
  { label: "Contact", href: "/contact" },
] as const;
