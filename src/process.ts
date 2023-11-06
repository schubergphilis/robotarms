import { ConnectBox } from './hardware/connectbox';
import { RobotArm } from './hardware/robotarm';
import { Belt } from './hardware/belt';
import { SortSequence, SortSequenceState } from './sequences/sort';
import { logger, LogLevel } from './logger';
import { ColorCamera } from './hardware/color-camera';
import { PhotonicSensor, PhotonicEvents } from './hardware/photonic-sensor';

(async () => {
  logger.setLogLevel(LogLevel.Debug)

  // Use network connections
  const boxTwo = await ConnectBox.create({ host: '10.22.0.122', port: 3000, name: 'Box 2' }, true);
  const camera = await ColorCamera.create({ host: '10.22.0.123', port: 3000 });
  const sensor = new PhotonicSensor(boxTwo);

  // Initialise hardware abstractions
  const armTwo = new RobotArm(boxTwo);
  const belt = new Belt(boxTwo);

  // Always home first
  logger.info('Homing slider and arms');
  await armTwo.home();

  // When a block detected, trigger sorting sequence, only when there is no sequence running
  sensor.event.on(PhotonicEvents.DETECTED, async () => {
    if (SortSequence.state === SortSequenceState.IDLE) {
      await SortSequence.run(armTwo, belt, camera).catch(() => {
        logger.error('Error occured in sort sequence');
      });
    }
  });

})().catch((error: unknown) => {
  console.error(error);
  logger.error(error as string);
  process.exit();
});
