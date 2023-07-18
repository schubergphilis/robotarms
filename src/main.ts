import { ConnectBox } from './hardware/connectbox';
import { RobotArm } from './hardware/robotarm';
import { Slider } from './hardware/slider';
import { Belt } from './hardware/belt';

const boxOne = new ConnectBox('/dev/tty.usbserial-14410')
const boxTwo = new ConnectBox('/dev/tty.usbserial-14210')

const armOne = new RobotArm(boxOne)
const slider = new Slider(boxOne)
const armTwo = new RobotArm(boxTwo)
const belt = new Belt(boxTwo)

// Start by homing
Promise.all([slider.home(), armOne.home(), armTwo.home()])
  .then(() => {
    console.log('All homed and ready to go!');
  })
