import os
import json
import uuid
import base64
import hashlib
import hmac
import re
import secrets
import threading

from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

from ocr import extract_text
from ai_analyzer import analyze_menu, analyze_menu_image, answer_question
from risk_engine import calculate_risk


# ==========================================
# CREATE FASTAPI APP
# ==========================================

app = FastAPI(title="AllerSafe AI Menu Scanner")

# This is intentionally a small, local-only account store for the hackathon
# demo. It lets people create a profile without adding an external database.
APP_DIRECTORY = os.path.dirname(os.path.abspath(__file__))
USER_STORE_PATH = os.path.join(APP_DIRECTORY, "demo_users.json")
USER_STORE_LOCK = threading.Lock()
SESSION_COOKIE_NAME = "allersafe_demo_session"
# Set SESSION_SECRET in .env before exposing the app outside a local demo.
SESSION_SECRET = os.getenv("SESSION_SECRET", "allersafe-local-demo-session-key")


# ==========================================
# FOLDERS
# ==========================================

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ==========================================
# STATIC FILES
# ==========================================

app.mount(
    "/static",
    StaticFiles(directory="static"),
    name="static"
)


# ==========================================
# TEMPLATES
# ==========================================

templates = Jinja2Templates(
    directory="templates"
)


# ==========================================
# LOCAL DEMO AUTHENTICATION
# ==========================================


class EmergencyContact(BaseModel):
    name: str
    phone: str
    relation: str


class SignUpPayload(BaseModel):
    name: str
    email: str
    password: str
    contacts: list[EmergencyContact]


class SignInPayload(BaseModel):
    email: str
    password: str


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatPayload(BaseModel):
    message: str
    allergens: list[str] = []
    history: list[ChatMessage] = []


def load_users():
    """Read the small local demo account store without exposing passwords."""
    if not os.path.exists(USER_STORE_PATH):
        return {}

    try:
        with open(USER_STORE_PATH, "r", encoding="utf-8") as file:
            users = json.load(file)
        return users if isinstance(users, dict) else {}
    except (OSError, json.JSONDecodeError):
        return {}


def save_users(users):
    """Atomically write local demo accounts so a partial write is not kept."""
    temporary_path = USER_STORE_PATH + ".tmp"
    with open(temporary_path, "w", encoding="utf-8") as file:
        json.dump(users, file, indent=2)
    os.replace(temporary_path, USER_STORE_PATH)


def password_record(password):
    salt = secrets.token_hex(16)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        390000,
    ).hex()
    return {"salt": salt, "password_hash": password_hash}


def password_matches(password, stored_user):
    salt = stored_user.get("salt", "")
    expected_hash = stored_user.get("password_hash", "")
    if not salt or not expected_hash:
        return False

    actual_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        390000,
    ).hex()
    return hmac.compare_digest(actual_hash, expected_hash)


def create_session_token(email):
    encoded_email = base64.urlsafe_b64encode(email.encode("utf-8")).decode("ascii")
    signature = hmac.new(
        SESSION_SECRET.encode("utf-8"),
        encoded_email.encode("ascii"),
        hashlib.sha256,
    ).hexdigest()
    return f"{encoded_email}.{signature}"


def session_email(request):
    token = request.cookies.get(SESSION_COOKIE_NAME, "")
    try:
        encoded_email, supplied_signature = token.rsplit(".", 1)
    except ValueError:
        return None

    expected_signature = hmac.new(
        SESSION_SECRET.encode("utf-8"),
        encoded_email.encode("ascii"),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(supplied_signature, expected_signature):
        return None

    try:
        return base64.urlsafe_b64decode(encoded_email.encode("ascii")).decode("utf-8")
    except (UnicodeDecodeError, ValueError):
        return None


def signed_session_response(content):
    response = JSONResponse(content=content)
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=create_session_token(content["email"]),
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        samesite="lax",
    )
    return response


