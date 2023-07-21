import { ConnectBox } from './hardware/connectbox';
import { RobotArm } from './hardware/robotarm';
import { Slider } from './hardware/slider';
import { Belt } from './hardware/belt';
import { StorageRackSequence } from './sequences/storage-rack';
import { PhotonicSensor } from './hardware/photonic-sensor';
import { SortSequence } from './sequences/sort';
import { wait } from './utils';

(async () => {
  const boxOne = new ConnectBox('/dev/tty.usbserial-14410')
  const boxTwo = new ConnectBox('/dev/tty.usbserial-14110')

  const armOne = new RobotArm(boxOne)
  const slider = new Slider(boxOne)
  const armTwo = new RobotArm(boxTwo)
  const belt = new Belt(boxTwo)
  const sensor = new PhotonicSensor(boxTwo)

  // On exit of the process, at least turn off the suction cups
  // maybe do more later?
  process.on('SIGINT', function () {
    armOne.turnOffSuctionCup()
    armTwo.turnOffSuctionCup()
    process.exit()
  })


  // Always home first
  await slider.home();
  await Promise.all([armOne.home(), armTwo.home()])


  // When a block is detected, trigger the sorting sequence
  sensor.event.on('detected', async () => {
    console.log('Saw a block, triggering sorting sequence')
    await wait(5000)
    SortSequence.run(armTwo)
  })

  // When the storage sequence drops a block on the belt, move it
  StorageRackSequence.events.on('dropped', async () => {
    console.log('dropped a block, moving belt')
    await belt.move(490);
  })

  // Start emptying the rack
  StorageRackSequence.run(armOne, slider);
})()
