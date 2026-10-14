// Nonopoly board: 40 tiles, every one rooted in India.
// rent = [vacant, 1 Tapri, 2 Dhaba, 3 Showroom, 4 Mall, Haveli]

export const START_SALARY = 200000;
export const JAIL_FINE = 50000;
export const JAIL_TILE = 10;
export const STARTING_KITTY = 100000;
export const TRANSPORT_IDS = [5, 15, 25, 35];
export const UTILITY_IDS = [12, 28];

export const GROUPS = {
  brown: { name: 'Purani Dilli', color: '#a0522d', text: '#fff', ids: [1, 3] },
  sky: { name: 'Heritage Trail', color: '#2fb0e8', text: '#fff', ids: [6, 8, 9] },
  pink: { name: 'Shopping Streets', color: '#ee3a8c', text: '#fff', ids: [11, 13, 14] },
  orange: { name: 'Goa Beach Life', color: '#ff8a1a', text: '#fff', ids: [16, 18, 19] },
  red: { name: 'Dilli Power Hubs', color: '#e2323a', text: '#fff', ids: [21, 23, 24] },
  yellow: { name: 'Startup Belt', color: '#f5c000', text: '#3a2400', ids: [26, 27, 29] },
  green: { name: 'Bollywood Mumbai', color: '#1aa85a', text: '#fff', ids: [31, 32, 34] },
  blue: { name: "Billionaires' Row", color: '#3443d0', text: '#fff', ids: [37, 39] },
  transport: { name: 'Rail & Metro', color: '#262033', text: '#fff', ids: TRANSPORT_IDS },
  utility: { name: 'Utilities', color: '#5f7387', text: '#fff', ids: UTILITY_IDS },
};

export const BUILDINGS = [
  { level: 0, name: 'Khaali Plot', short: 'Plot' },
  { level: 1, name: 'Chai Tapri', short: 'Tapri' },
  { level: 2, name: 'Highway Dhaba', short: 'Dhaba' },
  { level: 3, name: 'Swanky Showroom', short: 'Showroom' },
  { level: 4, name: 'Mega Mall', short: 'Mall' },
  { level: 5, name: 'Royal Haveli', short: 'Haveli' },
];

const prop = (id, name, short, city, group, price, rent, houseCost, desc) => ({
  id, name, short, city, group, type: 'property', price, rent, houseCost, mortgage: price / 2, desc,
});

