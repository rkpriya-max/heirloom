export const CURRENT_USER = {
  id: "user-pri",
  name: "Pri",
  email: "rkpriya@gmail.com",
  avatar: "P",
};

export const MOCK_RECIPES = [
  {
    id: "r1",
    title: "Amma's Sambar Podi",
    description: "The base spice blend for all our sambar. Amma made this every 3 months.",
    category: "Spice blend",
    yield: "About 500g",
    cook_time: "30 min",
    image: null,
    author_id: "user-pri",
    author_name: "Pri",
    is_public: false,
    created_at: "2026-05-20T10:00:00Z",
    tags: ["Amma", "Tamil", "Spice blend"],
    ingredients: [
      { section: undefined, items: ["3 cups dhaniya (coriander seeds)", "1 cup toor dal", "½ cup chana dal", "¼ tsp methi seeds", "¼ tsp mustard seeds", "½ tsp pepper", "Dry chillies — as much as dhaniya (mix bedige and regular)", "Haldi powder", "Curry leaves"] },
    ],
    steps: [
      "Dry roast each ingredient separately until fragrant. Do not burn.",
      "Mix bedige and regular hot chillies — this is the secret to the colour and heat balance.",
      "Add ½ measure rice and roast until golden.",
      "Cool completely before grinding to a fine powder.",
      "Store in an airtight container."
    ],
    notes: "Amma always said the chilli ratio is the secret. More bedige for colour, more hot chilli for heat. Grind when completely cool or the oil separates.",
    versions: [
      { id: "v1", label: "Amma's original", author: "Pri", date: "2026-05-20", notes: "Exactly as Amma made it." },
      { id: "v2", label: "My lighter version", author: "Pri", date: "2026-05-25", notes: "Reduced chilli by ⅓ for the kids. Added a pinch more methi." },
    ],
    comments: [
      { id: "c1", author: "Kavya", avatar: "K", text: "This is exactly how I remember it smelling in the kitchen! I used to sit and watch Paati grind this.", date: "2026-05-22" },
      { id: "c2", author: "Rajan Uncle", avatar: "R", text: "We use almost the same ratios in our house. Small difference — we add a bit of coconut to ours.", date: "2026-05-23" },
    ],
    memories: [
      { id: "m1", author: "Pri", avatar: "P", text: "Amma made this every 3 months without fail. The whole apartment smelled of roasting spices. I can still hear the stone grinder.", date: "2026-05-20", tagged_people: ["Amma"] },
      { id: "m2", author: "Kavya", avatar: "K", text: "Paati used to give little packets of this as gifts when relatives visited. It was the most requested thing.", date: "2026-05-22", tagged_people: ["Paati", "Amma"] },
    ],
  },
  {
    id: "r2",
    title: "Muligapodi",
    description: "The dip for idli and dosa. Mixed with gingelly oil.",
    category: "Condiment",
    yield: "About 300g",
    cook_time: "20 min",
    image: null,
    author_id: "user-pri",
    author_name: "Pri",
    is_public: true,
    created_at: "2026-05-21T10:00:00Z",
    tags: ["Amma", "Tamil", "Breakfast"],
    ingredients: [
      { section: undefined, items: ["1 cup til (sesame seeds) — roast", "1 cup urad dal", "½ cup chana dal — roast", "20–25 dried chillies", "Salt to taste", "1 big rock hing"] },
    ],
    steps: [
      "Roast sesame seeds separately until they start to pop. Set aside.",
      "Roast urad dal and chana dal until golden.",
      "Dry roast chillies.",
      "Cool everything completely.",
      "Grind together with salt and hing to a coarse powder — not too fine.",
      "Mix with gingelly oil before serving."
    ],
    notes: "The coarseness is important. Don't over-grind. Serve with idli and a small pool of gingelly oil.",
    versions: [
      { id: "v1", label: "Amma's original", author: "Pri", date: "2026-05-21", notes: "As written." },
    ],
    comments: [],
    memories: [
      { id: "m1", author: "Pri", avatar: "P", text: "Sunday morning breakfast. Always. Idli with muligapodi and oil.", date: "2026-05-21", tagged_people: ["Amma"] },
    ],
  },
  {
    id: "r3",
    title: "Patti's Puliyodharai",
    description: "Grandmother's tamarind rice. Slightly different from Amma's — no grinding.",
    category: "Rice",
    yield: "Serves 6",
    cook_time: "45 min",
    image: null,
    author_id: "user-kavya",
    author_name: "Kavya",
    is_public: false,
    created_at: "2026-05-23T10:00:00Z",
    tags: ["Patti", "Tamil", "Festivals"],
    ingredients: [
      { section: "Pulikachal (tamarind paste)", items: ["Large ball of tamarind", "Mustard seeds", "Kadala parappu (chana dal) — 2 parts", "Urad dal — 1 part", "Methi powder (add at end, not at beginning)", "Mulaga (dried chillies)", "Hing", "Oil"] },
      { section: "For the rice", items: ["Cooked rice", "Dhaniya (coriander seeds) — roasted and ground", "Sesame seeds — roasted and ground", "Bit of pepper", "1 chilli", "Kaju (cashews)", "Peanuts", "Haldi powder"] },
    ],
    steps: [
      "Patti's rule: don't grind the spices. Add them straight to the oil.",
      "Heat oil. Add mustard, chana dal, urad dal, chillies, hing. Skip methi at this stage.",
      "While doing thalimpu, add pre-soaked chana dal — 1 tbsp.",
      "Add tamarind water and cook down to a thick paste.",
      "At the very end, add methi powder (not seeds). This is Patti's trick.",
      "For rice: roast and grind dhaniya, sesame, pepper, chilli separately.",
      "Mix ground spice into cooked rice. Temper in oil with kaju, peanuts, haldi.",
      "Mix in tamarind paste to taste."
    ],
    notes: "Key difference from Amma's version: Patti doesn't grind the tempering spices. They go straight to oil. Methi powder added at the end prevents bitterness. Pre-soak the chana dal for the thalimpu.",
    versions: [
      { id: "v1", label: "Patti's original (no grinding)", author: "Kavya", date: "2026-05-23", notes: "Exactly as Patti described." },
      { id: "v2", label: "Amma's version (with grinding)", author: "Pri", date: "2026-05-24", notes: "Amma grinds the same spices. Different texture, same soul." },
    ],
    comments: [
      { id: "c1", author: "Pri", avatar: "P", text: "The methi-at-the-end trick is everything. I tried it and it completely changes the bitterness.", date: "2026-05-24" },
    ],
    memories: [
      { id: "m1", author: "Kavya", avatar: "K", text: "Patti made this for every Pongal. The smell of tamarind and mustard hitting hot oil takes me right back to her kitchen in Chennai.", date: "2026-05-23", tagged_people: ["Patti"] },
    ],
  },
];

