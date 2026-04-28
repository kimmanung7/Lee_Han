// Phaser's ESM build exports all classes as named exports without a default.
// This shim assembles a default-exported namespace so game files can use
// `import Phaser from "@/game/phaser-compat"` without Turbopack issues.
import * as _P from "phaser";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Phaser = _P as any as typeof import("phaser");
export default Phaser;
