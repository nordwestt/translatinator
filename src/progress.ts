export class ProgressBar {
  private enabled: boolean;
  private label: string;
  private active = false;

  constructor(label: string, enabled: boolean) {
    this.label = label;
    this.enabled = enabled;
  }

  update(current: number, total: number, detail?: string): void {
    if (!this.enabled || total <= 0) return;

    const ratio = Math.min(current / total, 1);
    const width = 28;
    const filled = Math.round(ratio * width);
    const bar = '█'.repeat(filled) + '░'.repeat(Math.max(width - filled, 0));
    const percent = String(Math.floor(ratio * 100)).padStart(3, ' ');
    const suffix = detail ? ` ${detail}` : '';

    process.stderr.write(
      `\r\x1b[K${this.label} [${bar}] ${percent}% (${current}/${total})${suffix}`
    );
    this.active = true;
  }

  finish(): void {
    if (this.enabled && this.active) {
      process.stderr.write('\n');
      this.active = false;
    }
  }
}
