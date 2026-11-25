const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector("#primary-menu");
const contactDialog = document.querySelector(".contact-dialog");
const contactForm = document.querySelector(".contact-form");
const formFeedback = document.querySelector("#form-feedback");

let modalTrigger = null;

function setMenuOpen(isOpen) {
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
  navMenu.classList.toggle("is-open", isOpen);
  navMenu.inert = !isOpen && window.matchMedia("(max-width: 850px)").matches;
  document.body.classList.toggle("menu-open", isOpen && window.matchMedia("(max-width: 850px)").matches);
}

function initScrollAnimations() {
  const revealElements = document.querySelectorAll(".reveal");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  revealElements.forEach((element) => element.classList.add("hidden"));
  if (!("IntersectionObserver" in window) || prefersReducedMotion) {
    revealElements.forEach((element) => {
      element.classList.remove("hidden");
      element.classList.add("visible");
    });
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove("hidden");
      entry.target.classList.add("visible");
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  revealElements.forEach((element) => observer.observe(element));
}

function openModal(trigger) {
  if (contactDialog.open) return;
  modalTrigger = trigger;
  contactForm.reset();
  contactForm.querySelectorAll("[aria-invalid='true']").forEach((field) => field.removeAttribute("aria-invalid"));
  formFeedback.textContent = "";
  formFeedback.className = "form-feedback";
  formFeedback.hidden = true;
  document.body.classList.add("modal-open");
  contactDialog.showModal();
  contactForm.elements.name.focus();
}

function closeModal() {
  if (!contactDialog.open) return;
  contactDialog.close();
  document.body.classList.remove("modal-open");
  if (modalTrigger && document.contains(modalTrigger)) modalTrigger.focus();
  modalTrigger = null;
}

function trapFocus(event) {
  if (!contactDialog.open || event.key !== "Tab") return;
  const focusableElements = Array.from(contactDialog.querySelectorAll(
    "button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])"
  )).filter((element) => !element.hidden && element.getClientRects().length > 0);

  if (focusableElements.length === 0) {
    event.preventDefault();
    contactDialog.focus();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  if (event.shiftKey && (document.activeElement === firstElement || !contactDialog.contains(document.activeElement))) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && (document.activeElement === lastElement || !contactDialog.contains(document.activeElement))) {
    event.preventDefault();
    firstElement.focus();
  }
}

function initModal() {
  contactDialog.setAttribute("aria-modal", "true");
  setMenuOpen(false);

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-open-modal]");
    if (trigger) {
      setMenuOpen(false);
      openModal(trigger);
      return;
    }
    if (event.target.closest("[data-close-modal]")) closeModal();
  });

  document.addEventListener("pointerdown", (event) => {
    if (!contactDialog.open) return;
    const bounds = contactDialog.getBoundingClientRect();
    const outside = event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom;
    if (outside) closeModal();
  });

  contactDialog.addEventListener("click", (event) => {
    if (event.target === contactDialog) closeModal();
  });
  contactDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && contactDialog.open) {
      event.preventDefault();
      closeModal();
    }
  });
  document.addEventListener("keydown", trapFocus);

  contactForm.addEventListener("input", (event) => {
    if (event.target.matches("input, textarea")) event.target.removeAttribute("aria-invalid");
    formFeedback.hidden = true;
  });
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateForm(contactForm)) {
      contactForm.querySelector("[aria-invalid='true']")?.focus();
      return;
    }

    const name = contactForm.elements.name.value.trim();
    contactForm.elements.name.value = name;
    contactForm.elements.email.value = contactForm.elements.email.value.trim();
    contactForm.elements.message.value = contactForm.elements.message.value.trim();
    formFeedback.className = "form-feedback";
    formFeedback.textContent = `Thanks, ${name}. Your message passed validation. It hasn’t been sent because this is a front-end demo.`;
    formFeedback.hidden = false;
  });
}

function validateForm(form) {
  const fields = [
    { input: form.elements.name, message: "Please enter your name." },
    { input: form.elements.email, message: "Please enter a valid email address." },
    { input: form.elements.message, message: "Please enter a message." }
  ];
  let firstInvalidField = null;

  fields.forEach(({ input }) => {
    const value = input.value.trim();
    const emailInvalid = input.name === "email" &&
      (input.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value));
    if (!value || emailInvalid) {
      input.setAttribute("aria-invalid", "true");
      if (!firstInvalidField) firstInvalidField = input;
    } else {
      input.removeAttribute("aria-invalid");
    }
  });

  if (!firstInvalidField) {
    formFeedback.textContent = "";
    formFeedback.className = "form-feedback";
    formFeedback.hidden = true;
    return true;
  }

  const invalidField = fields.find(({ input }) => input === firstInvalidField);
  formFeedback.className = "form-feedback is-error";
  formFeedback.textContent = invalidField.message;
  formFeedback.hidden = false;
  return false;
}

function initFAQAccordion() {
  const questions = Array.from(document.querySelectorAll(".faq-question"));

  questions.forEach((question, index) => {
    question.addEventListener("click", () => {
      const shouldOpen = question.getAttribute("aria-expanded") !== "true";
      questions.forEach((item) => {
        const answer = document.getElementById(item.getAttribute("aria-controls"));
        const isOpen = item === question && shouldOpen;
        item.setAttribute("aria-expanded", String(isOpen));
        answer.classList.toggle("is-open", isOpen);
        answer.setAttribute("aria-hidden", String(!isOpen));
        answer.inert = !isOpen;
      });
    });

    question.addEventListener("keydown", (event) => {
      let nextIndex;
      if (event.key === "ArrowDown") nextIndex = (index + 1) % questions.length;
      else if (event.key === "ArrowUp") nextIndex = (index - 1 + questions.length) % questions.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = questions.length - 1;
      else return;
      event.preventDefault();
      questions[nextIndex].focus();
    });
  });
}

function initNavigation() {
  menuToggle.addEventListener("click", () => {
    setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
  });
  navMenu.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenuOpen(false);
  });
  document.addEventListener("click", (event) => {
    if (menuToggle.getAttribute("aria-expanded") === "true" &&
      !navMenu.contains(event.target) && !menuToggle.contains(event.target)) setMenuOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      setMenuOpen(false);
      menuToggle.focus();
    }
  });
  window.addEventListener("resize", () => {
    if (window.matchMedia("(min-width: 851px)").matches) setMenuOpen(false);
    else navMenu.inert = menuToggle.getAttribute("aria-expanded") !== "true";
  });
}

initScrollAnimations();
initModal();
initFAQAccordion();
initNavigation();
document.querySelector("#current-year").textContent = String(new Date().getFullYear());