export const TILES = [
  { id: 0, type: 'corner', corner: 'start', name: 'Shubh Aarambh', short: 'START', city: 'Everywhere', desc: 'Every lap round India earns you ₹2,00,000 Shagun from the family elders.' },
  prop(1, 'Chandni Chowk', 'Chandni Chowk', 'Old Delhi', 'brown', 60000, [2000, 10000, 30000, 90000, 160000, 250000], 50000, 'Mughal-era bazaar of jalebis, wedding lehengas and world-class haggling since 1650.'),
  { id: 2, type: 'chance', name: 'Kismet', short: 'Kismet', city: 'Tota-wala Jyotish', desc: 'The parrot astrologer picks your fortune card. Will it be Shark Tank money or a traffic challan?' },
  prop(3, 'Paranthe Wali Gali', 'Paranthe Gali', 'Old Delhi', 'brown', 60000, [4000, 20000, 60000, 180000, 320000, 450000], 50000, 'Desi-ghee paranthas stuffed with everything from aloo to rabri, fried here since the 1870s.'),
  { id: 4, type: 'tax', name: 'Income Tax Notice', short: 'Income Tax', city: 'Sarkari Daftar', amount: 200000, desc: 'Your UPI history looked suspicious. Pay ₹2,00,000 into the Jugaad Gullak.' },
  { id: 5, type: 'transport', group: 'transport', name: 'Vande Bharat Express', short: 'Vande Bharat', city: 'Indian Railways', price: 200000, mortgage: 100000, desc: 'Semi-high-speed pride of Indian Railways. Sliding doors, swivel seats, zero excuses.' },
  prop(6, 'Johari Bazaar', 'Johari Bazaar', 'Jaipur', 'sky', 100000, [6000, 30000, 90000, 270000, 400000, 550000], 50000, 'Pink City jewellers selling kundan, polki and emeralds the size of ladoos.'),
  { id: 7, type: 'community', name: 'Rishtedaar', short: 'Rishtedaar', city: 'Family WhatsApp Group', desc: 'Relatives have arrived. Expect shagun, gossip, loans that never come back, or a surprise Diwali bonus.' },
  prop(8, 'Dashashwamedh Ghat', 'Ganga Ghat', 'Varanasi', 'sky', 100000, [6000, 30000, 90000, 270000, 400000, 550000], 50000, 'Bells, diyas and the evening Ganga Aarti on the most famous ghat in Kashi.'),
  prop(9, 'Hawa Mahal', 'Hawa Mahal', 'Jaipur', 'sky', 120000, [8000, 40000, 100000, 300000, 450000, 600000], 50000, 'The Palace of Winds and its 953 jharokhas, built so royal ladies could watch the street unseen.'),
  { id: 10, type: 'corner', corner: 'jail', name: 'Tihar Jail', short: 'Tihar Jail', city: 'New Delhi', desc: 'Just Visiting? Wave at the inmates. Locked up? Pay ₹50,000, use a bail pass, or roll doubles.' },
  prop(11, 'Commercial Street', 'Commercial St', 'Bengaluru', 'pink', 140000, [10000, 50000, 150000, 450000, 625000, 750000], 100000, 'Bengaluru’s busiest shopping lane: kurtas, bangles, sneakers and serious crowd navigation.'),
  { id: 12, type: 'utility', group: 'utility', name: 'Bijli Board', short: 'Bijli Board', city: 'State Electricity', price: 150000, mortgage: 75000, desc: 'Every AC in summer runs on this. Rent = dice roll × ₹4,000, or × ₹10,000 if you own both utilities.' },
  prop(13, 'Ranganathan Street, T. Nagar', 'T. Nagar', 'Chennai', 'pink', 140000, [10000, 50000, 150000, 450000, 625000, 750000], 100000, 'Kanjivaram silks and temple gold. Some of the most valuable retail space in India.'),
  prop(14, 'Park Street', 'Park Street', 'Kolkata', 'pink', 160000, [12000, 60000, 180000, 500000, 700000, 900000], 100000, 'Kolkata’s party street: jazz bars, Flury’s pastries and Christmas lights that never quite come down.'),
  { id: 15, type: 'transport', group: 'transport', name: 'Mumbai Local', short: 'Mumbai Local', city: 'Western Line', price: 200000, mortgage: 100000, desc: 'Carries 75 lakh people a day. Dabbawalas, doorway acrobatics and the 9:12 fast to Churchgate.' },
  prop(16, 'Calangute Beach', 'Calangute', 'Goa', 'orange', 180000, [14000, 70000, 200000, 550000, 750000, 950000], 100000, 'Queen of Goan beaches. Shacks, parasailing and a fish thali with a sunset view.'),
  { id: 17, type: 'chance', name: 'Kismet', short: 'Kismet', city: 'Tota-wala Jyotish', desc: 'The tota has picked a card for you. Will the stars align?' },
  prop(18, 'Anjuna Flea Market', 'Anjuna Market', 'Goa', 'orange', 180000, [14000, 70000, 200000, 550000, 750000, 950000], 100000, 'Wednesday flea market of trance music, tie-dye, silver and bargains since the hippie era.'),
  prop(19, 'Mandovi Casino Cruise', 'Casino Cruise', 'Panaji, Goa', 'orange', 200000, [16000, 80000, 220000, 600000, 800000, 1000000], 100000, 'A floating casino lit up like a Diwali cake on the Mandovi river. High stakes, higher rents.'),
  { id: 20, type: 'corner', corner: 'parking', name: 'Jugaad Junction', short: 'Jugaad Junction', city: 'Chai Tapri', desc: 'Take a cutting-chai break and grab everything in the Jugaad Gullak: all the taxes and fines paid so far.' },
  prop(21, 'Connaught Place', 'Connaught Place', 'New Delhi', 'red', 220000, [18000, 90000, 250000, 700000, 875000, 1050000], 150000, 'White Georgian colonnades round Central Park, with Palika Bazaar humming underneath.'),
  { id: 22, type: 'community', name: 'Rishtedaar', short: 'Rishtedaar', city: 'Family WhatsApp Group', desc: 'Mausi has forwarded something. Brace yourself.' },
  prop(23, 'Khan Market', 'Khan Market', 'New Delhi', 'red', 220000, [18000, 90000, 250000, 700000, 875000, 1050000], 150000, 'Tiny shops, giant rents. One of the most expensive retail strips anywhere in the world.'),
  prop(24, 'Cyber Hub', 'Cyber Hub', 'Gurugram', 'red', 240000, [20000, 100000, 300000, 750000, 925000, 1100000], 150000, 'Glass towers, Fortune 500 offices and Friday-night microbreweries.'),
  { id: 25, type: 'transport', group: 'transport', name: 'Delhi Metro', short: 'Delhi Metro', city: 'Rajiv Chowk', price: 200000, mortgage: 100000, desc: 'Busiest interchange in India: Yellow meets Blue line, and nobody stands on the left.' },
  prop(26, 'Indiranagar 100 Ft Road', 'Indiranagar', 'Bengaluru', 'yellow', 260000, [22000, 110000, 330000, 800000, 975000, 1150000], 150000, 'Craft-beer capital of India. Flagship stores by day, brewery hopping by night.'),
  prop(27, 'Koramangala', 'Koramangala', 'Bengaluru', 'yellow', 260000, [22000, 110000, 330000, 800000, 975000, 1150000], 150000, 'Unicorn nursery of India: pitch decks in cafés and Series A talk at every table.'),
  { id: 28, type: 'utility', group: 'utility', name: 'UPI Network', short: 'UPI Network', city: 'Digital India', price: 150000, mortgage: 75000, desc: 'Billions of QR scans a month, from bhelpuri stalls to bullion. Rent = dice roll × ₹4,000, or × ₹10,000 with both utilities.' },
  prop(29, 'HITEC City', 'HITEC City', 'Hyderabad', 'yellow', 280000, [24000, 120000, 360000, 850000, 1025000, 1200000], 150000, 'Cyber Towers, tech campuses and biryani that has ended many diets.'),
  { id: 30, type: 'corner', corner: 'gotojail', name: 'ED Raid!', short: 'ED Raid', city: 'Enforcement Directorate', desc: 'Officials found cash in your false ceiling. Go straight to Tihar Jail. Do not pass START.' },
  prop(31, 'Bandra Bandstand', 'Bandstand', 'Mumbai', 'green', 300000, [26000, 130000, 390000, 900000, 1100000, 1275000], 200000, 'Sea-facing bungalows of superstars, with the Sea Link glowing across the bay.'),
  prop(32, 'Juhu Beach', 'Juhu Beach', 'Mumbai', 'green', 300000, [26000, 130000, 390000, 900000, 1100000, 1275000], 200000, 'Pav bhaji, gola and film shoots at sunset, all next door to movie royalty.'),
  { id: 33, type: 'chance', name: 'Kismet', short: 'Kismet', city: 'Tota-wala Jyotish', desc: 'Your stars, read by a very confident parrot.' },
  prop(34, 'Marine Drive', 'Marine Drive', 'Mumbai', 'green', 320000, [28000, 150000, 450000, 1000000, 1200000, 1400000], 200000, 'The Queen’s Necklace: a 3.6 km arc of lights along the Arabian Sea.'),
  { id: 35, type: 'transport', group: 'transport', name: 'Darjeeling Toy Train', short: 'Toy Train', city: 'Darjeeling Himalayan Rly', price: 200000, mortgage: 100000, desc: 'UNESCO-listed steam toy train looping through the hills. Slow, scenic and always photographed.' },
  { id: 36, type: 'community', name: 'Rishtedaar', short: 'Rishtedaar', city: 'Family WhatsApp Group', desc: 'Chacha wants to “discuss something important”.' },
  prop(37, 'Jubilee Hills', 'Jubilee Hills', 'Hyderabad', 'blue', 350000, [35000, 175000, 500000, 1100000, 1300000, 1500000], 200000, 'Hilltop mansions of film stars, pharma barons and tech tycoons.'),
  { id: 38, type: 'tax', name: 'Big Fat Wedding Tax', short: 'Wedding Tax', city: 'Shaadi Season', amount: 100000, desc: 'Destination wedding, 7 functions and a drone show. Pay ₹1,00,000 into the Jugaad Gullak.' },
  prop(39, 'Altamount Road', 'Altamount Rd', 'Mumbai', 'blue', 400000, [50000, 200000, 600000, 1400000, 1700000, 2000000], 200000, 'Billionaires’ Row: 27-storey private homes, helipads, and the costliest address in India.'),
];

