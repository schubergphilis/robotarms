"""detect a color on the image, within the color_roi"""

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
