import { ConnectBox } from './connectbox';

export class Slider {
  constructor(private connectBox: ConnectBox) {}

  public home(): Promise<unknown> {
    return this.connectBox.send('$H7')
  }

  public moveTo(position: number): Promise<unknown> {
    return this.connectBox.send(`G90 G01 D${position} F2000`)
  }
}
