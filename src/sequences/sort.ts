import { EventEmitter } from 'events';
import { IPosition, RobotArm, Axis } from '../hardware/robotarm';

const pickupLocation: IPosition = { X: 229.69, Y:60.53, Z: 97.96, A: 0, B: 0, C: 0 }

export abstract class SortSequence {
  static events = new EventEmitter();


  static async run(arm: RobotArm): Promise<void> {
    await arm.goToCoordinateAbsolute(pickupLocation)
    await arm.moveAxisRelative(Axis.Z, -15.135)
    await arm.turnOnSuctionCup()
    await arm.goToCoordinateAbsolute(pickupLocation)
    await arm.goToCoordinateAbsolute({ X: 95, Y: -256.77, Z: 147.77, A: 0, B: 0, C: 0})
    await arm.turnOffSuctionCup()
    await arm.goToCoordinateAbsolute({ X: 198.67, Y: 0, Z: 230.72, A: 0, B: 0, C: 0})
  }
}
