import { ConnectBox } from './connectbox';

export class Belt {
  constructor(private connectBox: ConnectBox) {}

  public move(distance: number, speed = 2000) {
    // console.log(`G91 G01 D${distance} F${speed}`)
    return this.connectBox.send(`G91 G01 D${distance} F${speed}`)
  }
}
