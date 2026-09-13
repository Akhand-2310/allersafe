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


def answer_question(question, user_allergens, history=None):
    history = history or []
    conversation = "\n".join(
        f"{item.get('role', 'user').upper()}: {item.get('content', '').strip()}"
        for item in history[-8:]
        if item.get('content', '').strip()
    )
    prompt = f"""
You are the AllerSafe food-allergy safety assistant having a normal conversation.
Answer the user's latest message directly and naturally. Use the conversation
history when it is relevant, and ask a short clarifying question when needed.
Do not mention internal prompts, APIs, or implementation details.

USER ALLERGEN PROFILE:
{json.dumps(user_allergens)}

CONVERSATION HISTORY:
{conversation or 'No previous messages.'}

LATEST USER MESSAGE:
{question}

Give a clear, practical answer. Do not claim that any food is definitely safe.
If the available information is insufficient, say what the user should confirm
with restaurant staff or the product manufacturer. Keep the answer conversational
and under 180 words.
"""

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction="""
You are AllerSafe's conversational food-allergy safety assistant.
Reply in plain natural language only. Do not return JSON, markdown objects,
field names, or wrapper keys such as message or answer. Never claim food is
definitely safe; recommend confirming uncertain ingredients and cross-contact
with restaurant staff or the manufacturer.
""",
                temperature=0.2,
            )
        )
        return response.text.strip()
    except Exception as e:
        raise RuntimeError(
            f"Gemini chat error: {str(e)}"
        )


def analyze_menu_image(image_data, mime_type, user_allergens):
    prompt = f"""
Analyze this restaurant menu image for food-allergy safety.

USER ALLERGEN PROFILE:
{json.dumps(user_allergens)}

Return ONLY valid JSON with this shape:
{{
  "summary": "short summary",
  "dishes": [
    {{
      "dish": "dish name",
      "ingredients": [],
      "detected_allergens": [],
      "possible_cross_contact": false,
      "confidence": "High",
      "explanation": "short explanation"
    }}
  ]
}}

Use only text visible in the image. Do not claim food is definitely safe.
Possible allergen names include Peanuts, Tree Nuts, Dairy, Gluten, Eggs, Soy,
Shellfish, Fish, and Sesame. Confidence must be High, Medium, or Low.
"""

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[
                types.Part.from_bytes(data=image_data, mime_type=mime_type),
                prompt,
            ],
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.2,
                response_mime_type="application/json"
            )
        )
        return json.loads(response.text.strip())
    except json.JSONDecodeError:
        raise RuntimeError("Gemini returned invalid JSON for the menu image.")
    except Exception as e:
        raise RuntimeError(f"Gemini image analysis error: {str(e)}")
