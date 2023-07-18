import serial
import io
import logging
from enum import Enum

class Axis(Enum):
    X = 'X'
    Y = 'Y'
    Z = 'Z'

class RobotArm:
  def __init__(self, port):
    # Open serial connection to RobotARM
    self.ser = serial.Serial(port, 115200, timeout=1)
    self.sio = io.TextIOWrapper(io.BufferedRWPair(self.ser, self.ser))

  def send_command(self, cmd):
    self.sio.write(cmd)

    inByte = ''
    while inByte.find('ok') == -1:
      self.sio.flush()
      inByte = self.sio.read()
      # print(inByte)
    print('Finished movement, continueing')

  def home(self):
    self.send_command('$H7')
    self.send_command('$H')

  def slider_move_to(self, position):
    self.send_command(f'G90 G01 D{position} F2000')

  def turn_on_suction_cup(self):
    self.send_command('M3S1000M4E65')

  def suction_cup_blow(self):
    self.send_command('M3S500')

  def turn_off_suction_cup(self):
    self.send_command('M3S0M4E45')

  def move_to_coordinates(self, x, y, z):
    self.send_command(f'M20 G90 G01 X{x} Y{y} Z{z} A0.00 B-95.00 C0.00 F2000.00')

  def move_to_coordinates(self, x, y, z, a, b, c):
    self.send_command(f'M20 G90 G01 X{x} Y{y} Z{z} A{a} B{b} C{c} F2000.00')

  def move_axis_relative(self, axis, value):
    self.send_command(f'M20 G91 {axis}{value}')

arm = RobotArm('/dev/tty.usbserial-14410')
arm.home()

# Move to initial location before pickup
arm.move_to_coordinates(x=260, y=0, z=55, a=0, b=-95, c=0)

# # Move to location 1
arm.slider_move_to(180)

arm.move_axis_relative('X', '17')
arm.turn_on_suction_cup()
arm.move_axis_relative('Z', '10')
arm.move_axis_relative('X', '-50')

arm.slider_move_to(218)
arm.move_axis_relative('X', '50')
arm.move_axis_relative('Z', '-10')
arm.suction_cup_blow()
arm.turn_off_suction_cup()

arm.move_axis_relative('Z', '10')
arm.move_axis_relative('X', '-50')
