import { EventEmitter } from 'events';
import { IClient, SerialClient, NetClient, INetClientConfig, ISerialClientConfig } from './clients';

export enum Color {
  BLUE = 'Blue',
  GREEN = 'Green',
  RED = 'Red',
}

export class ColorDetectionCamera {
  public readonly events = new EventEmitter()
  public readonly client: IClient;
  private currentColor?: Color;

  constructor(config: INetClientConfig | ISerialClientConfig) {
    if ('path' in config) {
      this.client = new SerialClient(config);
    } else {
      this.client = new NetClient(config);
    }

    this.client.events.on('data', (data: Buffer) => {
      const str = data.toString().replace(/\s/g, '');;
      let color: Color | undefined = undefined;

      if (str === Color.RED) {
        color = Color.RED;
      } else if (str === Color.GREEN) {
        color = Color.GREEN;
      } else if (str === Color.BLUE) {
        color = Color.BLUE;
      }

      if (this.currentColor !== color) {
        this.currentColor = color;
        this.events.emit('color', color);
      } else {
        this.currentColor = color;
      }
    });
  }

  determineColor(): Promise<Color> {
    // TODO add a timeout here
    return new Promise((resolve) => {
      if (this.currentColor) {
        resolve(this.currentColor)
      } else {
        this.events.on('color', resolve);
      }
    });
  }

  // Factory function to combine creation and asynchronous connection setup
  public static async create(config: INetClientConfig | ISerialClientConfig): Promise<ColorDetectionCamera> {
    const camera = new ColorDetectionCamera(config);
    await camera.client.connect();
    return camera;
  }
}
