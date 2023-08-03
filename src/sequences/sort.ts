import { EventEmitter } from 'events';
import { IPosition, RobotArm, Axis } from '../hardware/robotarm';
import { ColorDetectionCamera, Color } from '../hardware';
import { logger } from '../logger';
import chalk from 'chalk';

// Pickup config
const pickupLocation: IPosition = { X: -79.69, Y: 219.6, Z: 105.90, A: 0, B: 0, C: 0 };
const pickupDistance = 15;

// Drop off config
const dropLocations = {
  [Color.GREEN]: { X: 244,  Y: 67,  Z: 250, A: 0.00, B: 0.00, C: 0.00 },
  [Color.BLUE]:  { X: 244,  Y: 11,  Z: 250, A: 0.00, B: 0.00, C: 0.00 },
  [Color.RED]:   { X: 244,  Y: -45,  Z: 250, A: 0.00, B: 0.00, C: 0.00 },
}

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

  static async run(arm: RobotArm, camera: ColorDetectionCamera): Promise<void> {
    SortSequence.state = SortSequenceState.RUNNING;
    SortSequence.events.emit(SortSequenceEvents.STARTED);

    // Determine the color before picking it up
    const color = await camera.determineColor();

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

    // Move the arm to the drop off point
    const dropLocation = dropLocations[color];
    await arm.goToCoordinateAbsolute(dropLocation);
    await arm.moveAxisRelative(Axis.Z, -45);
    await arm.turnOffSuctionCup()
    await arm.moveAxisRelative(Axis.Z, 45);

    // Set state to IDLE and notify we are finished
    SortSequence.state = SortSequenceState.IDLE;
    SortSequence.events.emit(SortSequenceEvents.FINISHED);
  }

  static waitForIdle(): Promise<void> {
    // TODO add a timeout here?
    return new Promise((resolve) => {
      if (this.state === SortSequenceState.IDLE) {
        resolve()
      } else {
        this.events.once(SortSequenceEvents.FINISHED, resolve);
      }
    })
  }
}
