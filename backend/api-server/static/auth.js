const views = document.querySelectorAll("#choiceView, #signupView, #signinView");
const signupForm = document.getElementById("signupView");
const signinForm = document.getElementById("signinView");
const contactList = document.getElementById("emergencyContacts");
const contactTemplate = document.getElementById("contactTemplate");

function showView(viewId) {
    views.forEach(view => view.classList.toggle("hidden", view.id !== viewId));
    hideError(document.getElementById("signupError"));
    hideError(document.getElementById("signinError"));
}

function showError(element, message) {
    element.textContent = message;
    element.hidden = false;
}

function hideError(element) {
    element.textContent = "";
    element.hidden = true;
}

function renumberContacts() {
    const cards = contactList.querySelectorAll(".contact-card");
    cards.forEach((card, index) => {
        card.querySelector(".contact-number").textContent = index + 1;
        card.querySelector(".remove-contact").hidden = cards.length === 1;
    });
}

function addContact() {
    const contact = contactTemplate.content.cloneNode(true);
    contact.querySelector(".remove-contact").addEventListener("click", event => {
        event.currentTarget.closest(".contact-card").remove();
        renumberContacts();
    });
    contactList.appendChild(contact);
    renumberContacts();
}

async function submitJson(url, payload) {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Something went wrong. Please try again.");
    }
    return data;
}

function submitButton(form) {
    return form.querySelector("button[type='submit']");
}

function setSubmitting(form, isSubmitting) {
    const button = submitButton(form);
    button.disabled = isSubmitting;
    button.dataset.label ||= button.innerHTML;
    button.innerHTML = isSubmitting ? "Please wait…" : button.dataset.label;
}

document.querySelectorAll("[data-show]").forEach(button => {
    button.addEventListener("click", () => showView(button.dataset.show));
});

document.querySelectorAll("[data-password-toggle]").forEach(button => {
    button.addEventListener("click", () => {
        const input = button.parentElement.querySelector("input");
        const willShow = input.type === "password";
        input.type = willShow ? "text" : "password";
        button.textContent = willShow ? "Hide" : "Show";
        button.setAttribute("aria-label", willShow ? "Hide password" : "Show password");
    });
});

document.getElementById("addContact").addEventListener("click", addContact);

signupForm.addEventListener("submit", async event => {
    event.preventDefault();
    const error = document.getElementById("signupError");
    hideError(error);

    const contacts = [...contactList.querySelectorAll(".contact-card")].map(card => ({
        name: card.querySelector(".contact-name").value.trim(),
        phone: card.querySelector(".contact-phone").value.trim(),
        relation: card.querySelector(".contact-relation").value.trim(),
    }));
    const payload = {
        name: signupForm.elements.name.value.trim(),
        email: signupForm.elements.email.value.trim(),
        password: signupForm.elements.password.value,
        contacts,
    };

    if (!payload.name || !payload.email || !payload.password || !contacts.some(contact => contact.name && contact.phone && contact.relation)) {
        showError(error, "Please fill in your name, email, password, and at least one complete emergency contact with name, number, and relationship.");
        return;
    }

    setSubmitting(signupForm, true);
    try {
        const result = await submitJson("/api/auth/signup", payload);
        window.location.assign(result.redirect);
    } catch (requestError) {
        showError(error, requestError.message);
        setSubmitting(signupForm, false);
    }
});

signinForm.addEventListener("submit", async event => {
    event.preventDefault();
    const error = document.getElementById("signinError");
    hideError(error);
    const payload = {
        email: signinForm.elements.email.value.trim(),
        password: signinForm.elements.password.value,
    };

    if (!payload.email || !payload.password) {
        showError(error, "Enter your email and password to sign in.");
        return;
    }

    setSubmitting(signinForm, true);
    try {
        const result = await submitJson("/api/auth/signin", payload);
        window.location.assign(result.redirect);
    } catch (requestError) {
        showError(error, requestError.message);
        setSubmitting(signinForm, false);
    }
});

addContact();