def current_user(request):
    user_email = session_email(request)
    if not user_email:
        return None

    with USER_STORE_LOCK:
        return load_users().get(user_email)


def require_user(request):
    user = current_user(request)
    if user is None:
        return None
    return user


@app.get("/", response_class=HTMLResponse)
async def home():
    return RedirectResponse(url="/login", status_code=302)


@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    if current_user(request):
        return RedirectResponse(url="/dashboard", status_code=302)

    return templates.TemplateResponse(
        request=request,
        name="login.html",
    )


@app.post("/api/auth/signup")
async def sign_up(payload: SignUpPayload, request: Request):
    name = payload.name.strip()
    email = payload.email.strip().lower()
    password = payload.password
    contacts = [
        {
            "name": contact.name.strip(),
            "phone": contact.phone.strip(),
            "relation": contact.relation.strip(),
        }
        for contact in payload.contacts
        if contact.name.strip() and contact.phone.strip() and contact.relation.strip()
    ]

    if not name or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise HTTPException(status_code=400, detail="Enter a valid name and email address.")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Use a password with at least 6 characters.")
    if not contacts:
        raise HTTPException(
            status_code=400,
            detail="Add at least one complete emergency contact.",
        )

    with USER_STORE_LOCK:
        users = load_users()
        if email in users:
            raise HTTPException(
                status_code=409,
                detail="An account with this email already exists. Please sign in.",
            )

        users[email] = {
            "name": name,
            "email": email,
            "contacts": contacts,
            **password_record(password),
        }
        save_users(users)

    return signed_session_response(
        {"success": True, "redirect": "/dashboard", "email": email}
    )


@app.post("/api/auth/signin")
async def sign_in(payload: SignInPayload, request: Request):
    email = payload.email.strip().lower()

    with USER_STORE_LOCK:
        user = load_users().get(email)

    if not user or not password_matches(payload.password, user):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")

    return signed_session_response(
        {"success": True, "redirect": "/dashboard", "email": email}
    )


@app.get("/api/auth/me")
async def get_current_user(request: Request):
    user = current_user(request)
    if user is None:
        raise HTTPException(status_code=401, detail="You are not signed in.")

    return {
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "contacts": user.get("contacts", []),
    }


@app.post("/logout")
async def logout(request: Request):
    response = RedirectResponse(url="/login", status_code=303)
    response.delete_cookie(SESSION_COOKIE_NAME)
    return response


# ==========================================
# DASHBOARD
# ==========================================

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    user = require_user(request)
    if user is None:
        return RedirectResponse(url="/login", status_code=303)

    return templates.TemplateResponse(
        request=request,
        name="dashboard.html",
        context={"user": user},
    )


# ==========================================
# AI MENU SCANNER
# ==========================================

@app.get("/scanner", response_class=HTMLResponse)
async def scanner(request: Request):

    if require_user(request) is None:
        return RedirectResponse(url="/login", status_code=303)

    return templates.TemplateResponse(
        request=request,
        name="index.html"
    )


# ==========================================
# HEALTH CHECK
# ==========================================

@app.get("/health")
async def health():

    return {
        "status": "OK",
        "message": "AllerSafe backend is running"
    }


@app.post("/api/chat")
async def chat_endpoint(payload: ChatPayload, request: Request):
    if require_user(request) is None:
        raise HTTPException(status_code=401, detail="You are not signed in.")

    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    if len(message) > 2000:
        raise HTTPException(status_code=400, detail="Message is too long.")

    try:
        answer = answer_question(
            message,
            payload.allergens,
            [item.model_dump() for item in payload.history],
        )
        return {"answer": answer}
    except RuntimeError as error:
        return JSONResponse(status_code=502, content={"error": str(error)})


# ==========================================
# MENU ANALYSIS API
# ==========================================

