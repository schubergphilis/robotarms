import { ConnectBox } from './connectbox';

export class Slider {

  constructor(private connectBox: ConnectBox) {}

  public home(): Promise<unknown> {
    return this.connectBox.send('$H7')
  }

  public moveTo(position: Number, speed = 2000): Promise<string> {
    return this.connectBox.send(`G90 G01 D${position} F${speed}`)
  }
}
