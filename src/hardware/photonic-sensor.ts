import { ConnectBox } from './connectbox';
import { EventEmitter } from 'events';

export class PhotonicSensor {
  public detected: boolean = false;
  public readonly event = new EventEmitter();

  constructor(private connectBox: ConnectBox) {
    setInterval(() => {
      this.connectBox.port.write('O131?\n')
    }, 250)

    this.connectBox.dataEmitter.on('data', (data: string) => {
      if (data.match(/^[01],[01],[01],[01]/)) {
        const parts = data.split(',')
        const detected = parts[0] === '0';

        if (this.detected !== detected && detected)  {
          this.detected = detected;
          this.event.emit('detected', detected)
        } else if (this.detected !== detected && !detected) {
          this.detected = detected;
          this.event.emit('undetected', detected)
        }
      }
    })
  }
}
