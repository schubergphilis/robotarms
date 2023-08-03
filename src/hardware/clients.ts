import { Socket } from 'net';
import { EventEmitter } from 'events';
import { SerialPort } from 'serialport';
import { DelimiterParser } from '@serialport/parser-delimiter';
import { logger } from '../logger';

export interface IClient {
  events: EventEmitter;
  connect(): Promise<void>;
  send: (data: string, silent?: boolean) => void;
}

export interface INetClientConfig {
  host: string;
  port: number;
}

export class NetClient implements IClient {
  public events: EventEmitter;
  private client: Socket;

  constructor(private config: INetClientConfig) {
    this.client = new Socket();
    // this.events = this.client;

    this.client.on('close', () => {
      logger.error(`[NetClient] Connection closed for host: ${this.config.host} and ${this.config.port}`);
    })

    this.client.on('error', (error) => {
      logger.error('[NetClient] An error occured');
      console.error(error);
    })

    this.events = this.client.pipe(new DelimiterParser({ delimiter: '\n' }));

    this.events.on('data', (data: Buffer) => {
      console.log(data.toString('utf-8'));
    });
  }

  public connect(): Promise<void> {
    return new Promise((resolve) => {
      this.client.connect(this.config.port, this.config.host, () => {
        logger.debug(`[NetClient] Connected to: ${this.config.host} on port: ${this.config.port}`);
        resolve();
      })
    })
  }

  public send(data: string, silent = false): void {
    if (!silent) {
      logger.debug(`Command send: ${data}`);
    }

    this.client.write(`${data} \n`);
  }
}

export interface ISerialClientConfig {
  path: string;
  baudRate: number;
}

export class SerialClient implements IClient {
  private port: SerialPort;
  public events: EventEmitter;

  constructor(private config: ISerialClientConfig) {
    this.port = new SerialPort({ path: this.config.path, baudRate: this.config.baudRate, stopBits: 1, dataBits: 8 });
    this.events = this.port.pipe(new DelimiterParser({ delimiter: '\n' }));

    this.port.on('error', () => {
      throw new Error(`[SerialClient] Error occured: ${this.config.path}`)
    });

    this.port.on('close', () => {
      throw new Error(`[SerialClient] Connection closed for: ${this.config.path}`)
    });
  }

  public connect(): Promise<void> {
    return Promise.resolve();
  }

  public send(data: string, silent = false): void {
    if (!silent) {
      logger.debug(`Command send: ${data}`);
    }

    this.port.write(`${data} \n`);
  }
}
