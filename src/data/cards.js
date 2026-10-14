// Kismet = the parrot astrologer's fortune cards. Rishtedaar = what the relatives bring.
// action types: gain, pay, kitty, collectAll, payAll, bail, jail, goto, back, nearestTransport, repairs

export const KISMET = [
  { id: 'k1', icon: '🦈', title: 'Shark Tank Deal!', text: 'The Sharks loved your masala-chai subscription box and bought 10% of it.', action: { type: 'gain', amount: 250000 } },
  { id: 'k2', icon: '🎟️', title: 'Kerala Lottery Jackpot', text: 'A ticket you bought at a Kochi bus stand actually won.', action: { type: 'gain', amount: 200000 } },
  { id: 'k3', icon: '🚨', title: 'Traffic Challan', text: 'No helmet, wrong side, and you argued with the havaldar. The fine goes into the Gullak.', action: { type: 'kitty', amount: 15000 } },
  { id: 'k4', icon: '💍', title: 'Palace Wedding Invite', text: 'Your best friend is getting married at an Udaipur palace. Flights, sherwani and a gift.', action: { type: 'pay', amount: 100000 } },
  { id: 'k5', icon: '🏏', title: 'Fantasy Cricket Winner', text: 'Your captain hit a last-ball six in the IPL final.', action: { type: 'gain', amount: 200000 } },
  { id: 'k6', icon: '🚗', title: 'Silk Board Jam', text: 'Four hours stuck at Silk Board junction. You missed your flight.', action: { type: 'pay', amount: 20000 } },
  { id: 'k7', icon: '🕶️', title: 'VIP Bail Pass', text: 'A very well-connected neta owes you a favour. Get out of Tihar free. Keep it until you need it.', action: { type: 'bail' } },
  { id: 'k8', icon: '✈️', title: 'Airport Land Boom', text: 'Your plot next to the new international airport tripled in value overnight.', action: { type: 'gain', amount: 180000 } },
  { id: 'k9', icon: '📉', title: 'WhatsApp Stock Tip', text: 'Uncle forwarded a “guaranteed multibagger”. It was not guaranteed.', action: { type: 'pay', amount: 40000 } },
  { id: 'k10', icon: '🪔', title: 'Shubh Muhurat!', text: 'The panditji says the timing is perfect. Advance to START and collect Shagun.', action: { type: 'goto', tile: 0 } },
  { id: 'k11', icon: '⚖️', title: 'ED Raid!', text: 'Investigators found cash in your false ceiling. Go straight to Tihar Jail without passing START.', action: { type: 'jail' } },
  { id: 'k12', icon: '🚆', title: 'Tatkal Ticket Confirmed', text: 'You got a Tatkal seat in 4 seconds. Advance to the next Rail & Metro tile. If someone owns it, pay double rent.', action: { type: 'nearestTransport' } },
  { id: 'k13', icon: '↩️', title: 'Wrong-Side U-Turn', text: 'Missed your expressway exit. Go back 3 spaces.', action: { type: 'back', steps: 3 } },
  { id: 'k14', icon: '🚄', title: 'Board the Vande Bharat', text: 'Advance to Vande Bharat Express. Collect Shagun if you pass START.', action: { type: 'goto', tile: 5 } },
  { id: 'k15', icon: '💎', title: "Chai on Billionaires' Row", text: "You've been invited for chai on Altamount Road. Advance there.", action: { type: 'goto', tile: 39 } },
  { id: 'k16', icon: '🌧️', title: 'Monsoon Leakage', text: 'The monsoon found every crack in your roofs. Pay ₹25,000 per building and ₹1,00,000 per Haveli.', action: { type: 'repairs', perLevel: 25000, perHaveli: 100000 } },
  { id: 'k17', icon: '🪙', title: 'Gold Hits Record High', text: "Dadi's old gold bangles are suddenly worth a fortune.", action: { type: 'gain', amount: 150000 } },
  { id: 'k18', icon: '📱', title: 'Your Reel Went Viral', text: 'Your baraat dance hit 30 million views and a brand came calling.', action: { type: 'gain', amount: 100000 } },
  { id: 'k19', icon: '🎒', title: 'Nursery Admission', text: 'The playschool wants a “building fund donation” for your toddler. It goes into the Gullak.', action: { type: 'kitty', amount: 60000 } },
  { id: 'k20', icon: '🌅', title: 'Sunset on Marine Drive', text: "A walk along the Queen's Necklace. Advance to Marine Drive.", action: { type: 'goto', tile: 34 } },
];

