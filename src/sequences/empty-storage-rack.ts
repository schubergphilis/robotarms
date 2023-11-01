import { Slider } from "../hardware/slider";
import { Axis, RobotArm } from "../hardware/robotarm";
import { EventEmitter } from 'events';
import { logger } from '../logger';
import { Storage } from "../helpers/storage";

const columnCount = 6;
const rowCount = 2;
const pickupPosition = { X: 198, Y: 0, Z: 42, A: 0, B: -90, C: 0};

export enum Events {
  STARTED = 'STARTED',
  READY_TO_DROP = 'READY_TO_DROP',
  DROP_BLOCK = 'DROP_BLOCK',
  DROPPED = 'DROPPED',
  FINISHED = 'FINISHED'
}

export abstract class EmptyStorageRackSequence {
  static events = new EventEmitter();

  static async run(arm: RobotArm, slider: Slider): Promise<void> {
    logger.info('Starting empty storage rack sequence');
    this.events.emit(Events.STARTED);

    // Create an array with indexes and shuffle them
    const itemIndexes = Array
      .from(Array(columnCount * rowCount).keys())
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value)

    // Loop the array with indexes and start pickup up the blocks
    for (const index of itemIndexes) {
      await EmptyStorageRackSequence.pickupIndex(index, arm, slider);
    }

    // Signal that we are done
    logger.info('Finished empty storage rack sequence');
    this.events.emit(Events.FINISHED);
  }

  private static async pickupIndex(index: number, arm: RobotArm, slider: Slider): Promise<void> {
    // Pick up the item and move the arm to hanging position
    await Storage.retrieveItem(arm, slider, index);
    await arm.goToCoordinateAbsolute({ X: 169, Y: 0, Z: 150, A: 0, B: 0, C: 0 })

    // Move the slider to the end position
    await slider.moveTo(365)

    // Move the arm to the hover position on the rack side
    await arm.goToCoordinateAbsolute({ X: 169, Y: 0, Z: 150, A: 0, B: 0, C: 0 });

    // Rotate the arm to the other side, lower towards the belt and notify we are ready to drop the block
    await arm.goToCoordinateAbsolute({ X: -186.33, Y: 80.00, Z: 75, A: 0, B: 0, C: 0 });
    await arm.moveAxisRelative(Axis.Z, -35)
    EmptyStorageRackSequence.events.emit(Events.READY_TO_DROP);

    // Wait for confirmation to drop the block
    await EmptyStorageRackSequence.waitForDropConfirmation()
    await arm.turnOffSuctionCup()
    await arm.moveAxisRelative(Axis.Z, 35)
    EmptyStorageRackSequence.events.emit(Events.DROPPED);

    // Rotate the arm back towards the storage rack side
    await arm.goToAngle({ X: 0, Y: -10.75, Z: 37.92, A: 0, B: -27.17, C: 0 });

    // Move the arm back to the default pickupPosition
    await arm.goToCoordinateAbsolute(pickupPosition)
  }

  private static waitForDropConfirmation(): Promise<void> {
    return new Promise((resolve) => {
      logger.info('Waiting for drop confirmation');
      this.events.once(Events.DROP_BLOCK, () => {
        logger.info('Received drop confirmation');
        resolve();
      });
    })
  }
}
