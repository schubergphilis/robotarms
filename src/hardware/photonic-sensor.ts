import { ConnectBox } from './connectbox';
import { EventEmitter } from 'events';

/**
 * This is not the prettiest ipmlementation. We need to constantly poll for status
 * updates on the box to see if something is detected. Responsiblities and ownership
 * of who requests the data and who parses it are quite mixed here....
 * Maybe the ConnectBox should get a parameter to say whether or not it should poll
 * for this update and parse the result and emit it as an event, not sure it works for now.
 */
export class PhotonicSensor {
  public detected = false;
  public readonly event = new EventEmitter();

  constructor(private connectBox: ConnectBox) {
    // Poll the connectbox for status updates
    setInterval(() => {
      this.connectBox.client.send('O131?\n', true)
    }, 250)

    // Parse the data straight from the box to see if something is detected
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
