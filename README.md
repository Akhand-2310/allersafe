# AllerSafe Naming Map

This folder is an easy-to-explain, feature-based copy of the AllerSafe project.
The working application still runs from the original `src/` and `allersafe/` folders.

## Frontend

- `frontend/authentication`: Sign up, sign in, emergency contact form, and session entry UI.
- `frontend/dashboard`: Main workspace overview and allergen watchlist.
- `frontend/menu-scanner`: Menu image upload, OCR/vision analysis request, and scan workflow.
- `frontend/ai-assistant`: Gemini-powered conversational assistant and saved chat history.
- `frontend/analysis-results`: Dish risk levels, detected allergens, and analysis details.
- `frontend/settings`: User profile, allergen preferences, contacts, and logout controls.
- `frontend/emergency-sos`: Location permission, emergency contacts, calls, SMS, and WhatsApp actions.
- `frontend/shared-ui`: Shared layout, styles, animation, navigation, constants, and storage helpers.
- `frontend/AppShell.jsx`: Main frontend route and component composition.

## Backend

- `backend/api-server`: FastAPI application, authentication routes, menu analysis route, chat route, health check, templates, and static assets.
- `backend/ai-analysis`: Gemini menu, image, and conversational AI analysis.
- `backend/ocr`: Local Tesseract OCR integration.
- `backend/risk-engine`: Allergen matching and GREEN/YELLOW/RED risk calculation.

## Important

This is an organized reference copy for GitHub and hackathon presentation. The original working source remains unchanged so existing imports and hosting continue to work.

The backend `.env` file is intentionally not copied because it contains secrets. Keep API keys in environment variables only.
