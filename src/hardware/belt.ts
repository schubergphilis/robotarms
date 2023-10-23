import { ConnectBox } from './connectbox';

export class Belt {
  constructor(private connectBox: ConnectBox) {}

  public waitForIdle(): Promise<void> {
    return this.connectBox.waitForIdle();
  }

  public move(distance: number) {
    return this.connectBox.send(`G91 G01 D${distance} F1800`);
  }
}
