import { Game } from '../types/database.types';

export interface GameEntry {
  id: string;
  label: string;
  icon: string;
  category: Game['category'];
}

export const GAMES_LIST: GameEntry[] = [
  // ── MOBA ──────────────────────────────────────────────────────────────
  { id: 'lol',       label: 'League of Legends',            icon: '⚔️',  category: 'MOBA'         },
  { id: 'dota2',     label: 'Dota 2',                       icon: '🗡️',  category: 'MOBA'         },
  { id: 'smite2',    label: 'SMITE 2',                      icon: '🏛️',  category: 'MOBA'         },
  { id: 'honor',     label: 'For Honor',                    icon: '⚜️',  category: 'MOBA'         },

  // ── FPS ───────────────────────────────────────────────────────────────
  { id: 'csgo',      label: 'CS2',                          icon: '💣',  category: 'FPS'          },
  { id: 'valorant',  label: 'Valorant',                     icon: '🔫',  category: 'FPS'          },
  { id: 'overwatch', label: 'Overwatch 2',                  icon: '🦸',  category: 'FPS'          },
  { id: 'apex',      label: 'Apex Legends',                 icon: '🎯',  category: 'Battle Royale'},
  { id: 'r6siege',   label: 'Rainbow Six Siege',            icon: '🛡️',  category: 'FPS'          },
  { id: 'tf2',       label: 'Team Fortress 2',              icon: '🎩',  category: 'FPS'          },
  { id: 'destiny2',  label: 'Destiny 2',                    icon: '🚀',  category: 'FPS'          },
  { id: 'warframe',  label: 'Warframe',                     icon: '🤖',  category: 'FPS'          },
  { id: 'hunt',      label: 'Hunt: Showdown 1896',          icon: '🏹',  category: 'FPS'          },
  { id: 'squad',     label: 'Squad',                        icon: '🎖️',  category: 'FPS'          },
  { id: 'hll',       label: 'Hell Let Loose',               icon: '💂',  category: 'FPS'          },
  { id: 'ins',       label: 'Insurgency: Sandstorm',        icon: '💥',  category: 'FPS'          },
  { id: 'drg',       label: 'Deep Rock Galactic',           icon: '💎',  category: 'FPS'          },
  { id: 'payday3',   label: 'Payday 3',                     icon: '💰',  category: 'FPS'          },
  { id: 'l4d2',      label: 'Left 4 Dead 2',                icon: '🔦',  category: 'FPS'          },
  { id: 'darktide',  label: 'Warhammer 40K: Darktide',      icon: '⚙️',  category: 'FPS'          },
  { id: 'b4b',       label: 'Back 4 Blood',                 icon: '🩸',  category: 'FPS'          },
  { id: 'kf2',       label: 'Killing Floor 2',              icon: '🔬',  category: 'FPS'          },
  { id: 'halo',      label: 'Halo Infinite',                icon: '👾',  category: 'FPS'          },
  { id: 'thefinals', label: 'The Finals',                   icon: '📺',  category: 'FPS'          },
  { id: 'helldivers',label: 'Helldivers 2',                 icon: '🪐',  category: 'FPS'          },
  { id: 'bf2042',    label: 'Battlefield 2042',             icon: '🪖',  category: 'FPS'          },
  { id: 'vermintide',label: 'Warhammer: Vermintide 2',      icon: '🐀',  category: 'FPS'          },

  // ── Battle Royale ─────────────────────────────────────────────────────
  { id: 'fortnite',  label: 'Fortnite',                     icon: '🏗️',  category: 'Battle Royale'},
  { id: 'pubg',      label: 'PUBG: Battlegrounds',          icon: '🪖',  category: 'Battle Royale'},
  { id: 'fallguys',  label: 'Fall Guys',                    icon: '👑',  category: 'Battle Royale'},

  // ── RPG ───────────────────────────────────────────────────────────────
  { id: 'wow',       label: 'World of Warcraft',            icon: '🐉',  category: 'MMO'          },
  { id: 'ark',       label: 'ARK: Survival Ascended',       icon: '🦕',  category: 'RPG'          },
  { id: 'gta',       label: 'GTA Online',                   icon: '🚗',  category: 'RPG'          },
  { id: 'poe2',      label: 'Path of Exile 2',              icon: '💀',  category: 'RPG'          },
  { id: 'valheim',   label: 'Valheim',                      icon: '🪓',  category: 'RPG'          },
  { id: 'vrising',   label: 'V Rising',                     icon: '🧛',  category: 'RPG'          },
  { id: 'mhwilds',   label: 'Monster Hunter Wilds',         icon: '🐗',  category: 'RPG'          },
  { id: 'sea',       label: 'Sea of Thieves',               icon: '🏴‍☠️', category: 'RPG'          },
  { id: 'palworld',  label: 'Palworld',                     icon: '🎴',  category: 'RPG'          },
  { id: 'eldenring', label: 'Elden Ring',                   icon: '🌑',  category: 'RPG'          },

  // ── MMO ───────────────────────────────────────────────────────────────
  { id: 'lostart',   label: 'Lost Ark',                     icon: '🗺️',  category: 'MMO'          },
  { id: 'newworld',  label: 'New World: Aeternum',          icon: '⚗️',  category: 'MMO'          },
  { id: 'bdo',       label: 'Black Desert Online',          icon: '🏜️',  category: 'MMO'          },
  { id: 'ffxiv',     label: 'Final Fantasy XIV',            icon: '🌸',  category: 'MMO'          },

  // ── Simulation / Survie ───────────────────────────────────────────────
  { id: 'minecraft', label: 'Minecraft',                    icon: '⛏️',  category: 'Simulation'   },
  { id: 'rust',      label: 'Rust',                         icon: '🔨',  category: 'Simulation'   },
  { id: 'gmod',      label: "Garry's Mod",                  icon: '🔧',  category: 'Simulation'   },
  { id: 'terraria',  label: 'Terraria',                     icon: '🌍',  category: 'Simulation'   },
  { id: 'dayz',      label: 'DayZ',                         icon: '🏕️',  category: 'Simulation'   },
  { id: '7dtd',      label: '7 Days to Die',                icon: '🧟',  category: 'Simulation'   },
  { id: 'warthunder',label: 'War Thunder',                  icon: '✈️',  category: 'Simulation'   },
  { id: 'phasmopho', label: 'Phasmophobia',                 icon: '👻',  category: 'Simulation'   },
  { id: 'lethal',    label: 'Lethal Company',               icon: '👽',  category: 'Simulation'   },
  { id: 'arma',      label: 'Arma Reforger',                icon: '🏔️',  category: 'Simulation'   },
  { id: 'ets2',      label: 'Euro Truck Simulator 2',       icon: '🚚',  category: 'Simulation'   },
  { id: 'phasmv2',   label: 'Among Us',                     icon: '🛸',  category: 'Simulation'   },
  { id: 'dbd',       label: 'Dead by Daylight',             icon: '🔪',  category: 'Simulation'   },

  // ── Stratégie ─────────────────────────────────────────────────────────
  { id: 'homm',      label: 'Heroes of Might & Magic: Olden Era', icon: '🏰', category: 'Stratégie' },
  { id: 'twwh3',     label: 'Total War: Warhammer III',     icon: '🏯',  category: 'Stratégie'    },
  { id: 'aoe4',      label: 'Age of Empires IV',            icon: '🛕',  category: 'Stratégie'    },
  { id: 'civ6',      label: 'Civilization VI',              icon: '🌐',  category: 'Stratégie'    },

  // ── Sport ─────────────────────────────────────────────────────────────
  { id: 'pcm2025',   label: 'Pro Cyclist Manager 2025',     icon: '🚴',  category: 'Sport'        },
  { id: 'pcm2026',   label: 'Pro Cyclist Manager 2026',     icon: '🚴',  category: 'Sport'        },
  { id: 'fm25',      label: 'Football Manager 2025',        icon: '⚽',  category: 'Sport'        },
  { id: 'rocket',    label: 'Rocket League',                icon: '🚘',  category: 'Sport'        },
];
