import { ConnectBox } from './hardware/connectbox';
import { RobotArm } from './hardware/robotarm';
import { Slider } from './hardware/slider';
import { Belt } from './hardware/belt';
import { EmptyStorageRackSequence, Events as EmptyStorageRackSequenceEvents} from './sequences/empty-storage-rack';
// import { FillStorageRackSequence, Events as FillStorageRackEvents } from './sequences/fill-storage-rack';
import { PhotonicSensor } from './hardware/photonic-sensor';
import { SortSequence } from './sequences/sort';
import { logger, LogLevel } from './logger';
import { ColorCamera } from './hardware/color-camera';

(async () => {
  logger.setLogLevel(LogLevel.Debug)

  // Use serial connections
  // const boxOne = await ConnectBox.create({ path: '/dev/tty.usbserial-14310', baudRate: 115200 });
  // const boxTwo = await ConnectBox.create({ path: '/dev/tty.usbserial-14210', baudRate: 115200 });
  // const colorDetectionCamera = await ColorDetectionCamera.create({ path: '/dev/tty.usbmodem326B376834301', baudRate: 19200 });

  // Use network connections
  const boxOne = await ConnectBox.create({ host: '10.22.0.121', port: 3000, name: 'Box 1' }, true);
  const boxTwo = await ConnectBox.create({ host: '10.22.0.122', port: 3000, name: 'Box 2' }, true);
  const camera = await ColorCamera.create({ host: '10.22.0.123', port: 3000 });

  // Initialise hardware abstractions
  const armOne = new RobotArm(boxOne);
  const slider = new Slider(boxOne);
  const armTwo = new RobotArm(boxTwo);
  const belt = new Belt(boxTwo);
  const sensor = new PhotonicSensor(boxTwo);

  // On exit of the process, at least turn off the suction cups
  process.on('SIGINT', () => {
    logger.debug('Received SIGINT, exiting....');
    boxOne.client.send('M3 S0', true); // Turns off the suction cup
    boxTwo.client.send('M3 S0', true);
    process.exit();
  })

  // Always home first
  logger.info('Homing slider and arms');
  await slider.home();
  await Promise.all([armOne.home(), armTwo.home()]);

  // When a block is detected, wait for boxTwo (belt and arm) to be idle and then run the sorting sequence
  sensor.event.on('detected', async () => {
    logger.info('Block detected, triggering sorting sequence')
    await boxTwo.waitForIdle();
    SortSequence.run(armTwo, camera).catch((e) => {
      logger.error('Error occured in sort sequence');
      console.error(e);
    })
  });

  // When ready to drop the block, check if the other arm/belt/sequence is ready for it
  EmptyStorageRackSequence.events.on(EmptyStorageRackSequenceEvents.READY_TO_DROP, async () => {
    logger.info('Ready to drop block, waiting for confirmation');
    await boxTwo.waitForIdle();
    logger.info('Dropping block');
    EmptyStorageRackSequence.events.emit(EmptyStorageRackSequenceEvents.DROP_BLOCK);
  });

  // When the storage sequence drops a block on the belt, move it
  EmptyStorageRackSequence.events.on(EmptyStorageRackSequenceEvents.DROPPED, async () => {
    logger.info('Block received, moving belt');
    await belt.move(-500);
  })

  // When the rack is empty, start filling it again
  // EmptyStorageRackSequence.events.on(EmptyStorageRackSequenceEvents.FINISHED, () => {
  //   logger.info('Finished storage rack sequence, starting fill rack sequence');
  //   FillStorageRackSequence.run(armOne, slider);
  // })

  // When the rack is filled again, started emptying it again, loop loop :D
  // FillStorageRackSequence.events.on(FillStorageRackEvents.FINISHED, async() => {
  //   // First home everything before starting a new loop
  //   // This will hopefully help to maintain accuracy over longer periods of running
  //   await slider.home()
  //   await Promise.all([armOne.home(), armTwo.home()]);
  //   EmptyStorageRackSequence.run(armOne, slider);
  // });

  // Start emptying the rack
  EmptyStorageRackSequence.run(armOne, slider);
})().catch((error: unknown) => {
  console.log('An error occured');
  console.error(error);
  process.exit();
});
