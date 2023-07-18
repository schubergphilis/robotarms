import { ConnectBox } from './connectbox';

export class RobotArm {

  constructor(private connectBox: ConnectBox) {}

  public home(): Promise<unknown> {
    return this.connectBox.send('$H')
  }
}
