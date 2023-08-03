import { ConnectBox, State, IStatus } from './connectbox';

export class Belt {
  private angle = 0;

  constructor(private connectBox: ConnectBox) {
    connectBox.statusEmitter.on('status', (status: IStatus) => {
      if (status.state === State.IDLE) {
        this.angle = status.angle.D;
      }
    });
  }

  public waitForIdle(): Promise<void> {
    return this.connectBox.waitForIdle()
  }

  public move(distance: number, speed = 2000) {
    return this.connectBox.send(`G90 G01 D${this.angle + distance} F${speed}`);
  }
}
