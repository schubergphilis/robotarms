import { EventEmitter } from 'events';
import { IClient, SerialClient, NetClient } from './clients'
import { logger } from '../logger';

export interface IStatus {
  state: string,
  angle: {
    A: number;
    B: number;
    C: number;
    D: number;
    X: number;
    Y: number;
    Z: number;
  },
  cartesian: {
    X: number;
    Y: number;
    Z: number;
    Rx: number;
    Ry: number;
    Rz: number;
  }
}

export interface IConfig {
  logCommands?: boolean;
  name: string;
}

/**
 * Used to connect over TCP. Used when the connectbox is available on the network.
 * Connected to the raspberry pi using Ser2Net for example. Example config:
 * {
 *   host: 'robotarm.local',
 *   port: 3000
 * }
 */
export interface INetConfig extends IConfig {
  host: string;
  port: number;
}

/**
 * Used to connect directly over a USB/Serial connection when running
 * locally for example. Example config:
 * {
 *   path: '/dev/tty.usbserial-14310',
 *   baudRate: 115200
 * }
 */
export interface ISerialConfig extends IConfig {
  path: string;
  baudRate: number;
}

export enum State {
  ALARM = 'Alarm',
  HOME = 'Home',
  IDLE = 'Idle',
  HOLD = 'Hold',
  RUN = 'Run'
}

export class ConnectBox {
  public readonly client: IClient;
  protected status?: IStatus;

  public readonly dataEmitter = new EventEmitter();
  public stateEmitter = new EventEmitter();
  public statusEmitter = new EventEmitter();
  private okEmitter = new EventEmitter();

  constructor(private config: ISerialConfig | INetConfig, private logCommands = false) {
    if ('path' in config) {
      this.client = new SerialClient(config);
    } else {
      this.client = new NetClient(config);
    }

    // When receiving data, what todo
    this.client.events.on('data', (data: Buffer) => {
      const str = data.toString();
      this.dataEmitter.emit('data', str);
      // logger.debug(str);

      // Status update
      const statusStr = str.match(/(<(.*),*>)/);
      if (statusStr !== null) {
        this.status = ConnectBox.parseStatus(statusStr)
        this.statusEmitter.emit('status', this.status);
        this.stateEmitter.emit(this.status.state)
      } else if (str.indexOf('ok') > -1) {
        this.okEmitter.emit('ok');
      }
    })
  }

  get idle(): boolean {
    return this.status?.state === State.IDLE || this.status?.state === undefined;
  }

  public send(cmd: string, wait = true, waitForConfirmation = true): Promise<void> {
    return new Promise((resolve, reject) => {
      // Current state is no
      if (this.status && this.status.state !== State.IDLE && this.status.state !== State.ALARM) {
        reject('Current state is not Idle, did you wait for the previous command to finish?');
      } else if (wait === true) {
        // Start polling for status updates
        const interval = setInterval(() => {
          this.sendToClient('?', true) // Silent to prevent excessive logging
        }, 100)

        // Once we receive the Idle state, we consider the command that was executed to be finished
        this.stateEmitter.once(State.IDLE, () => {
          clearInterval(interval)
          resolve()
        })

        // Send the command
        this.sendToClient(cmd, !this.logCommands);
      } else if (wait === false && waitForConfirmation === true) {
        this.okEmitter.once('ok', resolve);
        this.sendToClient(cmd, !this.logCommands);
      } else if (wait === false && waitForConfirmation === false) {
        this.sendToClient(cmd, !this.logCommands);
        resolve()
      }
    })
  }

  public stop() {
    this.sendToClient('!\n');
  }

  public waitForIdle(): Promise<void> {
    return new Promise((resolve) => {
      if (this.idle === true) {
        resolve();
      } else {
        // TODO IMPLEMENT A TIMEOUT?
        this.stateEmitter.once('Idle', resolve);
      }
    });
  }

  // Factory function to combine creation and asynchronous connection setup
  public static async create(config: ISerialConfig | INetConfig, logCommands = false): Promise<ConnectBox> {
    return new Promise(async (resolve, reject) => {

      const box = new ConnectBox(config, logCommands);
      await box.client.connect();

      // Verify the box is not in Hold state before starting
      box.statusEmitter.once('status', (status: IStatus) => {
        if (status.state === State.HOLD) {
          reject(`Box: ${box.config.name} is in Hold state, please press reset on the arm and then restart`);
        } else {
          logger.info(`Box: ${box.config.name} is ready`);
          resolve(box);
        }
      });

      // Request status
      box.sendToClient('?');
    })

  }

  private sendToClient(data: string, silent = false) {
    if (!silent) {
      logger.debug(`[${this.config.name}] ${data}`)
    }

    return this.client.send(data)
  }

  private static parseStatus(statusArray: RegExpMatchArray): IStatus {
    const status = statusArray[0];
    const statusElements = status
          .replace('<', '')
          .replace('>', '')
          .split(/[\s,\s:]+/)

    return {
      state: statusElements[0],
      angle: {
        A: parseFloat(statusElements[2]),
        B: parseFloat(statusElements[3]),
        C: parseFloat(statusElements[4]),
        D: parseFloat(statusElements[5]),
        X: parseFloat(statusElements[6]),
        Y: parseFloat(statusElements[7]),
        Z: parseFloat(statusElements[8])
      },
      cartesian: {
        X: parseFloat(statusElements[12]),
        Y: parseFloat(statusElements[13]),
        Z: parseFloat(statusElements[14]),
        Rx: parseFloat(statusElements[15]),
        Ry: parseFloat(statusElements[16]),
        Rz: parseFloat(statusElements[17]),
      }
    }
  }
}