export const MOCK_FAMILY = {
  id: "fam-1",
  name: "Krishnamurti Family",
  description: "Our family recipes, stories, and culinary memories.",
  created_by: "user-pri",
  members: [
    { id: "user-pri", name: "Pri", avatar: "P", role: "admin", joined: "2026-05-20" },
    { id: "user-kavya", name: "Kavya", avatar: "K", role: "member", joined: "2026-05-21" },
    { id: "user-rajan", name: "Rajan Uncle", avatar: "R", role: "member", joined: "2026-05-22" },
    { id: "user-meena", name: "Meena Aunty", avatar: "M", role: "member", joined: "2026-05-23" },
  ],
  shared_recipe_ids: ["r1", "r2", "r3"],
};

export const MOCK_EVENTS = [
  {
    id: "ev1",
    title: "Kavya's Baby Shower",
    date: "2026-06-15",
    description: "Full South Indian spread. Bringing the family together.",
    host_id: "user-pri",
    host_name: "Pri",
    guests: [
      { name: "Kavya", avatar: "K" },
      { name: "Rajan Uncle", avatar: "R" },
      { name: "Meena Aunty", avatar: "M" },
    ],
    menu_recipe_ids: ["r1", "r3"],
    notes: "Vegetarian only. Double the puliyodharai recipe.",
  },
  {
    id: "ev2",
    title: "Pongal Celebration",
    date: "2027-01-14",
    description: "Annual Pongal. Traditional menu.",
    host_id: "user-pri",
    host_name: "Pri",
    guests: [],
    menu_recipe_ids: ["r2", "r3"],
    notes: "",
  },
];

export const CHAT_SUGGESTIONS = [
  "Can I substitute anything for bedige chillies?",
  "How long does this keep?",
  "What does Amma mean by 'mix bedige and regular'?",
  "Can I make this in a blender instead of a stone grinder?",
];
