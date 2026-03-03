export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class Logger {
  private context: string;
  private minLevel: LogLevel;

  constructor(context: string, minLevel?: LogLevel) {
    this.context = context;
    this.minLevel = minLevel || (process.env.LOG_LEVEL as LogLevel) || "info";
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>
  ): string {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      ...meta,
    };
    return JSON.stringify(entry);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (!this.shouldLog("debug")) return;
    console.log(this.formatMessage("debug", message, meta));
  }

  info(message: string, meta?: Record<string, unknown>): void {
    if (!this.shouldLog("info")) return;
    console.log(this.formatMessage("info", message, meta));
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    if (!this.shouldLog("warn")) return;
    console.warn(this.formatMessage("warn", message, meta));
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    if (!this.shouldLog("error")) return;
    const errorMeta = error
      ? { error: error.message, stack: error.stack, ...meta }
      : meta;
    console.log(this.formatMessage("error", message, errorMeta));
  }
}
