import chalk from 'chalk';

export enum LogLevel {
  Debug = 1,
  Info = 2,
  Warn = 3,
  Error = 4
}

class Logger {
  protected logLevel: LogLevel = LogLevel.Debug;

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public debug(msg: string): void {
    if (this.logLevel <= LogLevel.Debug) {
      console.log(`[DEBUG] ${chalk.magentaBright(msg)}`)
    }
  }

  public info(msg: string) {
    if (this.logLevel <= LogLevel.Info) {
      console.log(`[INFO] ${chalk.whiteBright(msg)}`);
    }
  }

  public warn(msg: string): void {
    if (this.logLevel <= LogLevel.Warn) {
      console.log(`[WARN] ${chalk.yellow(msg)}`);
    }
  }

  public error(msg: string): void {
    if (this.logLevel <= LogLevel.Error) {
      console.log(`[ERROR] ${chalk.red(msg)}`);
    }
  }
}

export const logger = new Logger();
