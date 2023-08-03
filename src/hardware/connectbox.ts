import { EventEmitter } from 'events';
import { IClient, SerialClient, NetClient } from './clients'

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

  constructor(config: ISerialConfig | INetConfig) {
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
      if (str.startsWith('<')) {
        this.status = ConnectBox.parseStatus(str)
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
      if (this.status && this.status.state !== State.IDLE) {
        reject('Current state is not Idle, did you wait for the previous command to finish?');
      } else if (wait === true) {
        // Start polling for status updates
        const interval = setInterval(() => {
          this.client.send('?', true) // Silent to prevent excessive logging
        }, 100)

        // Once we receive the Idle state, we consider the command that was executed to be finished
        this.stateEmitter.once(State.IDLE, () => {
          clearInterval(interval)
          resolve()
        })

        // Send the command
        this.client.send(cmd);
      } else if (wait === false && waitForConfirmation === true) {
        this.okEmitter.once('ok', resolve);
        this.client.send(cmd);
      } else if (wait === false && waitForConfirmation === false) {
        this.client.send(cmd);
        resolve()
      }
    })
  }

  public stop() {
    this.client.send('!\n');
  }

  public waitForIdle(): Promise<void> {
    return new Promise((resolve) => {
      if (this.idle === true) {
        resolve();
      } else {
        // TODO IMPLEMENT A TIMEOUT?
        this.stateEmitter.once('Idle', resolve)
      }
    });
  }

  public static async create(config: ISerialConfig | INetConfig): Promise<ConnectBox> {
    const box = new ConnectBox(config);
    await box.client.connect();
    return box;
  }

  private static parseStatus(status: string): IStatus {
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
