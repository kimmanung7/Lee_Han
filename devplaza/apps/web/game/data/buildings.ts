export interface BuildingDef {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: number;
}

export const BUILDINGS: BuildingDef[] = [
  { id: "rust-lab",        name: "Rust Lab",        x: 400,  y: 300,  w: 200, h: 140, color: 0x1a2744 },
  { id: "react-tower",     name: "React Tower",     x: 800,  y: 200,  w: 240, h: 160, color: 0x142814 },
  { id: "ai-hub",          name: "AI Hub",          x: 1300, y: 350,  w: 200, h: 130, color: 0x2a1a44 },
  { id: "devops-station",  name: "DevOps Station",  x: 1800, y: 250,  w: 220, h: 150, color: 0x1a3030 },
  { id: "database-palace", name: "Database Palace", x: 2400, y: 350,  w: 200, h: 140, color: 0x382814 },
  { id: "security-lab",    name: "Security Lab",    x: 400,  y: 900,  w: 180, h: 140, color: 0x441a1a },
  { id: "python-hub",      name: "Python Hub",      x: 900,  y: 800,  w: 260, h: 160, color: 0x2a2a14 },
  { id: "cloud-base",      name: "Cloud Base",      x: 1500, y: 900,  w: 200, h: 150, color: 0x14283c },
  { id: "game-dev",        name: "Game Dev",        x: 2100, y: 700,  w: 220, h: 180, color: 0x3c1a2a },
  { id: "ml-studio",       name: "ML Studio",       x: 2700, y: 900,  w: 200, h: 140, color: 0x1a3820 },
  { id: "open-source",     name: "Open Source",     x: 600,  y: 1500, w: 200, h: 130, color: 0x1e2e1e },
  { id: "startup-space",   name: "Startup Space",   x: 1200, y: 1400, w: 240, h: 160, color: 0x2a1a38 },
  { id: "backend-forge",   name: "Backend Forge",   x: 1900, y: 1500, w: 200, h: 140, color: 0x1a3824 },
  { id: "mobile-lab",      name: "Mobile Lab",      x: 2600, y: 1200, w: 220, h: 150, color: 0x382a14 },
  { id: "web3-zone",       name: "Web3 Zone",       x: 300,  y: 1900, w: 200, h: 150, color: 0x24183c },
  { id: "devtools-hub",    name: "DevTools Hub",    x: 1000, y: 2000, w: 260, h: 160, color: 0x183024 },
  { id: "ui-ux-lab",       name: "UI/UX Lab",       x: 1700, y: 1900, w: 220, h: 150, color: 0x3c2414 },
  { id: "algo-arena",      name: "Algo Arena",      x: 2400, y: 1900, w: 200, h: 140, color: 0x14243c },
];
