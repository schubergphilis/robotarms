import { ConnectBox } from './connectbox';
import { wait } from '../utils'

export interface IPosition {
  X: number;
  Y: number;
  Z: number;
  A: number;
  B: number;
  C: number;
}

export enum Axis {
  X = 'X',
  Y = 'Y',
  Z = 'Z',
  A = 'A',
  B = 'B',
  C = 'C'
}

export class RobotArm {
  constructor(public connectBox: ConnectBox) {}

  public goToCoordinateAbsolute(position: IPosition): Promise<unknown> {
    return this.connectBox.send(`M20 G90 G01 ${this.convertPositionToString(position)} F2000.00`);
  }

  public goToCoordinateRelative(position: IPosition): Promise<unknown> {
    return this.connectBox.send(`M20 G91 G01 ${this.convertPositionToString(position)} F2000.00`);
  }

  public goToAngle(position: Partial<IPosition>): Promise<unknown> {
    return this.connectBox.send(`M21 G90 G01 ${this.convertPositionToString(position)} F2000.00`);
  }

  public moveAxisRelative(axis: Axis, amount: number) {
    return this.connectBox.send(`M20 G91 ${axis}${amount}`);
  }

  public moveRelativeCoordinate(axis: Axis, amount: number) {
    return this.connectBox.send(`M21 G91 ${axis}${amount}`);
  }

  public turnOnSuctionCup() {
    return this.connectBox.send('M3 S1000', true);
  }

  public turnOnBlowSuctionCup() {
    return this.connectBox.send('M3 S500', true);
  }

  public turnOffSuctionCup() {
    return this.connectBox.send('M3 S0', true);
  }

  public async home() {
    await this.connectBox.send('$H');
    // Sending commands to quickly after homing seems to cause weird behavior
    // adding an artificial delay to prevent issues
    return wait(1000);
  }

  public goToZero() {
    return this.goToAngle({ X: 0, Y: 0, Z: 0, A: 0, B: 0, C: 0 });
  }

  public waitForIdle(): Promise<void> {
    return this.connectBox.waitForIdle()
  }

  private convertPositionToString(position: Partial<IPosition>): string {
    let str = ''

    Object.entries(position).forEach(([axis, value]) => {
      str += `${axis}${value} `
    })

    return str;
  }
}
