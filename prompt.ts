/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import inquirer from 'inquirer';
import { ConnectBox, State } from './src/hardware/connectbox';

(async () => {
  const box = await ConnectBox.create({ host: '10.32.16.1', port: 3001 });
  // const box = await ConnectBox.create({ host: '10.32.16.1', port: 3000 });

  async function requestCommand() {
    const answers: any = await inquirer.prompt([{
      type: 'input',
      name: 'command',
      message: 'Command: '
    }])

    box.stateEmitter.once(State.IDLE, () => {
      console.log('-------------------------------------------------');
      requestCommand();
    })

    box.send(answers.command, false, false)
  }

  await requestCommand();
})()
