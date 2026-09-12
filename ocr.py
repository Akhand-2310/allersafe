import os

from PIL import Image
import pytesseract


TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

if os.path.exists(TESSERACT_PATH):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH


def extract_text(image_path):

    if not os.path.exists(image_path):
        raise FileNotFoundError(
            "Menu image was not found."
        )

    try:
        image = Image.open(image_path)
        image = image.convert("RGB")

        text = pytesseract.image_to_string(image)

        text = text.strip()

        if not text:
            raise RuntimeError(
                "Tesseract could not detect text in the image."
            )

        return text

    except pytesseract.TesseractNotFoundError:
        raise RuntimeError(
            "Tesseract OCR is not installed "
            "or the Tesseract path is incorrect."
        )

    except Exception as e:
        raise RuntimeError(
            f"OCR error: {str(e)}"
        )
