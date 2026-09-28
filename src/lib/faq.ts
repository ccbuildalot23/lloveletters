/** FAQ content (10.6, 14.2 FAQPage). Plain text answers so they can be used in JSON-LD; HTML version is rendered in the page. */
export const faqSections: Array<{
  id: string;
  title: string;
  items: Array<{ q: string; a: string }>;
}> = [
  {
    id: 'shipping',
    title: 'Shipping & delivery',
    items: [
      {
        q: 'How long does shipping take?',
        a: 'Most rugs ship from Turkey within 2 business days and arrive in 5–10 business days by insured express courier. Oversize rugs (9×12 and up) can take a few days longer. You get a tracking link by email the moment it ships.',
      },
      {
        q: 'Do you ship outside the US?',
        a: 'Not yet. Every price on the site includes duties and shipping to any US address, and the whole model is built around that. If you’re outside the US, email me and I’ll tell you honestly whether it’s worth it.',
      },
    ],
  },
  {
    id: 'duties',
    title: 'Duties & tariffs',
    items: [
      {
        q: 'Are duties and tariffs really included?',
        a: 'Yes. The price you see is the price you pay. I prepay all US import duties, tariffs, and customs fees, so nothing is collected at your door. If policy changes raise the cost of a rug already sold to you, that is my problem, not yours.',
      },
      {
        q: 'Will I get a customs bill?',
        a: 'No. Shipments go out as Delivered Duty Paid. If a carrier ever asks you for a fee, don’t pay it: text me and I’ll sort it out.',
      },
    ],
  },
  {
    id: 'returns',
    title: 'Returns',
    items: [
      {
        q: 'What is the return policy?',
        a: 'You have 30 days from delivery to live with a rug. If it isn’t right, start a return from the returns page and send it back in its original condition. Refunds go out within 5 business days of the rug arriving back. Return shipping is [CHOOSE: deducted from the refund at cost / free].',
      },
      {
        q: 'What if the rug isn’t what you described?',
        a: 'If an independent appraiser finds that a rug isn’t what I described, I refund you in full, including return shipping. That is the guarantee, in writing, on every product page.',
      },
    ],
  },
  {
    id: 'authenticity',
    title: 'Authenticity',
    items: [
      {
        q: 'How do I know a rug is hand-knotted?',
        a: 'Flip it. On a hand-knotted rug the back shows the pattern clearly and each knot is a small, slightly irregular square. Machine-made rugs show a uniform grid or a plastic-looking backing. I film the back of every rug and put the video on its page.',
      },
      {
        q: 'Is anything you sell silk?',
        a: 'Only if the product page says so in the fiber content. Most “silk” rugs sold to tourists are viscose (art silk). I burn-test a fringe fiber on anything that claims to be silk; if it smells like paper, it isn’t.',
      },
      {
        q: 'What does the certificate mean?',
        a: 'Each rug has a signed certificate with a unique ID that matches its page. It records size, fibers, dyes, region, age, and condition as I verified them, plus my signature. It is a record of what I checked, not a magic word.',
      },
    ],
  },
  {
    id: 'sizing',
    title: 'Sizing',
    items: [
      {
        q: 'What size rug do I need?',
        a: 'Living room: at least the front legs of the sofa and chairs on the rug, usually 8×10 or 9×12. Dining: all chair legs on the rug even when pulled out, usually 8×10 for a six-seat table. Bedroom: 8×10 under a queen bed with 2–3 feet showing on each side, or runners on either side. Hallways: a runner 4–6 inches narrower than the hall.',
      },
      {
        q: 'Are the sizes exact?',
        a: 'Yes. Every rug is measured twice and listed to the inch and the centimeter. Hand-knotted rugs are rarely perfect rectangles, so I list the widest and longest points and note any unevenness in the condition notes.',
      },
    ],
  },
  {
    id: 'care',
    title: 'Care',
    items: [
      {
        q: 'How do I clean a wool rug?',
        a: 'Vacuum weekly without the beater bar. Blot spills immediately with a clean cloth and cold water. Rotate the rug twice a year. Every few years, send it to a rug cleaner, not a carpet cleaner. Full details are in the care guide.',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Payments & security',
    items: [
      {
        q: 'How can I pay?',
        a: 'Checkout is handled by Stripe and accepts all major cards, Apple Pay, Google Pay, and, where enabled, Affirm and Klarna for monthly payments. I never see or store your card details.',
      },
      {
        q: 'Is sales tax charged?',
        a: 'Sales tax is calculated at checkout based on your shipping address, where the law requires it.',
      },
    ],
  },
  {
    id: 'investment',
    title: 'Are rugs an investment?',
    items: [
      {
        q: 'Are hand-knotted rugs a good investment?',
        a: 'Honest answer: no, not in the way a financial product is. A good hand-knotted wool rug holds value far better than a machine-made one and can last generations, but buy it because you want to live with it, not because you expect a return.',
      },
    ],
  },
];
export const faqFlat = faqSections.flatMap((s) => s.items);
