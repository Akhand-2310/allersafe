def calculate_risk(
    detected_allergens,
    user_allergens,
    cross_contact=False
):
    detected = {
        str(x).strip().lower()
        for x in detected_allergens
    }

    user = {
        str(x).strip().lower()
        for x in user_allergens
    }

    matches = sorted(
        detected.intersection(user)
    )

    # RED = user's allergen detected
    if matches:
        return {
            "level": "RED",
            "score": 90,
            "matches": matches,
            "reason":
                "This dish may contain an allergen from your profile."
        }

    # YELLOW = possible cross-contact
    if cross_contact:
        return {
            "level": "YELLOW",
            "score": 55,
            "matches": [],
            "reason":
                "No direct allergen was identified, but possible cross-contact exists."
        }

    # GREEN = no selected allergen identified
    return {
        "level": "GREEN",
        "score": 10,
        "matches": [],
        "reason":
            "No selected allergen was identified from the available menu information."
    }
