import os
import json

from dotenv import load_dotenv
from google import genai
from google.genai import types


# Load .env
load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is missing. "
        "Add your Gemini API key to the .env file."
    )

MODEL_NAME = os.getenv(
    "GEMINI_MODEL",
    "gemini-2.5-flash"
)

client = genai.Client(
    api_key=API_KEY
)


SYSTEM_INSTRUCTION = """
You are AllerSafe, an AI assistant that analyzes
restaurant menu text for potential food allergens.

Your job is to identify dishes, ingredients,
possible allergens, and possible cross-contact.

Important:
- Do not claim that food is definitely safe.
- Use only information supported by the menu text.
- If information is uncertain, clearly indicate uncertainty.
- Return ONLY valid JSON.
"""


def analyze_menu(menu_text, user_allergens):

    prompt = f"""
Analyze this restaurant menu.

USER ALLERGEN PROFILE:
{json.dumps(user_allergens)}

MENU TEXT:
{menu_text}

For every identifiable dish, return:

{{
    "summary": "short summary",
    "dishes": [
        {{
            "dish": "dish name",
            "ingredients": [
                "ingredient 1",
                "ingredient 2"
            ],
            "detected_allergens": [
                "Dairy",
                "Peanuts"
            ],
            "possible_cross_contact": false,
            "confidence": "High",
            "explanation": "short explanation"
        }}
    ]
}}

Possible allergen names include:

Peanuts
Tree Nuts
Dairy
Gluten
Eggs
Soy
Shellfish
Fish
Sesame

Rules:

1. detected_allergens should contain allergens
   that are supported by the menu text.

2. possible_cross_contact should be true only when
   the menu wording suggests a possible shared
   preparation/frying environment or similar risk.

3. confidence must be:
   High, Medium, or Low.

4. Do not invent ingredients that are not reasonably
   supported by the menu.

5. Return ONLY JSON.
"""

    try:

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.2,
                response_mime_type="application/json"
            )
        )

        result_text = response.text.strip()

        result = json.loads(result_text)

        return result

    except json.JSONDecodeError:
        raise RuntimeError(
            "Gemini returned invalid JSON."
        )

    except Exception as e:
        raise RuntimeError(
            f"Gemini analysis error: {str(e)}"
        )