export const RISHTEDAAR = [
  { id: 'r1', icon: '🪔', title: 'Diwali Bonus', text: 'The boss handed out a bumper bonus with a box of kaju katli.', action: { type: 'gain', amount: 125000 } },
  { id: 'r2', icon: '💌', title: 'Beta, Shaadi Kab?', text: "Aunty hired a matchmaker for you without asking. You're paying the fee.", action: { type: 'pay', amount: 25000 } },
  { id: 'r3', icon: '🧳', title: 'Mausi Arrives Unannounced', text: 'With 6 suitcases, 4 cousins and a 3-week plan. Hospitality costs add up.', action: { type: 'pay', amount: 35000 } },
  { id: 'r4', icon: '🏆', title: "Sharma Ji's Son Cleared UPSC", text: 'Your mother made you sponsor ladoos for the whole colony.', action: { type: 'pay', amount: 30000 } },
  { id: 'r5', icon: '👵', title: "Nani's FD Matured", text: 'A 10-year post office fixed deposit, interest and all. Nani says spend it wisely.', action: { type: 'gain', amount: 175000 } },
  { id: 'r6', icon: '🤝', title: 'Cousin Needs a Loan', text: '“Just for two days, bhai.” It has been two years.', action: { type: 'pay', amount: 40000 } },
  { id: 'r7', icon: '🏢', title: 'Housing Society Fine', text: "You parked in the secretary's spot again. The fine goes into the Gullak.", action: { type: 'kitty', amount: 10000 } },
  { id: 'r8', icon: '👶', title: 'Naamkaran Shagun', text: "It's your baby's naming ceremony! Collect ₹25,000 shagun from every player.", action: { type: 'collectAll', amount: 25000 } },
  { id: 'r9', icon: '💃', title: 'Sangeet Season', text: 'Three cousins are getting married this winter. Give ₹20,000 shagun to every player.', action: { type: 'payAll', amount: 20000 } },
  { id: 'r10', icon: '📜', title: 'Lawyer Chacha', text: 'Your advocate uncle got you anticipatory bail. Get out of Tihar free.', action: { type: 'bail' } },
  { id: 'r11', icon: '📈', title: 'SIP Ki Shakti', text: 'Your boring monthly SIP compounded into something beautiful.', action: { type: 'gain', amount: 200000 } },
  { id: 'r12', icon: '🐍', title: 'Naagin Dance Injury', text: 'You tried the naagin dance at the baraat. The physio bill has arrived.', action: { type: 'pay', amount: 15000 } },
  { id: 'r13', icon: '🌾', title: 'Ancestral Land Sold', text: "The family finally agreed on Dadaji's farmland. Here's your share.", action: { type: 'gain', amount: 150000 } },
  { id: 'r14', icon: '🎨', title: 'Diwali Safai', text: 'Whitewash and putty for every property. Pay ₹15,000 per building and ₹60,000 per Haveli.', action: { type: 'repairs', perLevel: 15000, perHaveli: 60000 } },
  { id: 'r15', icon: '☕', title: 'Chai Break!', text: 'Advance to Jugaad Junction and claim the Gullak jackpot.', action: { type: 'goto', tile: 20 } },
  { id: 'r16', icon: '📑', title: 'CA Found a “Small Issue”', text: "Your chartered accountant found a problem in last year's return.", action: { type: 'pay', amount: 45000 } },
  { id: 'r17', icon: '🥭', title: 'Nani Ka Achaar Goes Viral', text: "Grandma's mango pickle now ships across the country.", action: { type: 'gain', amount: 80000 } },
  { id: 'r18', icon: '🗳️', title: 'Chacha Won the Society Election', text: 'Every player pays you ₹10,000 “for goodwill”.', action: { type: 'collectAll', amount: 10000 } },
  { id: 'r19', icon: '🛕', title: 'Yatra Refund', text: 'Your pilgrimage tour refunded a cancelled leg.', action: { type: 'gain', amount: 30000 } },
  { id: 'r20', icon: '🎂', title: 'Birthday Bash at Yours', text: 'A rooftop party for the whole gang. Pay each player ₹15,000.', action: { type: 'payAll', amount: 15000 } },
];

export const DECKS = {
  kismet: { name: 'Kismet', subtitle: 'Tota-wala Jyotish', cards: KISMET },
  rishtedaar: { name: 'Rishtedaar', subtitle: 'Family Surprises', cards: RISHTEDAAR },
};
