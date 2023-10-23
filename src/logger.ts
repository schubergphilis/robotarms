/* eslint-disable @typescript-eslint/no-unsafe-call */
import chalk from 'chalk';
import strip from 'strip-color';

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
      this.emit('DEBUG', chalk.magentaBright(msg));
    }
  }

  public info(msg: string) {
    if (this.logLevel <= LogLevel.Info) {
      this.emit('INFO', chalk.whiteBright(msg));
    }
  }

  public warn(msg: string): void {
    if (this.logLevel <= LogLevel.Warn) {
      this.emit('WARN', chalk.yellow(msg));
    }
  }

  public error(msg: string): void {
    if (this.logLevel <= LogLevel.Error) {
      this.emit('ERROR', chalk.red(msg));
    }
  }

  private emit(level: string, msg: string) {
    // Print to the console
    console.log(`[${level}] ${msg}`);

    // Inform the parent process
    if (process?.send) {
      process.send(JSON.stringify({
        action: 'logging',
        data: {
          msg: strip(msg),
          level,
        }
      }));
    }
  }
}

export const logger = new Logger();
