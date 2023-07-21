import { ConnectBox } from './connectbox';

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
  Z = 'Z'
}

export class RobotArm {
  constructor(private connectBox: ConnectBox) {}

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
    return this.connectBox.send('M3 S1000', false);
  }

  public turnOffSuctionCup() {
    return this.connectBox.send('M3 S0', false);
  }

  public home(): Promise<unknown> {
    return this.connectBox.send('$H');
  }

  public send(cmd: string): Promise<unknown> {
    return this.connectBox.send(cmd);
  }

  private convertPositionToString(position: Partial<IPosition>): string {
    let str = ''
    Object.keys(position).forEach((axis) => {
      str += `${axis}${(position as any)[axis]} `
    })
    return str;
  }
}
