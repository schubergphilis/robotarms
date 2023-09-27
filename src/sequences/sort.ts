import { EventEmitter } from 'events';
import { IPosition, RobotArm, Axis } from '../hardware/robotarm';
import { ColorCamera, Color, Belt } from '../hardware';
import { logger } from '../logger';
import chalk from 'chalk';

// This is location to pickup the block from the belt. It should be slightly above the block/belt
const pickupLocation: IPosition = { X: -44.10, Y: 221.2, Z: 112.70, A: 0, B: 0, C: 0 };

// This is the amount the arm will lower from the above pickupLocation to pickup the item
const pickupDistance = 10;

// These are the arm positions for each color and where to drop them, should be hovering above the position
const dropLocations = {
  [Color.GREEN]: { X: 246,  Y: 12,  Z: 230, A: 0, B: 0, C: 0 },
  [Color.BLUE]:  { X: 246,  Y: -30,  Z: 230, A: 0, B: 0, C: 0 },
  [Color.RED]:   { X: 246,  Y: -70,  Z: 230, A: 0, B: 0, C: 0 },
}

// This is the amount the arm gets lowered compared to the Z given in the dropLocations above
const dropDistance = 30;

export enum SortSequenceEvents {
  STARTED = 'STARTED',
  FINISHED = 'FINISHED'
}

export enum SortSequenceState {
  RUNNING,
  IDLE
}

export abstract class SortSequence {
  static events = new EventEmitter();
  static state = SortSequenceState.IDLE;

  static async run(arm: RobotArm, belt: Belt, camera: ColorCamera): Promise<void> {
    SortSequence.state = SortSequenceState.RUNNING;
    SortSequence.events.emit(SortSequenceEvents.STARTED);

    await belt.move(-500);

    // Determine the color before picking it up
    const color = await camera.determineColor();

    // Log which color we detected
    switch(color) {
      case Color.BLUE:
        logger.info(`Detected: ${chalk.bgBlue('BLUE')}`);
        break;
      case Color.GREEN:
        logger.info(`Detected: ${chalk.bgGreen('GREEN')}`);
        break;
      case Color.RED:
        logger.info(`Detected: ${chalk.bgRed('RED')}`);
        break;
    }

    // Go to the pickup location, hovering above it
    await arm.goToCoordinateAbsolute(pickupLocation)

    // Lower the arm, pickup, and raise again
    await arm.moveAxisRelative(Axis.Z, -pickupDistance)
    await arm.turnOnSuctionCup()
    await arm.moveAxisRelative(Axis.Z, pickupDistance)

    // Move to the home position
    await arm.goToAngle({ A: 0, B:0, C: 0, X: 0, Y: 0, Z: 0})

    // Move the arm to the drop off point, lower, drop and raise again
    const dropLocation = dropLocations[color];
    await arm.goToCoordinateAbsolute(dropLocation);
    await arm.moveAxisRelative(Axis.Z, -dropDistance);
    await arm.turnOffSuctionCup()
    await arm.moveAxisRelative(Axis.Z, dropDistance);

    // Set state to IDLE and notify we are finished
    SortSequence.state = SortSequenceState.IDLE;
    SortSequence.events.emit(SortSequenceEvents.FINISHED);
  }

  static waitForIdle(): Promise<void> {
    // Should maybe add an timeout here in the future for resiliance
    return new Promise((resolve) => {
      if (this.state === SortSequenceState.IDLE) {
        resolve()
      } else {
        this.events.once(SortSequenceEvents.FINISHED, resolve);
      }
    })
  }
}
