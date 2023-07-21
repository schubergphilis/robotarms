import { SerialPort } from 'serialport';
import { DelimiterParser } from '@serialport/parser-delimiter';
import { EventEmitter } from 'events';

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


export class ConnectBox {
  public port: SerialPort;
  private parser: any;
  protected status?: IStatus;

  public readonly dataEmitter = new EventEmitter();
  public stateEmitter = new EventEmitter();
  public statusEmitter = new EventEmitter();
  private okEmitter = new EventEmitter();

  constructor(port: string, baudRate = 115200) {
    this.port = new SerialPort({ path: port, baudRate, stopBits: 1, dataBits: 8 });
    this.parser = this.port.pipe(new DelimiterParser({ delimiter: '\n' }));

    // When receiving data, what todo
    this.parser.on('data', (data: Buffer) => {
      const str = data.toString();
      this.dataEmitter.emit('data', str);

      // Status update
      if (str.startsWith('<')) {
        this.status = ConnectBox.parseStatus(str)
        this.statusEmitter.emit('status', this.status);
        this.stateEmitter.emit(this.status.state)
      // Command received, ready for next one
      } else if (str.indexOf('ok') > -1) {
        this.okEmitter.emit('ok');
      }
    })
  }

  public send(cmd: string, wait = true): Promise<void> {
    return new Promise((resolve, reject) => {
      // Current state is no
      if (this.status && this.status.state !== 'Idle') {
        console.log('Current state is not Idle')
        reject('Current state is not Idle, did you wait for the previous command to finish?');
      } else if (wait === true) {
        // Start polling for status updates
        // console.log('Waiting for Idle state');
        const interval = setInterval(() => {
          // Write directly to the port instead using ConnectBox.write to prevent excessive logging
          this.port.write('?\n')
        }, 100)

        // Once we receive the Idle state, we consider the command that was executed to be finished
        this.stateEmitter.once('Idle', () => {
          // console.log('Idle state received');
          clearInterval(interval)
          resolve()
        })

        // Send the command
        this.write(cmd);
      } else if (wait === false) {
        this.okEmitter.once('ok', resolve);
        this.write(cmd)
      }
    })
  }

  private write(cmd: string) {
    // console.log(`Command send: ${cmd}`)
    this.port.write(cmd + '\n');
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
