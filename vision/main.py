"""color detection for SBP warehouse demo"""
import pyb
from pyb import UART, Pin, Timer
import time
from initcam import init_sensor, init_lcd
from detectrbg import detect_color
import time

# Lcd init
lcd.init()

# Camera initialization
sensor.reset()  # Initialize the camera
sensor.set_pixformat(sensor.RGB565)  # Set the image color format to RGB565 color graph
sensor.set_framesize(sensor.QVGA)  # Set the image size to QVGA (320x240)
sensor.skip_frames(time=2000)  # Wait for the setting to take effect

# Set color threshold, made using the OPENMV ide tools -> machine vision -> threshold editor
# Led light switched on max brightness
THRESHOLDS = [
    (0, 100, 25, 127, -128, 127),  # Red
    (0, 100, -128, -26, -3, 127),  # Green
    (1, 100, -128, 127, -128, -20),  # Blue
]


def detect_color(img, color_roi):
    """Detect color on the image, within the color_roi

    Args:
        img (image): input image
        color_roi (Typle[float, float, float, float]): tuple of len 4 with floats representing the x, y, width, height of the roi

    Returns:
        img:image with blob drawing
        color:str; = "Red" | "Green" | "Blue | "" if no blob found
    """
    blobs = img.find_blobs(THRESHOLDS, roi=color_roi, x_stride=10, y_stride=10, pixels_threshold=50)
    if len(blobs) == 0:
        return img, ""

    # Find the largest blob
    blob = max(blobs, key=lambda b: b.pixels())

    color = ""
    if blob.code() == 1:
        color = "Red"
        img.draw_string(blob.x(), blob.y() + 10, "R")
    elif blob.code() == 2:
        color = "Green"
        img.draw_string(blob.x(), blob.y() + 10, "G")
    elif blob.code() == 4:
        color = "Blue"
        img.draw_string(blob.x(), blob.y() + 10, "B")

    return img, color



FOCUS_X=220
FOCUS_Y=220

# Set up the sorting area
color_roi = (FOCUS_X - 75, FOCUS_Y - 75, 70, 70)

pyb.LED(2).on()  # Green light on

# Setup serial connection to output colors on
uart = UART(3, 19200, timeout_char = 1000)

while True:
    time.sleep(.5)

    img = sensor.snapshot()  # Get image

    img, color = detect_color(img, color_roi)
    if color == "":
        continue

    img.draw_rectangle(color_roi[0], color_roi[1], color_roi[2], color_roi[3], color=(0, 0, 0), thickness=1, fill=False)
    lcd.display(img, roi=color_roi)  # lcd display
    uart.write(color)
    print(color)
