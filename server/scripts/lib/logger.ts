/**
 * Shared logging utilities for database scripts
 * Provides consistent, beautiful terminal output
 */

// ANSI color codes
export const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  // Colors
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  // Background
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
} as const;

// Unicode box drawing characters
const box = {
  topLeft: "╭",
  topRight: "╮",
  bottomLeft: "╰",
  bottomRight: "╯",
  horizontal: "─",
  vertical: "│",
  teeRight: "├",
  teeLeft: "┤",
} as const;

const WIDTH = 50;

/** Get formatted timestamp */
const timestamp = () =>
  new Date().toLocaleTimeString("en-US", { hour12: false });

/** Color helper */
const c = (color: keyof typeof colors, text: string) =>
  `${colors[color]}${text}${colors.reset}`;

/**
 * Print a styled header box
 */
export function header(title: string, subtitle?: string): void {
  const line = box.horizontal.repeat(WIDTH);
  console.log();
  console.log(c("cyan", `${box.topLeft}${line}${box.topRight}`));
  console.log(
    c("cyan", box.vertical) +
      c("bold", `  ${title}`.padEnd(WIDTH)) +
      c("cyan", box.vertical),
  );
  if (subtitle) {
    console.log(
      c("cyan", box.vertical) +
        c("dim", `  ${subtitle}`.padEnd(WIDTH)) +
        c("cyan", box.vertical),
    );
  }
  console.log(c("cyan", `${box.bottomLeft}${line}${box.bottomRight}`));
  console.log();
}

/**
 * Print a step with status indicator
 */
export function step(
  message: string,
  status: "start" | "done" | "error" | "skip",
  detail?: string,
  stepNum?: { current: number; total: number },
): void {
  const time = c("dim", `[${timestamp()}]`);
  const stepIndicator = stepNum
    ? c("cyan", ` [${stepNum.current}/${stepNum.total}]`)
    : "";
  const detailStr = detail ? c("dim", ` (${detail})`) : "";

  const icons = {
    start: c("yellow", "○"),
    done: c("green", "●"),
    error: c("red", "✕"),
    skip: c("dim", "◌"),
  };

  console.log(
    `${time}${stepIndicator} ${icons[status]} ${message}${detailStr}`,
  );
}

/**
 * Print a sub-step (indented)
 */
export function subStep(
  message: string,
  status: "start" | "done",
  detail?: string,
): void {
  const prefix = status === "start" ? c("dim", "  ├─") : c("dim", "  └─");
  const icon = status === "start" ? c("yellow", "○") : c("green", "●");
  const detailStr = detail ? c("dim", ` (${detail})`) : "";
  console.log(`${prefix} ${icon} ${message}${detailStr}`);
}

/**
 * Print a progress bar
 */
export function progress(current: number, total: number, label?: string): void {
  const pct = Math.round((current / total) * 100);
  const filled = Math.round(pct / 5);
  const bar =
    c("green", "█".repeat(filled)) + c("dim", "░".repeat(20 - filled));
  const labelStr = label ? ` ${label}` : "";

  process.stdout.write(
    `\r     ${bar} ${c("cyan", `${pct}%`)}${c("dim", labelStr)}`.padEnd(70),
  );

  if (current === total) console.log();
}

/**
 * Print success box with stats
 */
export function success(
  message: string,
  duration: number,
  stats?: Record<string, number | string>,
): void {
  const line = box.horizontal.repeat(WIDTH);
  console.log();
  console.log(c("green", `${box.topLeft}${line}${box.topRight}`));
  console.log(
    c("green", box.vertical) +
      c("bold", `  ✓ ${message}`.padEnd(WIDTH)) +
      c("green", box.vertical),
  );

  if (stats) {
    console.log(c("green", `${box.teeRight}${line}${box.teeLeft}`));
    for (const [key, value] of Object.entries(stats)) {
      const row = `  ${key}: ${c("cyan", String(value))}`;
      // Account for ANSI codes in padding calculation
      const visibleLength = `  ${key}: ${value}`.length;
      const padding = WIDTH - visibleLength;
      console.log(
        c("green", box.vertical) +
          row +
          " ".repeat(Math.max(0, padding)) +
          c("green", box.vertical),
      );
    }
  }

  const durationRow = `  Duration: ${c("cyan", `${duration}ms`)}`;
  const durationVisible = `  Duration: ${duration}ms`.length;
  console.log(
    c("green", box.vertical) +
      durationRow +
      " ".repeat(WIDTH - durationVisible) +
      c("green", box.vertical),
  );
  console.log(c("green", `${box.bottomLeft}${line}${box.bottomRight}`));
  console.log();
}

/**
 * Print error box
 */
export function error(message: string, err?: unknown): void {
  const line = box.horizontal.repeat(WIDTH);
  console.log();
  console.log(c("red", `${box.topLeft}${line}${box.topRight}`));
  console.log(
    c("red", box.vertical) +
      c("bold", `  ✕ ${message}`.padEnd(WIDTH)) +
      c("red", box.vertical),
  );
  console.log(c("red", `${box.bottomLeft}${line}${box.bottomRight}`));

  if (err) {
    console.log();
    console.log(c("dim", "Error details:"));
    console.error(err);
  }
  console.log();
}

/**
 * Print info box (e.g., credentials)
 */
export function infoBox(
  title: string,
  items: { label: string; value: string; color?: keyof typeof colors }[],
): void {
  const line = box.horizontal.repeat(WIDTH);
  console.log(c("yellow", `${box.topLeft}${line}${box.topRight}`));
  console.log(
    c("yellow", box.vertical) +
      c("bold", `  ${title}`.padEnd(WIDTH)) +
      c("yellow", box.vertical),
  );
  console.log(c("yellow", `${box.teeRight}${line}${box.teeLeft}`));

  for (const item of items) {
    const coloredValue = c(item.color || "white", item.value);
    const row = `  ${item.label}: ${coloredValue}`;
    const visibleLength = `  ${item.label}: ${item.value}`.length;
    const padding = WIDTH - visibleLength;
    console.log(
      c("yellow", box.vertical) +
        row +
        " ".repeat(Math.max(0, padding)) +
        c("yellow", box.vertical),
    );
  }

  console.log(c("yellow", `${box.bottomLeft}${line}${box.bottomRight}`));
  console.log();
}

/**
 * Print a simple info line
 */
export function info(message: string): void {
  console.log(c("dim", `  ${message}`));
}

/**
 * Print a warning
 */
export function warn(message: string): void {
  console.log(c("yellow", `  ⚠ ${message}`));
}

/**
 * Print next steps
 */
export function nextSteps(steps: string[]): void {
  console.log(c("cyan", "  Next steps:"));
  for (const s of steps) {
    console.log(c("dim", `   → ${s}`));
  }
  console.log();
}
