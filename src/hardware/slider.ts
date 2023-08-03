import { ConnectBox } from './connectbox';

export class Slider {
  constructor(private connectBox: ConnectBox) {}

  public async home(): Promise<unknown> {
    // await this.connectBox.send('M50', false, false);
    return this.connectBox.send('$H7')
  }

  public waitForIdle(): Promise<void> {
    return this.connectBox.waitForIdle()
  }

  public moveTo(position: number): Promise<unknown> {
    return this.connectBox.send(`G90 G01 D${position} F2000`)
  }
}
