import { SerialPort } from "serialport";
import { DelimiterParser } from '@serialport/parser-delimiter';

interface ICommand {
  resolve: (data: string) => void;
  reject: () => void;
  command: string;
}


export class ConnectBox {
  private port: SerialPort;
  private parser: DelimiterParser;
  private commands: ICommand[] = [];

  constructor(port: string, baudRate = 115200) {
    this.port = new SerialPort({ path: port, baudRate })

    // When the delimiter 'ok' comes by we assume the command has finished
    // executing and we can continue.
    //
    // @TODO we should probably implement a custom parser to recognise errors like
    // HardLimit etc and act on that....
    //
    this.parser = this.port.pipe(new DelimiterParser({ delimiter: 'ok' }))
    this.parser.on('data', (data: Buffer) => {
      const command = this.commands.shift()
      command?.resolve(data.toString())

      // if there is another command queued, call it
      if (this.commands.length > 0) {
        this.executeNextCommand();
      }
    });
  }

  public send(cmd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const command: ICommand = { command: cmd, resolve, reject }
      this.commands.push(command)

      // If only one command execute, otherwise it will get queued and executed
      // when the previous command finishes
      if (this.commands.length === 1) {
        this.executeNextCommand()
      }
    })
  }

  private executeNextCommand() {
    const command = this.commands[0]
    this.port.write(command?.command)
  }
}
