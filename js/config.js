/* ==========================================================================
   SITE CONFIG  —  ITS.ME
   كل حاجة تقدر تعدّلها في الموقع موجودة في الملف ده.
   You normally never need to touch app.js / style.css.

   1) Brand, texts, language            → "brand", "texts", "lang"/"dir"
   2) Products, prices, colours         → "products"
   3) Store rules (shipping, payment…)  → "store"
   4) Size charts                       → "sizeCharts"
   5) Order number (WhatsApp)           → "checkout"
   6) Animated background / motion      → "background", "motion"
   7) The shop page under the hero      → "site"  (sections, New Drop, nav…)
   ========================================================================== */

window.SITE = {
  lang: 'en',            // 'en' | 'ar'
  dir: 'ltr',            // 'ltr' | 'rtl'   (Arabic → 'rtl').  See js/config.ar.example.js

  brand: { name: 'ITS.ME', dot: false, mark: '' },     // dot:true → the red full-stop after the name, like the label
  pageTitle: 'ITS.ME — The Sets',

  /* ---------- theme (black / white / the red dot of the logo) ---------- */
  theme: {
    bg: '#0f0f10',
    ink: '#f3f1ec',
    muted: '#8e8d89',
    muted2: '#b4b2ab',
    line: 'rgba(243,241,236,.16)',
    ghost: 'rgba(255,255,255,.055)',
    glow: 'rgba(255,255,255,.075)',
    vig: 'rgba(0,0,0,.55)',
    shade: 'rgba(0,0,0,.6)',
    surface: 'rgba(24,24,26,.72)',
    surfaceHover: 'rgba(34,34,37,.94)',
    drawer: '#18181a',
    tile: 'rgba(255,255,255,.045)',
    swring: 'rgba(255,255,255,.3)',
    dust: '243,241,236',
    accent: '#9c1f27',
    red: '#e2262d'
  },

  /* ---------- animated background ---------- */
  background: {
    marquee: ['ITS.ME', 'OVERSIZED SETS', 'WIDE LEG — M TO XXL'],
    particles: 90,
    orbs: true,
    spotlight: true,
    badge: 'ITS.ME • THE SETS • 2026 • ',
    badgeCenter: 'IM'
  },

  /* ---------- hero (first screen) ---------- */
  hero: {
    ghost: 'ITS.ME',
    label: 'The Sets',
    sublabel: 'ITS.ME — 2026',
    top: ['ITS.ME', 'The Sets · 2026'],
    captionLeft: ['Sets, jeans, hoodies', '+ zip-ups & jackets'],
    captionRight: ['Sizes M → XXL · Jeans 30 → 40', 'Cash on delivery'],
    sideText: 'Drag · ← → to browse',
    pill: { label: 'New', lines: ['Hoodies from EGP 749', 'Cash on delivery · InstaPay'] }
  },

  currency: { symbol: 'EGP', position: 'before', locale: 'en-US' },

  /* ==========================================================================
     STORE RULES
     ========================================================================== */
  store: {
    /* Shipping by governorate.
       `fee`   : the price for every governorate that is not in a zone below (100).
       `zones` : cheaper (or dearer) governorates — matched by the English name in `governorates`.
       `freeOver` : free shipping when the total reaches this amount (0 = off). */
    shipping: {
      freeOver: 0,
      fee: 100,
      zones: [{ fee: 70, cities: ['Cairo', 'Alexandria'] }]
    },

    /* Governorates shown in the checkout list: [English, Arabic] */
    governorates: [
      ['Cairo', 'القاهرة'], ['Alexandria', 'الإسكندرية'], ['Giza', 'الجيزة'], ['Qalyubia', 'القليوبية'],
      ['Sharqia', 'الشرقية'], ['Dakahlia', 'الدقهلية'], ['Gharbia', 'الغربية'], ['Monufia', 'المنوفية'],
      ['Beheira', 'البحيرة'], ['Kafr El Sheikh', 'كفر الشيخ'], ['Damietta', 'دمياط'], ['Port Said', 'بورسعيد'],
      ['Ismailia', 'الإسماعيلية'], ['Suez', 'السويس'], ['North Sinai', 'شمال سيناء'], ['South Sinai', 'جنوب سيناء'],
      ['Beni Suef', 'بني سويف'], ['Fayoum', 'الفيوم'], ['Minya', 'المنيا'], ['Asyut', 'أسيوط'],
      ['Sohag', 'سوهاج'], ['Qena', 'قنا'], ['Luxor', 'الأقصر'], ['Aswan', 'أسوان'],
      ['Red Sea', 'البحر الأحمر'], ['New Valley', 'الوادي الجديد'], ['Matrouh', 'مطروح']
    ],

    /* Mega Deal (buy 2 → cheapest of every 3 is free …). OFF for ITS.ME — set enabled:true to bring it back. */
    smartSale: { enabled: false, buy: 2, free: 1, secondHalf: { enabled: false, percent: 50 } },

    /* Returns & exchange window in days. null = the store says nothing about returns. */
    returnDays: null,

    /* Payment options shown at checkout.
       `account`: a number shown (with a Copy button) when the option is selected — for transfers. */
    payments: [
      { id: 'cod', title: 'Cash on delivery', desc: 'Pay in cash when your order arrives.' },
      { id: 'card', title: 'Visa / bank card', desc: 'We send you a secure payment link on WhatsApp.' },
      { id: 'instapay', title: 'InstaPay', desc: 'Transfer the total to our number and send us the receipt on WhatsApp.', account: '01228194315' },
      { id: 'wallet', title: 'E-wallet', desc: 'Any e-wallet (Vodafone Cash, Etisalat Cash, Orange Cash…). Transfer to our number and send the receipt on WhatsApp.', account: '01228194315' }
    ]
  },

  /* ---------- checkout ----------
     Order details are sent to this WhatsApp number for confirmation (digits only, with country code). */
  checkout: {
    whatsapp: '201228194315',
    displayNumber: '+20 122 819 4315',
    url: ''
  },

  /* ---------- size charts (cm) ----------
     Empty until the real measurements are added — then link a product with `sizeChart: 'sets'`.
     Template:
       sets: {
         tab: 'Sets', title: 'Set size chart', unit: 'All measurements are in centimeters (cm)',
         columns: ['M', 'L', 'XL', 'XXL'],
         rows: [['Hoodie chest width', 0, 0, 0, 0], ['Hoodie length', 0, 0, 0, 0], ['Pants length', 0, 0, 0, 0]],
         fit: 'Fit: Oversized', note: 'Measurements are garment measurements.'
       }
  */
  sizeCharts: {},

  /* ---------- UI strings ---------- */
  texts: {
    index: 'Index', next: 'Next', back: 'All sets', scroll: 'Scroll to shop',
    cart: 'Cart', cartTitle: 'Your cart', cartEmpty: 'Your cart is empty.',
    addToCart: 'Add to cart', added: 'Added', size: 'Size', color: 'Color', sizeGuide: 'Size guide', viewFront: 'Front', viewBack: 'Back',
    subtotal: 'Subtotal', smartSale: 'Mega Deal', shipping: 'Shipping', total: 'Total', totalEx: 'Total · before shipping',
    free: 'Free', shippingFrom: 'From {n}', shippingTbc: 'Pick your governorate',
    checkout: 'Checkout', confirmOrder: 'Confirm order on WhatsApp', backToCart: 'Back to cart', close: 'Close',
    remove: 'Remove', indexTitle: 'All sets',
    saleHintAdd: 'Mega Deal: add {n} more piece(s) — the cheapest one is free',
    halfApplied: '50% off your second piece applied 🎉',
    hintFirst: 'Add 1 more piece for 50% off the second — add 2 and the cheapest is free',
    hintNextHalf: 'Add 1 more for 50% off the next piece — 2 more for another free one',
    hintFree: 'Add 1 more piece and the cheapest one is free',
    saleApplied: 'Mega Deal — {n} piece(s) free 🎉',
    shipHintAdd: 'Add {n} more for free shipping',
    shipHintDone: 'You get free shipping',
    perkShip: 'Free shipping over {n} · flat {fee} below',
    perkShipZones: 'Shipping {a} {cities} · {b} elsewhere',
    perkReturn: '{d}-day returns & exchange',
    perkSale: 'Mega Deal: 2nd piece 50% off · buy 2 get the 3rd free',
    policies: 'Shipping & payment',
    tabSize: 'Size guide', tabShip: 'Shipping & payment', tabReturn: 'Returns & exchange',
    shipTitle: 'Shipping', payTitle: 'Payment methods', returnTitle: 'Returns & exchange', saleTitle: 'Mega Deal',
    shipFree: 'Free shipping on orders over {n}.',
    shipZone: '{cities}: {fee}.',
    shipRest: 'All other governorates: {fee}.',
    shipFlat: 'Flat {fee} shipping to all governorates.',
    shipAnd: ' & ',
    returnLine1: 'Return or exchange within {d} days only.',
    returnLine2: 'Message us on WhatsApp to start a return or exchange.',
    saleLine1: 'Buy 1, get 50% off the second. Buy 2, get the third free — the cheapest piece of every 3 is on us. Works across every product, automatically in the cart.',
    contact: 'WhatsApp',
    view: 'View', addShort: 'Add', colours: '{n} colours', colour1: '1 colour',
    finderTitle: 'Find your size', finderPh: 'Your weight (kg)', finderGo: 'Check',
    finderRes: '{p} → size {s}', finderLow: 'Our sizes start at {n} kg.', finderHigh: 'Above {n} kg — message us on WhatsApp.',
    cd: ['Days', 'Hours', 'Min', 'Sec'],
    detailsTitle: 'Delivery details', name: 'Full name', phone: 'Phone number', city: 'Governorate', cityPh: 'Select your governorate',
    address: 'Full address', notes: 'Notes (optional)', paymentTitle: 'Payment method',
    required: 'Please fill this in', orderSent: 'Order sent',
    copy: 'Copy', copied: 'Number copied',
    doneTitle: 'Thank you!', doneText: 'We opened WhatsApp with your order details. Send the message and we will confirm your order with you shortly.',
    doneTransfer: 'Transfer the total to {n} and send the receipt in the same chat.',
    doneBtn: 'Continue shopping', reopen: 'Open WhatsApp again',
    orderIntro: 'New order', orderCustomer: 'Customer', orderItems: 'Items', orderPayment: 'Payment',
    orderAddress: 'Address', orderNotes: 'Notes', pieces: 'pcs', oldPrice: 'was'
  },

  motion: { autoplay: true, autoplayDelay: 3400, float: 1, parallax: 1, speed: 1 },

  /* ==========================================================================
     THE SHOP PAGE (what you see when you scroll down under the hero)
     Every text here is editable. Products appear automatically from "products" below.
     Groups marked `feature: true` get their own big section; the rest go in the shop grid.
     ========================================================================== */
  site: {
    nav: [
      { label: 'Shop', target: 'shop' },
      { label: 'Scratch Logo', target: 'scratch' },
      { label: 'New Drop', target: 'drop' },
      { label: 'Size guide', target: 'guides' },
      { label: 'Help', target: 'help' }
    ],
    ticker: ['ITS.ME — Sets, jeans, hoodies, zip-ups, sweaters & jackets', 'Hoodies from EGP 749', 'Sets from EGP 1,299', 'Sizes M → XXL', 'Cash on delivery · Visa · InstaPay · e-wallets', 'Shipping EGP 70 Cairo & Alexandria · EGP 100 elsewhere'],

    deal: {
      eyebrow: 'Limited time',
      title: 'Mega Deal',
      text: 'Two ways to save, applied automatically in your cart — mix any pieces you like.',
      cards: [
        { tag: 'Deal 01', big: '50', unit: '%', title: 'Off the second piece', text: 'Pick any piece, then take a second one at half price.' },
        { tag: 'Deal 02', big: 'FREE', unit: '', title: 'The third piece', text: 'Buy two pieces and the third — the cheapest — is on us.', hot: true }
      ],
      exampleLabel: 'Example',
      free: 'Free',
      note: 'The discount always comes off the cheapest piece.',
      cta: 'Shop the deal'
    },

    shop: { eyebrow: 'The collection', title: 'Shop', sub: 'Sets, jeans, hoodies, zip-ups, sweaters and jackets. Tap any piece to see it up close.', all: 'All' },

    groups: {
      'Scratch Logo Sets': {
        id: 'scratch', feature: true,
        eyebrow: 'The scratch logo',
        title: 'Scratch Logo',
        text: 'The hand-scratched ITS.ME logo, printed on the chest and the leg. Same oversized hoodie, same wide-leg sweatpants — three colours.',
        chips: ['3 sets', 'Hoodie + sweatpants', 'M → XXL']
      }
    },

    guides: { eyebrow: 'Fit', title: 'Size guides', sub: 'All sizes are garment measurements in centimeters.' },

    help: { eyebrow: 'Good to know', title: 'Shipping & payment' },

    drop: {
      enabled: true,
      eyebrow: 'Next up',
      ghost: 'ITS.ME',
      title: 'New drop',
      text: 'More ITS.ME pieces are on the way. Be the first to know the moment they go live.',
      soon: 'Coming soon',
      date: '',                 // e.g. '2026-12-05T18:00:00+02:00' → shows a live countdown. Leave '' for "Coming soon".
      notify: 'Notify me on WhatsApp',
      notifyMsg: 'Hi ITS.ME! Please let me know when the new drop is live.',
      teasers: 0
    },

    credit: { text: 'Designed and developed by', name: 'Mohanned', whatsapp: '201152353541', message: 'Hi Mohanned, I saw your work on the ITS.ME website and would like to talk.' },
    footer: { text: 'Oversized sets, hoodies, zip-ups, sweaters and jackets, built to be lived in. Orders are confirmed on WhatsApp.', rights: 'All rights reserved.' }
  },

  /* ==========================================================================
     PRODUCTS
     - Order here = order in the site. `group` makes the headings in the Index.
     - `price` is what the customer pays, `oldPrice` (optional) is shown crossed out.
     - الصور دلوقتي PNG/WebP بخلفية شفافة (مقصوصة). `back` = صورة الضهر (بتظهر لما السيت يلف).
       لو حطيت صورة كارت كاملة (مش مقصوصة) ضيف `photo: true` للمنتج. `thumb` = الصورة الصغيرة في السلة.
     - `sizes: []` hides the size picker.  `sizeChart` links the size guide.
     ========================================================================== */
  products: [
    /* ---------------- Signature sets — 1,299 (was 1,499) ---------------- */
    {
      id: "ash-set", group: "Signature Sets",
      name: "Ash Set", category: "Signature set",
      eyebrow: "Hoodie + wide-leg sweatpants",
      description: "Heather-grey oversized hoodie with matching wide-leg sweatpants. Soft fleece, drop shoulders and a small ITS.ME chest print.",
      price: 1299, oldPrice: 1499,
      ghost: "ASH", accent: "#9a9ca0",
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Heather grey", hex: "#aeaeb0", image: "assets/products/set-ash.webp", thumb: "assets/products/thumbs/set-ash.webp" }
      ]
    },
    {
      id: "noir-set", group: "Signature Sets",
      name: "Noir Set", category: "Signature set",
      eyebrow: "Hoodie + wide-leg sweatpants",
      description: "The all-black set. Oversized hoodie and wide-leg sweatpants in soft fleece, with a small ITS.ME chest print.",
      price: 1299, oldPrice: 1499,
      ghost: "NOIR", accent: "#c4242c",
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Black", hex: "#17171a", image: "assets/products/set-noir.webp", thumb: "assets/products/thumbs/set-noir.webp" }
      ]
    },
    {
      id: "merlot-set", group: "Signature Sets",
      name: "Merlot Set", category: "Signature set",
      eyebrow: "Hoodie + wide-leg sweatpants",
      description: "Deep burgundy oversized hoodie with matching wide-leg sweatpants. Soft fleece and a small ITS.ME chest print.",
      price: 1299, oldPrice: 1499,
      ghost: "MERLOT", accent: "#a3283f",
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Burgundy", hex: "#6e1a2a", image: "assets/products/set-merlot.webp", thumb: "assets/products/thumbs/set-merlot.webp" }
      ]
    },
    {
      id: "storm-set", group: "Signature Sets",
      name: "Storm Set", category: "Signature set",
      eyebrow: "Hoodie + wide-leg sweatpants",
      description: "Slate blue-grey oversized hoodie with matching wide-leg sweatpants. Soft fleece and a small ITS.ME chest print.",
      price: 1299, oldPrice: 1499,
      ghost: "STORM", accent: "#566684",
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Slate blue", hex: "#4d566a", image: "assets/products/set-storm.webp", thumb: "assets/products/thumbs/set-storm.webp" }
      ]
    },
    {
      id: "plum-set", group: "Signature Sets",
      name: "Plum Set", category: "Signature set",
      eyebrow: "Hoodie + wide-leg sweatpants",
      description: "Muted plum oversized hoodie with matching wide-leg sweatpants. Soft fleece and a small ITS.ME chest print.",
      price: 1299, oldPrice: 1499,
      ghost: "PLUM", accent: "#8a5a6e",
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Plum", hex: "#6b4e58", image: "assets/products/set-plum.webp", thumb: "assets/products/thumbs/set-plum.webp" }
      ]
    },
    /* ---------------- Scratch logo sets — 1,399 (was 1,599) ---------------- */
    {
      id: "shadow-set", group: "Scratch Logo Sets",
      name: "Shadow Set", category: "Scratch logo set",
      eyebrow: "Hoodie + wide-leg sweatpants",
      description: "Black oversized hoodie and wide-leg sweatpants with the scratch-style ITS.ME logo on the chest and the leg.",
      price: 1399, oldPrice: 1599,
      ghost: "SHADOW", accent: "#c4242c",
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Black", hex: "#1b1b1c", image: "assets/products/set-shadow.webp", thumb: "assets/products/thumbs/set-shadow.webp" }
      ]
    },
    {
      id: "fog-set", group: "Scratch Logo Sets",
      name: "Fog Set", category: "Scratch logo set",
      eyebrow: "Hoodie + wide-leg sweatpants",
      description: "Light-grey oversized hoodie and wide-leg sweatpants with the scratch-style ITS.ME logo in black on the chest and the leg.",
      price: 1399, oldPrice: 1599,
      ghost: "FOG", accent: "#b9b9b4",
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Light grey", hex: "#bab8b2", image: "assets/products/set-fog.webp", thumb: "assets/products/thumbs/set-fog.webp" }
      ]
    },
    {
      id: "abyss-set", group: "Scratch Logo Sets",
      name: "Abyss Set", category: "Scratch logo set",
      eyebrow: "Hoodie + wide-leg sweatpants",
      description: "Navy oversized hoodie and wide-leg sweatpants with the scratch-style ITS.ME logo in white on the chest and the leg.",
      price: 1399, oldPrice: 1599,
      ghost: "ABYSS", accent: "#2f5d9a",
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Navy", hex: "#2f4663", image: "assets/products/set-abyss.webp", thumb: "assets/products/thumbs/set-abyss.webp" }
      ]
    },
    /* ---------------- Zip-ups, hoodies, sweaters & jackets — one card per design, the colours are swatches ---------------- */
    {
      id: "fake-friends-zip", group: "Zip-ups",
      name: "Fake Friends Zip-up", category: "Zip-up hoodie",
      eyebrow: "Oversized full-zip hoodie",
      description: "Oversized full-zip hoodie in heavy fleece. Small FAKE FRIENDS print on the chest and a big statement print on the back. Available in red, black and grey.",
      price: 760,
      ghost: "FAKE FRIENDS", accent: "#e2262d", scale: 0.9, colorAccent: true,
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Red", hex: "#d4101f", image: "assets/products/zip-fake-red.webp", back: "assets/products/zip-fake-red-back.webp", thumb: "assets/products/thumbs/zip-fake-red.webp" },
        { name: "Black", hex: "#18181a", image: "assets/products/zip-fake-black.webp", back: "assets/products/zip-fake-black-back.webp", thumb: "assets/products/thumbs/zip-fake-black.webp" },
        { name: "Grey", hex: "#b5b5b8", image: "assets/products/zip-fake-grey.webp", back: "assets/products/zip-fake-grey-back.webp", thumb: "assets/products/thumbs/zip-fake-grey.webp" }
      ]
    },
    {
      id: "aerlings-zip", group: "Zip-ups",
      name: "Aerlings Zip-up", category: "Zip-up hoodie",
      eyebrow: "Oversized full-zip hoodie",
      description: "Burgundy oversized full-zip hoodie in soft fleece with a fine white script print on the chest.",
      price: 760,
      ghost: "AERLINGS", accent: "#8e1b3d", scale: 0.9,
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Burgundy", hex: "#6b1330", image: "assets/products/zip-aerlings.webp", thumb: "assets/products/thumbs/zip-aerlings.webp" }
      ]
    },
    {
      id: "covey-hoodie", group: "Hoodies",
      name: "Covey Hoodie", category: "Oversized hoodie",
      eyebrow: "Oversized hoodie",
      description: "Black oversized hoodie with a big felt-style script print on the chest and a front pocket.",
      price: 750,
      ghost: "COVEY", accent: "#8c8c92", scale: 0.9,
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Black", hex: "#17171a", image: "assets/products/hoodie-covey.webp", thumb: "assets/products/thumbs/hoodie-covey.webp" }
      ]
    },
    {
      id: "ride-hoodie", group: "Hoodies",
      name: "Ride Hoodie", category: "Oversized hoodie",
      eyebrow: "Oversized hoodie",
      description: "Oversized hoodie with a small ITS.ME chest print and the colourful \"Every ride is a new adventure\" print on the back. Available in cyan, black and teal.",
      price: 750,
      ghost: "RIDE", accent: "#13c4dc", scale: 0.9, colorAccent: true,
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Cyan", hex: "#13c4dc", image: "assets/products/hoodie-ride-cyan.webp", back: "assets/products/hoodie-ride-cyan-back.webp", thumb: "assets/products/thumbs/hoodie-ride-cyan.webp" },
        { name: "Black", hex: "#17171a", image: "assets/products/hoodie-ride-black.webp", back: "assets/products/hoodie-ride-black-back.webp", thumb: "assets/products/thumbs/hoodie-ride-black.webp" },
        { name: "Teal", hex: "#0f5a68", image: "assets/products/hoodie-ride-teal.webp", back: "assets/products/hoodie-ride-teal-back.webp", thumb: "assets/products/thumbs/hoodie-ride-teal.webp" }
      ]
    },
    {
      id: "dream-hoodie", group: "Hoodies",
      name: "Dream Hoodie", category: "Oversized hoodie",
      eyebrow: "Oversized hoodie",
      description: "Oversized hoodie with a small ITS.ME chest print and the \"Man struggles upwards — Dream\" statue-collage print on the back. Available in black and brown.",
      price: 750,
      ghost: "DREAM", accent: "#8c8c92", scale: 0.9, colorAccent: true,
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Black", hex: "#17171a", image: "assets/products/hoodie-dream-black.webp", back: "assets/products/hoodie-dream-black-back.webp", thumb: "assets/products/thumbs/hoodie-dream-black.webp" },
        { name: "Brown", hex: "#3a231d", image: "assets/products/hoodie-dream-brown.webp", back: "assets/products/hoodie-dream-brown-back.webp", thumb: "assets/products/thumbs/hoodie-dream-brown.webp" }
      ]
    },
    {
      id: "mjgonzales-hoodie", group: "Hoodies",
      name: "Mjgonzales Hoodie", category: "Oversized hoodie",
      eyebrow: "Oversized hoodie",
      description: "Oversized hoodie with a hand-scratched ITS.ME chest print and a gothic-lettering horses print on the back. Available in black and brown.",
      price: 750,
      ghost: "MJGONZALES", accent: "#d9c9ad", scale: 0.9, colorAccent: true,
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Black", hex: "#17171a", image: "assets/products/hoodie-mjgonzales-black.webp", back: "assets/products/hoodie-mjgonzales-black-back.webp", thumb: "assets/products/thumbs/hoodie-mjgonzales-black.webp" },
        { name: "Brown", hex: "#3a231d", image: "assets/products/hoodie-mjgonzales-brown.webp", back: "assets/products/hoodie-mjgonzales-brown-back.webp", thumb: "assets/products/thumbs/hoodie-mjgonzales-brown.webp" }
      ]
    },
    {
      id: "palm-hoodie", group: "Hoodies",
      name: "Palm Hoodie", category: "Oversized hoodie",
      eyebrow: "Oversized hoodie",
      description: "Oversized hoodie with a small palm chest print and a travel-themed palm, surfboard and car print on the back. Available in black, heather grey and washed navy.",
      price: 750,
      ghost: "PALM", accent: "#b98a5e", scale: 0.9, colorAccent: true,
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Black", hex: "#17171a", image: "assets/products/hoodie-palm-black.webp", back: "assets/products/hoodie-palm-black-back.webp", thumb: "assets/products/thumbs/hoodie-palm-black.webp" },
        { name: "Heather grey", hex: "#b8b8ba", image: "assets/products/hoodie-palm-grey.webp", back: "assets/products/hoodie-palm-grey-back.webp", thumb: "assets/products/thumbs/hoodie-palm-grey.webp" },
        { name: "Washed navy", hex: "#34435f", image: "assets/products/hoodie-palm-navy.webp", back: "assets/products/hoodie-palm-navy-back.webp", thumb: "assets/products/thumbs/hoodie-palm-navy.webp" }
      ]
    },
    {
      id: "courtside-hoodie", group: "Hoodies",
      name: "Courtside Hoodie", category: "Oversized hoodie",
      eyebrow: "Oversized hoodie",
      description: "Oversized hoodie with a bold white and gold varsity-lettering print on the chest. Available in black, navy and royal blue.",
      price: 750,
      ghost: "COURTSIDE", accent: "#e8a017", scale: 0.9,
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Black", hex: "#141416", image: "assets/products/hoodie-courtside-black.webp", thumb: "assets/products/thumbs/hoodie-courtside-black.webp" },
        { name: "Navy", hex: "#3f4660", image: "assets/products/hoodie-courtside-navy.webp", back: "assets/products/hoodie-courtside-navy-back.webp", thumb: "assets/products/thumbs/hoodie-courtside-navy.webp" },
        { name: "Royal blue", hex: "#1c40b4", image: "assets/products/hoodie-courtside-blue.webp", back: "assets/products/hoodie-courtside-blue-back.webp", thumb: "assets/products/thumbs/hoodie-courtside-blue.webp" }
      ]
    },
    {
      id: "spider-cream", group: "Hoodies",
      name: "Spider Cream", category: "Oversized hoodie",
      eyebrow: "Oversized hoodie",
      description: "Cream oversized hoodie with an all-over web pattern, red embroidered SPIDER lettering on the chest, red tribal prints on both sleeves and a big red embroidered spider emblem on the back.",
      price: 895,
      ghost: "SPIDER", accent: "#c4242c", scale: 0.9,
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Cream", hex: "#d9d4cb", image: "assets/products/hoodie-spider-cream.webp", back: "assets/products/hoodie-spider-cream-back.webp", thumb: "assets/products/thumbs/hoodie-spider-cream.webp" }
      ]
    },
    {
      id: "block-hoodie", group: "Hoodies",
      name: "Red Block Hoodie", category: "Oversized hoodie",
      eyebrow: "Colour-block hoodie",
      description: "Red and black colour-block hoodie in heavy fleece with a small chest patch, a kangaroo pocket and a huge lettering print across the back and sleeves.",
      price: 749,
      ghost: "BLOCK", accent: "#e2262d", scale: 0.9,
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Red / Black", hex: "#d4102a", image: "assets/products/hoodie-block-red.webp", back: "assets/products/hoodie-block-red-back.webp", thumb: "assets/products/thumbs/hoodie-block-red.webp" }
      ]
    },
    {
      id: "forest-zip", group: "Zip-ups",
      name: "Forest Zip-up", category: "Zip-up hoodie",
      eyebrow: "Oversized full-zip hoodie",
      description: "Forest green oversized full-zip hoodie with sprayed pale-blue seam details, white rope drawcords and a bold embroidered back print.",
      price: 895,
      ghost: "FOREST", accent: "#2f7a5a", scale: 0.9,
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Forest green", hex: "#1f4a3a", image: "assets/products/zip-forest.webp", back: "assets/products/zip-forest-back.webp", thumb: "assets/products/thumbs/zip-forest.webp" }
      ]
    },
    {
      id: "drip-zip", group: "Zip-ups",
      name: "Drip Zip-up", category: "Zip-up hoodie",
      eyebrow: "Oversized full-zip hoodie",
      description: "Oversized full-zip hoodie with a dripping logo on the chest and a huge drip lettering print across the back and sleeves. Available in heather grey and teal.",
      price: 895,
      ghost: "DRIP", accent: "#8c8c92", scale: 0.9, colorAccent: true,
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Heather grey", hex: "#b9b9bb", image: "assets/products/zip-drip-grey.webp", back: "assets/products/zip-drip-grey-back.webp", thumb: "assets/products/thumbs/zip-drip-grey.webp" },
        { name: "Teal", hex: "#0f5a52", image: "assets/products/zip-drip-teal.webp", back: "assets/products/zip-drip-teal-back.webp", thumb: "assets/products/thumbs/zip-drip-teal.webp" }
      ]
    },
    {
      id: "script-sweater", group: "Sweaters",
      name: "Script Sweater", category: "Sweater",
      eyebrow: "Soft fuzzy knit",
      description: "Oversized fuzzy-knit sweater with a large white script print across the chest. Soft, warm and light. Available in navy and sand.",
      price: 899,
      ghost: "SCRIPT", accent: "#3b5486", scale: 0.9, colorAccent: true,
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Navy", hex: "#243553", image: "assets/products/sweater-script-navy.webp", thumb: "assets/products/thumbs/sweater-script-navy.webp" },
        { name: "Sand", hex: "#b8a58a", image: "assets/products/sweater-script-sand.webp", thumb: "assets/products/thumbs/sweater-script-sand.webp" }
      ]
    },
    {
      id: "web-zip", group: "Zip-ups",
      name: "Web Zip-up", category: "Zip-up hoodie",
      eyebrow: "Oversized full-zip hoodie",
      description: "Black oversized full-zip hoodie with an all-over web pattern, a big white spider emblem on the chest and a tribal print on the sleeve.",
      price: 899,
      ghost: "WEB", accent: "#c4242c", scale: 0.9,
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Black", hex: "#141416", image: "assets/products/zip-web-black.webp", thumb: "assets/products/thumbs/zip-web-black.webp" }
      ]
    },
    {
      id: "raglan-sweater", group: "Sweaters",
      name: "Raglan Sweater", category: "Sweater",
      eyebrow: "Fleece crewneck",
      description: "Fleece crewneck sweater with raglan seams and a stitched detail on the shoulder. Available in black and heather grey.",
      price: 820,
      ghost: "RAGLAN", accent: "#8c8c92", scale: 0.9, colorAccent: true,
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Black", hex: "#17171a", image: "assets/products/sweater-raglan-black.webp", thumb: "assets/products/thumbs/sweater-raglan-black.webp" },
        { name: "Heather grey", hex: "#8f9298", image: "assets/products/sweater-raglan-grey.webp", thumb: "assets/products/thumbs/sweater-raglan-grey.webp" }
      ]
    },
    {
      id: "racer-jacket-blue", group: "Jackets",
      name: "Racer Jacket Blue", category: "Jacket",
      eyebrow: "Racing bomber",
      description: "White, royal blue and black racing bomber with a double zip, ribbed collar and cuffs, big lettering and patches on the front and sleeves.",
      price: 999,
      ghost: "RACER", accent: "#2a3fd0", scale: 0.9,
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "White / Blue", hex: "#2a3fd0", image: "assets/products/jacket-racer-blue.webp", back: "assets/products/jacket-racer-blue-back.webp", thumb: "assets/products/thumbs/jacket-racer-blue.webp" }
      ]
    },
    {
      id: "track-jacket-grey", group: "Jackets",
      name: "Track Jacket Grey", category: "Jacket",
      eyebrow: "Track jacket",
      description: "Grey and black nylon track jacket with white piping, a stand collar, side pockets and a red embroidered lion print on the chest and back.",
      price: 999,
      ghost: "TRACK", accent: "#8a8a92", scale: 0.9,
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Grey / Black", hex: "#8a8a92", image: "assets/products/jacket-track-grey.webp", back: "assets/products/jacket-track-grey-back.webp", thumb: "assets/products/thumbs/jacket-track-grey.webp" }
      ]
    },
    {
      id: "varsity-jacket-red", group: "Jackets",
      name: "Varsity Jacket Red", category: "Jacket",
      eyebrow: "Varsity bomber",
      description: "Black bomber with red panels and striped ribbing, embroidered patches on the chest and sleeves and a big outlined number on the back.",
      price: 999,
      ghost: "VARSITY", accent: "#e2262d", scale: 0.9,
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Black / Red", hex: "#17171a", image: "assets/products/jacket-varsity-red.webp", back: "assets/products/jacket-varsity-red-back.webp", thumb: "assets/products/thumbs/jacket-varsity-red.webp" }
      ]
    },
    {
      id: "bomber-navy", group: "Jackets",
      name: "Bomber Navy", category: "Jacket",
      eyebrow: "Classic bomber",
      description: "Plain navy bomber jacket with a ribbed collar and cuffs, side pockets and a zip pocket on the sleeve.",
      price: 999,
      ghost: "BOMBER", accent: "#2a3b66", scale: 0.9,
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Navy", hex: "#2a3b66", image: "assets/products/jacket-bomber-navy.webp", thumb: "assets/products/thumbs/jacket-bomber-navy.webp" }
      ]
    },
    /* ---------------- Jeans (800s) + new hoodies, zip-ups & jackets ---------------- */
    {
      id: "wide-jeans", group: "Jeans",
      name: "Wide Leg Jeans", category: "Jeans",
      eyebrow: "Baggy wide-leg jeans",
      description: "Light-wash baggy jeans with a wide leg that stacks on the shoe, a high waist and classic five-pockets.",
      price: 799,
      ghost: "WIDE", accent: "#8fb3d9", scale: 0.95,
      sizes: ['30', '32', '34', '36', '38', '40'],
      colors: [
        { name: "Light blue", hex: "#a9c3e0", image: "assets/products/jeans-wide-blue.webp", back: "assets/products/jeans-wide-blue-back.webp", thumb: "assets/products/thumbs/jeans-wide-blue.webp" }
      ]
    },
    {
      id: "twist-jeans", group: "Jeans",
      name: "Twist Jeans", category: "Jeans",
      eyebrow: "Curved-seam straight jeans",
      description: "Straight-leg jeans with curved front seams, a high waist and a stone-washed finish. Available in four washes.",
      price: 820,
      ghost: "TWIST", accent: "#3f6fa0", scale: 0.95, colorAccent: true,
      sizes: ['30', '32', '34', '36', '38', '40'],
      colors: [
        { name: "Indigo", hex: "#2f5478", image: "assets/products/jeans-twist-indigo.webp", thumb: "assets/products/thumbs/jeans-twist-indigo.webp" },
        { name: "Black", hex: "#15171c", image: "assets/products/jeans-twist-black.webp", thumb: "assets/products/thumbs/jeans-twist-black.webp" },
        { name: "Faded blue", hex: "#9bb6d3", image: "assets/products/jeans-twist-faded.webp", thumb: "assets/products/thumbs/jeans-twist-faded.webp" },
        { name: "Sky blue", hex: "#6fa3d8", image: "assets/products/jeans-twist-sky.webp", thumb: "assets/products/thumbs/jeans-twist-sky.webp" }
      ]
    },
    {
      id: "barrel-jeans", group: "Jeans",
      name: "Barrel Jeans Black", category: "Jeans",
      eyebrow: "Barrel-leg jeans",
      description: "Washed-black barrel-leg jeans with a rounded leg that tapers at the ankle and a high waist.",
      price: 780,
      ghost: "BARREL", accent: "#8a8a90", scale: 0.95,
      sizes: ['30', '32', '33', '34', '36', '38', '40'],
      colors: [
        { name: "Washed black", hex: "#2a2a2d", image: "assets/products/jeans-barrel-black.webp", back: "assets/products/jeans-barrel-black-back.webp", thumb: "assets/products/thumbs/jeans-barrel-black.webp" }
      ]
    },
    {
      id: "straight-black-jeans", group: "Jeans",
      name: "Straight Jeans Black", category: "Jeans",
      eyebrow: "Straight-leg jeans",
      description: "Washed-black straight-leg jeans with a high waist, clean lines and classic five-pockets.",
      price: 780,
      ghost: "STRAIGHT", accent: "#8a8a90", scale: 0.95,
      sizes: ['30', '32', '33', '34', '36', '38', '40'],
      colors: [
        { name: "Washed black", hex: "#232326", image: "assets/products/jeans-straight-black.webp", back: "assets/products/jeans-straight-black-back.webp", thumb: "assets/products/thumbs/jeans-straight-black.webp" }
      ]
    },
    {
      id: "straight-blue-jeans", group: "Jeans",
      name: "Straight Jeans Blue", category: "Jeans",
      eyebrow: "Straight-leg jeans",
      description: "Mid-blue straight-leg jeans with whiskering and a soft fade, a high waist and classic five-pockets.",
      price: 780,
      ghost: "CLASSIC", accent: "#2f5fa8", scale: 0.95,
      sizes: ['30', '32', '33', '34', '36', '38', '40'],
      colors: [
        { name: "Mid blue", hex: "#2c4f86", image: "assets/products/jeans-straight-blue.webp", back: "assets/products/jeans-straight-blue-back.webp", thumb: "assets/products/thumbs/jeans-straight-blue.webp" }
      ]
    },
    {
      id: "chain-jeans", group: "Jeans",
      name: "Chain Jeans", category: "Jeans",
      eyebrow: "Wide-leg jeans with chain",
      description: "Washed grey-green wide-leg jeans with a silver double chain on the front pocket.",
      price: 780,
      ghost: "CHAIN", accent: "#9aa59a", scale: 0.95,
      sizes: ['30', '32', '33', '34', '36', '38', '40'],
      colors: [
        { name: "Grey", hex: "#9ba39b", image: "assets/products/jeans-chain-grey.webp", back: "assets/products/jeans-chain-grey-back.webp", thumb: "assets/products/thumbs/jeans-chain-grey.webp" }
      ]
    },
    {
      id: "eyes-hoodie", group: "Hoodies",
      name: "All Eyes Hoodie", category: "Oversized hoodie",
      eyebrow: "Oversized hoodie",
      description: "Black oversized hoodie with a small ITS.ME chest print and the big \"All eyes on me\" eye print on the back.",
      price: 750,
      ghost: "EYES", accent: "#e2262d", scale: 0.9,
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Black", hex: "#17171a", image: "assets/products/hoodie-eyes-black.webp", back: "assets/products/hoodie-eyes-black-back.webp", thumb: "assets/products/thumbs/hoodie-eyes-black.webp" }
      ]
    },
    {
      id: "leather-jacket", group: "Jackets",
      name: "Vintage Leather Jacket", category: "Jacket",
      eyebrow: "Leather bomber",
      description: "Dark-brown vintage-wash leather bomber with a collar, a silver front zip and ribbed hem and cuffs.",
      price: 1450,
      ghost: "LEATHER", accent: "#6b4a3a", scale: 0.9,
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Dark brown", hex: "#3a2a24", image: "assets/products/jacket-leather-brown.webp", back: "assets/products/jacket-leather-brown-back.webp", thumb: "assets/products/thumbs/jacket-leather-brown.webp" }
      ]
    },
    {
      id: "collegiate-zip", group: "Zip-ups",
      name: "Collegiate Zip-up", category: "Zip-up hoodie",
      eyebrow: "Oversized full-zip hoodie",
      description: "Petrol-blue oversized full-zip hoodie in heavy fleece with a big appliqu\u00e9 varsity print on the chest, white rope drawcords with tassels and a kangaroo pocket.",
      price: 850,
      ghost: "COLLEGIATE", accent: "#1e6a8f", scale: 0.9,
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Petrol blue", hex: "#12607f", image: "assets/products/zip-collegiate-blue.webp", thumb: "assets/products/thumbs/zip-collegiate-blue.webp" }
      ]
    },
    {
      id: "gothic-zip", group: "Zip-ups",
      name: "Gothic Zip-up", category: "Zip-up hoodie",
      eyebrow: "Oversized full-zip hoodie",
      description: "Burgundy oversized full-zip hoodie with a gothic-lettering print on the chest, a vertical lettering print down the back and white tassel drawcords.",
      price: 850,
      ghost: "GOTHIC", accent: "#a3283f", scale: 0.9,
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Burgundy", hex: "#5e1424", image: "assets/products/zip-gothic-maroon.webp", back: "assets/products/zip-gothic-maroon-back.webp", thumb: "assets/products/thumbs/zip-gothic-maroon.webp" }
      ]
    },
    {
      id: "puffer-jacket", group: "Jackets",
      name: "Puffer Jacket", category: "Jacket",
      eyebrow: "Down-feel puffer",
      description: "Oversized puffer jacket with a stand collar, snap-over zip, two zip pockets, a metal plate on the chest and drawcord hem. Available in black, white and green.",
      price: 1199,
      ghost: "PUFFER", accent: "#7a9a2a", scale: 0.9, colorAccent: true,
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Black", hex: "#17171a", image: "assets/products/jacket-puffer-black.webp", thumb: "assets/products/thumbs/jacket-puffer-black.webp" },
        { name: "White", hex: "#f2f2f2", image: "assets/products/jacket-puffer-white.webp", thumb: "assets/products/thumbs/jacket-puffer-white.webp" },
        { name: "Green", hex: "#7d9a1e", image: "assets/products/jacket-puffer-green.webp", thumb: "assets/products/thumbs/jacket-puffer-green.webp" }
      ]
    },
    {
      id: "stripe-hoodie", group: "Hoodies",
      name: "Stripe Hoodie", category: "Oversized hoodie",
      eyebrow: "Oversized hoodie",
      description: "Oversized hoodie in heavy fleece with triple stripes down both sleeves, a big outlined chest print and a kangaroo pocket. Available in chocolate and heather grey.",
      price: 780,
      ghost: "STRIPE", accent: "#6a3e30", scale: 0.9, colorAccent: true,
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: [
        { name: "Chocolate", hex: "#3b2420", image: "assets/products/hoodie-stripe-brown.webp", thumb: "assets/products/thumbs/hoodie-stripe-brown.webp" },
        { name: "Heather grey", hex: "#b9b9bb", image: "assets/products/hoodie-stripe-grey.webp", thumb: "assets/products/thumbs/hoodie-stripe-grey.webp" }
      ]
    }
  ]
};

/* ==========================================================================
   كل لون = كارت لوحده.
   اكتب المنتج في "products" بألوانه زي ما هو (colors: [..])، والسطور دي بتفصل كل لون
   في منتج مستقل (اسمه + اللون، صورته، ثمبنيله، ومقاساته) من غير ما تعدّل حاجة.
   ========================================================================== */
(function () {
  const out = [];
  window.SITE.products.forEach((p) => {
    p.baseId = p.id;
    if (!p.colors || p.colors.length < 2) { p.colorKey = p.colors && p.colors[0] ? p.colors[0].name : ''; out.push(p); return; }
    p.colors.forEach((c) => {
      const q = Object.assign({}, p, { colors: [Object.assign({}, c)] });
      q.id = p.id + '-' + c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      q.colorKey = c.name;
      q.name = p.name + ' ' + c.name;
      q.description = String(p.description || '').replace(/\s*Available in [^.]*\./i, '').trim();
      q.accent = p.colorAccent ? c.hex : p.accent;
      out.push(q);
    });
  });
  window.SITE.products = out;
})();
