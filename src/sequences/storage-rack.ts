import { Slider } from "../hardware/slider";
import { Axis, RobotArm } from "../hardware/robotarm";
import { wait } from '../utils';
import { EventEmitter } from 'events';

const columnCount = 6;
const rowCount = 2;

const columnSpacing = 40;
const rowSpacing = 82;


const sliderPositionZero = 153;
const pickupPosition = { X: 198, Y: 0, Z: 52, A: 0, B: -90, C: 0};
const pickUpDistance = 26;


export abstract class StorageRackSequence {
  static events = new EventEmitter();

  static async run(arm: RobotArm, slider: Slider): Promise<void> {
    await arm.goToCoordinateAbsolute(pickupPosition)
    await slider.moveTo(sliderPositionZero)

    const totalItems = columnCount * rowCount;

    // For each item in the rack take it out`
    for (let i = 0; i < totalItems; i++) {
      const now = Date.now();
      const row = Math.floor(i / columnCount);
      const column = i % columnCount;

      await slider.moveTo(calculateSlider(column))
      await arm.goToCoordinateAbsolute({ X: 198, Y: 0, Z: calculateZ(row), A: 0, B: -90, C: 0 })
      await arm.moveAxisRelative(Axis.X, pickUpDistance)
      await arm.turnOnSuctionCup()
      await arm.moveAxisRelative(Axis.Z, 15)
      await arm.moveAxisRelative(Axis.X, -55)
      await arm.goToCoordinateAbsolute({ X: 169, Y: 0, Z: 150, A: 0, B: 0, C: 0 })

      await slider.moveTo(360)

      await arm.goToCoordinateAbsolute({ X: 169, Y: 0, Z: 150, A: 0, B: 0, C: 0 })

      await arm.goToAngle({ X: 156, Y: 44.31, Z: 2.97, A:0, B: -48.28, C: 0 });
      await arm.turnOffSuctionCup()
      StorageRackSequence.events.emit('dropped')
      await arm.goToAngle({ X: 0, Y: -10.75, Z: 37.92, A: 0, B: -27.17, C: 0 });
      await arm.goToCoordinateAbsolute(pickupPosition)

      // Calculate an artificial delay to make the time the process takes
      // per block, sort of consistent, making it easier to sync up with other sequences
      await wait(column * 2000)
      console.log(`Item: ${i} took: ${Date.now() - now}ms`);
    }

    console.log('Finished storage rack sequence')
  }
}

function calculateSlider(column: number): number {
  const position = sliderPositionZero + (column * columnSpacing)
  return position
}

// Transform the index to a position in the storage rack
function calculateZ(row: number): number {
  const position = pickupPosition.Z + (row * rowSpacing)
  return position
}
