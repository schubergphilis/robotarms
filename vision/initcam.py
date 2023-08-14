import sensor, lcd


def init_lcd():
    lcd.init()
    return lcd


def init_sensor():
    # Camera initialization
    sensor.reset()  # Initialize the camera
    sensor.set_pixformat(sensor.RGB565)  # Set the image color format to RGB565 color graph
    sensor.set_framesize(sensor.QVGA)  # Set the image size to QVGA (320x240)
    sensor.skip_frames(time=2000)  # Wait for the setting to take effect
    return sensor
