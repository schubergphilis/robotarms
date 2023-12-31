import { ConnectBox } from './hardware/connectbox';
import { RobotArm } from './hardware/robotarm';
import { Slider } from './hardware/slider';
import { Belt } from './hardware/belt';
import { EmptyStorageRackSequence, Events as EmptyStorageRackSequenceEvents} from './sequences/empty-storage-rack';
// import { FillStorageRackSequence, Events as FillStorageRackEvents } from './sequences/fill-storage-rack';
import { SortSequence } from './sequences/sort';
import { logger, LogLevel } from './logger';
import { ColorCamera } from './hardware/color-camera';

(async () => {
  logger.setLogLevel(LogLevel.Debug)

  // Use network connections
  const boxOne = await ConnectBox.create({ host: '10.22.0.121', port: 3000, name: 'Box 1' }, true);
  const boxTwo = await ConnectBox.create({ host: '10.22.0.122', port: 3000, name: 'Box 2' }, true);
  const camera = await ColorCamera.create({ host: '10.22.0.123', port: 3000 });

  // Initialise hardware abstractions
  const armOne = new RobotArm(boxOne);
  const slider = new Slider(boxOne);
  const armTwo = new RobotArm(boxTwo);
  const belt = new Belt(boxTwo);

  // On exit of the process, at least turn off the suction cups
  process.on('SIGINT', () => {
    logger.debug('Received SIGINT, exiting....');
    boxOne.client.send('M3 S0'); // Turns off the suction cup
    boxTwo.client.send('M3 S0');
    process.exit();
  })

  // Always home first
  logger.info('Homing slider and arms');
  await slider.home();
  await Promise.all([armOne.home(), armTwo.home()]);

  // When ready to drop the block, check if the other arm/belt/sequence is ready for it
  EmptyStorageRackSequence.events.on(EmptyStorageRackSequenceEvents.READY_TO_DROP, async () => {
    logger.info('Ready to drop block, waiting for confirmation');
    await SortSequence.waitForIdle();
    logger.info('Dropping block');
    EmptyStorageRackSequence.events.emit(EmptyStorageRackSequenceEvents.DROP_BLOCK);
  });

  // When the storage sequence drops a block on the belt, move it
  EmptyStorageRackSequence.events.on(EmptyStorageRackSequenceEvents.DROPPED, async () => {
    logger.info('Block received, moving belt');

    await SortSequence.run(armTwo, belt, camera).catch((e) => {
      logger.error('Error occured in sort sequence');
      console.error(e);
    })
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

  // Once finished, exit the process
  EmptyStorageRackSequence.events.on(EmptyStorageRackSequenceEvents.FINISHED, () => {
    logger.info('Finished emptying the storage rack');
    logger.info('Waiting for last storting sequence to finish');

    SortSequence.waitForIdle()
      .then(() => {
        logger.info('Finished sorting, all done');
        process.exit();
      })
  })

  // Start emptying the rack
  EmptyStorageRackSequence.run(armOne, slider);
})().catch((error: unknown) => {
  console.error(error);
  logger.error(error as string);
  process.exit();
});
