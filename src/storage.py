from utils import wait_for_movement
from pyb import UART, Pin, Timer

uart = UART(3, 115200)

uart.write('$H7')
wait_for_movement(uart)