export const isOwnable = (tile) => tile.type === 'property' || tile.type === 'transport' || tile.type === 'utility';

// Grid placement (11x11), board travels anticlockwise starting bottom-right.
export function tilePlacement(id) {
  if (id === 0) return { row: 10, col: 10, side: 'corner', corner: 'br' };
  if (id < 10) return { row: 10, col: 10 - id, side: 'bottom' };
  if (id === 10) return { row: 10, col: 0, side: 'corner', corner: 'bl' };
  if (id < 20) return { row: 20 - id, col: 0, side: 'left' };
  if (id === 20) return { row: 0, col: 0, side: 'corner', corner: 'tl' };
  if (id < 30) return { row: 0, col: id - 20, side: 'top' };
  if (id === 30) return { row: 0, col: 10, side: 'corner', corner: 'tr' };
  return { row: id - 30, col: 10, side: 'right' };
}

// Track sizes: corners are 1.6 units, regular tiles 1 unit => 12.2 units edge to edge.
export const CORNER_UNITS = 1.6;
export const BOARD_UNITS = CORNER_UNITS * 2 + 9;

function trackCenter(k) {
  if (k === 0) return CORNER_UNITS / 2;
  if (k === 10) return BOARD_UNITS - CORNER_UNITS / 2;
  return CORNER_UNITS + (k - 1) + 0.5;
}

// Centre of a tile as % of the board edge.
export function tileCenterPct(id) {
  const { row, col } = tilePlacement(id);
  return { x: (trackCenter(col) / BOARD_UNITS) * 100, y: (trackCenter(row) / BOARD_UNITS) * 100 };
}