@app.post("/analyze")
async def analyze_menu_endpoint(

    image: UploadFile = File(...),

    allergens: str = Form(...)
):

    file_path = None

    try:

        # --------------------------------------
        # CHECK IMAGE TYPE
        # --------------------------------------

        allowed_types = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ]

        if image.content_type not in allowed_types:

            return JSONResponse(
                status_code=400,
                content={
                    "error":
                    "Please upload JPG, PNG or WEBP image."
                }
            )


        # --------------------------------------
        # READ ALLERGEN PROFILE
        # --------------------------------------

        try:

            user_allergens = json.loads(allergens)

            if not isinstance(user_allergens, list):
                raise ValueError

        except Exception:

            return JSONResponse(
                status_code=400,
                content={
                    "error":
                    "Invalid allergen profile."
                }
            )


        # --------------------------------------
        # SAVE IMAGE
        # --------------------------------------

        extension = os.path.splitext(
            image.filename
        )[1].lower()

        filename = (
            uuid.uuid4().hex
            + extension
        )

        file_path = os.path.join(
            UPLOAD_FOLDER,
            filename
        )


        image_data = await image.read()


        if not image_data:

            return JSONResponse(
                status_code=400,
                content={
                    "error":
                    "Uploaded image is empty."
                }
            )


        # 10 MB limit

        if len(image_data) > 10 * 1024 * 1024:

            return JSONResponse(
                status_code=400,
                content={
                    "error":
                    "Image must be smaller than 10 MB."
                }
            )


        with open(
            file_path,
            "wb"
        ) as file:

            file.write(image_data)


        # ======================================
        # OCR
        # ======================================

        print()
        print("====================")
        print("RUNNING OCR...")
        print("====================")


        try:
            menu_text = extract_text(file_path)
            ai_result = analyze_menu(menu_text, user_allergens)
        except RuntimeError as ocr_error:
            if "Tesseract" not in str(ocr_error):
                raise
            menu_text = "OCR unavailable; Gemini analyzed the uploaded menu image directly."
            ai_result = analyze_menu_image(image_data, image.content_type, user_allergens)


        print()
        print("OCR RESULT:")
        print(menu_text)


        if not menu_text.strip():

            return JSONResponse(
                status_code=400,
                content={
                    "error":
                    "No text detected in menu."
                }
            )


        # ======================================
        # RISK ANALYSIS
        # ======================================

        dishes = []


        for dish in ai_result.get(
            "dishes",
            []
        ):

            detected_allergens = dish.get(
                "detected_allergens",
                []
            )


            cross_contact = dish.get(
                "possible_cross_contact",
                False
            )


            risk = calculate_risk(

                detected_allergens,

                user_allergens,

                cross_contact
            )


            dishes.append({

                "dish":
                    dish.get(
                        "dish",
                        "Unknown dish"
                    ),

                "ingredients":
                    dish.get(
                        "ingredients",
                        []
                    ),

                "detected_allergens":
                    detected_allergens,

                "possible_cross_contact":
                    cross_contact,

                "confidence":
                    dish.get(
                        "confidence",
                        "Unknown"
                    ),

                "explanation":
                    dish.get(
                        "explanation",
                        ""
                    ),

                "risk":
                    risk

            })


        # ======================================
        # FINAL RESPONSE
        # ======================================

        return {

            "success": True,

            "ocr_text":
                menu_text,

            "summary":
                ai_result.get(
                    "summary",
                    "Analysis completed."
                ),

            "user_allergens":
                user_allergens,

            "dishes":
                dishes

        }


    # ==========================================
    # ERROR HANDLING
    # ==========================================

    except Exception as e:

        print()
        print("ERROR:")
        print(str(e))


        return JSONResponse(

            status_code=500,

            content={
                "error": str(e)
            }

        )


    # ==========================================
    # DELETE TEMP IMAGE
    # ==========================================

    finally:

        if (
            file_path
            and os.path.exists(file_path)
        ):

            try:

                os.remove(file_path)

            except Exception:

                pass
