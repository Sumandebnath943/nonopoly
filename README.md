# 🇮🇳 Nonopoly — The Great Indian Business Board Game

A fun, vibrant, online Indian adaptation of the classic business board game. Built with React, Tailwind CSS, Vite, and Web Audio API.

![Nonopoly Banner](public/vite.svg)

---

## 🌟 Features

### 🏛️ 100% Indian Themed Board & Sites
* **40 Custom-Illustrated Squares**: Hand-drawn SVG artwork for every property, station, utility, and corner square.
* **Iconic Indian Locations**:
  * **Old Delhi**: Chandni Chowk, Paranthe Wali Gali
  * **Lucknow**: Hazratganj, Aminabad
  * **Jaipur**: Johari Bazaar, Hawa Mahal
  * **Kolkata**: Park Street, Howrah Station
  * **Bengaluru**: Indiranagar, Koramangala
  * **Mumbai**: Marine Drive, Bandra Bandstand
  * **Goa**: Baga Beach, Candolim
* **Indian Transit & Utilities**:
  * Vande Bharat Express, Mumbai Local, Rajdhani Express, Delhi Metro
  * BSES Yamuna Power, Delhi Jal Board

### 🎲 Desi Rules, Logic & Penalties
* **Shubh Aarambh (START)**: Collect ₹2,00,000 Shagun from the elders each time you pass.
* **ED Raid ➜ Tihar Jail**: Straight to jail with siren animations; get out with a VIP Bail Pass, ₹50,000 fine, or rolling doubles.
* **Jugaad Gullak**: Fines and challans accumulate in the community Gullak. Land on Jugaad Junction to claim the whole pot!
* **Building Progression**: Chai Tapri (1) ➜ Dhaba (2) ➜ Showroom (3) ➜ Mega Mall (4) ➜ Royal Haveli (Hotel).
* **Deeds & Girvi System**: Government of India stamp-paper deeds with authentic typography, serial numbers, and "GIRVI" mortgage stamps.
* **Kismet & Rishtedaar Cards**: Tota-wala (parrot astrologer) fortunes and nosy Indian relative drama.

### 🚗 Iconic Desi Tokens
* **Auto Rickshaw** (meter down)
* **Cutting Chai** (kadak)
* **Cricket Bat** (MRF style)
* **Chetak Scooter** (Hamara Bajaj)
* **Royal Elephant** (Airavata)
* **Mummy's Chappal** (100% accuracy)

### 🤖 6 Unique AI Personalities
* **Gupta Ji**: Conservative Marwari seth with tight purse strings.
* **Bunty**: Aggressive Delhi boy (*"Jaanta hai mera baap kaun hai?"*).
* **Sharma Aunty**: Neighborhood gossip queen with sharp negotiation instincts.
* **Tauji**: Haryanvi landlord, loud and unshakeable.
* **Chintu**: Bengaluru techie startup bro chasing valuations.
* **Raju**: Mumbai hustler with relentless drive.

### 🎆 Cinematic "Wow Moments"
* Full-screen celebratory animations and sound effects for:
  * **SOLD!**: Stamp slam with festive confetti.
  * **MONOPOLY!**: Golden rays, crown, and fanfare.
  * **ED RAID!**: Siren flashes with breaking TV news ticker.
  * **JACKPOT!**: Golden ₹ coin shower.
  * **DIWALIYA!**: Dramatic bankruptcy announcement.
  * **BHAARI KIRAYA!**: Big rent reactions.

### 🎶 Desi Sound Engine
* Real-time Web Audio API synthesized sound effects: Dhol, Sitar, Shehnai, temple bells, coin showers, police sirens, and relaxing lo-fi tabla beats.

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or newer)
* [npm](https://www.npmjs.com/)

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/Sumandebnath943/nonopoly.git

# Navigate into the project folder
cd nonopoly

# Install dependencies
npm install

# Start the development server
npm run dev
```

Visit `http://localhost:5173/` in your browser.

### Build for Production

```bash
npm run build
```

The production assets will be output to the `dist/` directory.

---

## 🛠️ Tech Stack

* **Framework**: React 19
* **Bundler & Dev Server**: Vite 8
* **Styling**: Tailwind CSS v4 & Custom CSS Design System
* **Icons**: Lucide React
* **Effects**: canvas-confetti & Web Audio API
* **Linter**: Oxlint
