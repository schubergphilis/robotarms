import { EventEmitter } from 'events';
import { RobotArm, Axis } from '../hardware/robotarm';
import { Slider } from '../hardware/slider';
import { Storage } from '../helpers/storage';

// These numbers correspond with the postion of the slider to pick up the items from the slide.
// So if you need to move/calibrate parallel to the slides, adjust these numbers
const slides = [75.5, 138, 205.5];
const itemsPerSlide = 4;

export enum Events {
  STARTED = 'STARTED',
  STORED_ITEM = 'STORED_ITEM',
  FINISHED = 'FINISHED',
}

export abstract class FillStorageRackSequence {
  static events = new EventEmitter();

  static async run(arm: RobotArm, slider: Slider): Promise<void> {
    // Notify we started
    this.events.emit(Events.STARTED);

    // Counter used in the items loop to determine storage location
    let storageIndex = 0;

    // Go to each slide and empty it
    for (const slide of slides) {

      // For all items in the slide move them back into the storage rack
      for (let j = 0; j < itemsPerSlide; j++) {
        await slider.moveTo(slide);

        // Move to the pick up position, lower the arm, turn on suction and raise the block
        await arm.goToCoordinateAbsolute({ X: -222, Y: 110, Z: 48, A: -5.00, B: 25.00, C: 0.00 })
        await arm.moveAxisRelative(Axis.Z, -6);
        await arm.turnOnSuctionCup();
        await arm.moveAxisRelative(Axis.Z, 6);
        await arm.goToCoordinateAbsolute({ X: -222, Y: 110, Z: 120, A: -5.00, B: 25.00, C: 0.00 })

        // Have storage store the item
        await Storage.storeItem(arm, slider, storageIndex);

        // Reset the arm
        await arm.goToAngle({ X: 0, Y: 0, Z: 0, A: 0, B: 0, C: 0 });
        storageIndex++;

        this.events.emit(Events.STORED_ITEM);
      }
    }

    // Notify we are done
    this.events.emit(Events.FINISHED);
  }
}
