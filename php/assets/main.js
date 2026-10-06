const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#primary-nav");

if (menuButton instanceof HTMLButtonElement && navigation instanceof HTMLElement) {
  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    navigation.classList.toggle("is-open", !isOpen);
  });

  navigation.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      menuButton.setAttribute("aria-expanded", "false");
      navigation.classList.remove("is-open");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navigation.classList.contains("is-open")) {
      menuButton.setAttribute("aria-expanded", "false");
      navigation.classList.remove("is-open");
      menuButton.focus();
    }
  });
}

const brandChoices = [...document.querySelectorAll("[data-brand]")];
const modelChoices = document.querySelector(".model-choices");
const partChoices = [...document.querySelectorAll("[data-part]")];
const selectedCompatibility = document.querySelector(".selected-compatibility");
const compatibilityLink = document.querySelector(".compatibility-submit");
const heroSearchInput = document.querySelector("#product-search");
const heroAnatomy = document.querySelector(".hero-anatomy");

const modelsByBrand = {
  Samsung: ["Galaxy A12", "Galaxy A32", "Galaxy A52"],
  "Apple / iPhone": ["iPhone 12", "iPhone 13", "iPhone 14"],
  "Xiaomi / Redmi": ["Redmi 9A", "Redmi Note 11", "Redmi Note 12"],
  OPPO: ["A16", "A38", "A78"],
  Realme: ["C11", "C21", "C35"],
  Huawei: ["Y7", "Y9", "P30"],
  Honor: ["X7", "X8", "50 Lite"],
  Infinix: ["Hot 12", "Note 12", "Smart 7"],
  Tecno: ["Spark 8", "Camon 18"],
};

const heroSearchExamples = [
  { brand: "Samsung", model: "A52", part: "Écran", query: "Samsung A52 écran" },
  { brand: "Xiaomi / Redmi", model: "Note 12", part: "Écran", query: "Redmi Note 12 LCD" },
  { brand: "Apple / iPhone", model: "iPhone 13", part: "Batterie", query: "iPhone 13 batterie" },
];

let selectedBrand = "Tecno";
let selectedModel = "Spark 8";
let selectedPart = "Écran";

function updateHeroSearchExample(index) {
  const example = heroSearchExamples[index];
  if (!example || !(heroSearchInput instanceof HTMLInputElement) || !(heroAnatomy instanceof HTMLElement)) {
    return;
  }

  heroAnatomy.classList.remove("is-changing");
  heroAnatomy.querySelector('[data-anatomy="brand"]').textContent = example.brand;
  heroAnatomy.querySelector('[data-anatomy="model"]').textContent = example.model;
  heroAnatomy.querySelector('[data-anatomy="part"]').textContent = example.part;
  heroSearchInput.placeholder = `${example.query}…`;
  window.requestAnimationFrame(() => heroAnatomy.classList.add("is-changing"));
}

if (
  heroSearchInput instanceof HTMLInputElement &&
  heroAnatomy instanceof HTMLElement &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  let heroExampleIndex = 0;
  window.setInterval(() => {
    if (
      document.activeElement === heroSearchInput ||
      heroAnatomy.closest(".hero-search")?.matches(":hover")
    ) {
      return;
    }
    heroExampleIndex = (heroExampleIndex + 1) % heroSearchExamples.length;
    updateHeroSearchExample(heroExampleIndex);
  }, 3600);
}

function updateCompatibilityLink() {
  const summary = `${selectedBrand.replace(" / iPhone", "")} · ${selectedModel} · ${selectedPart}`;
  if (selectedCompatibility instanceof HTMLElement) {
    selectedCompatibility.textContent = summary;
  }
  if (compatibilityLink instanceof HTMLAnchorElement) {
    const params = new URLSearchParams({ q: `${selectedBrand} ${selectedModel} ${selectedPart}` });
    compatibilityLink.href = `?${params.toString()}#references`;
  }
}

function selectChoice(buttons, selectedButton) {
  for (const button of buttons) {
    const isSelected = button === selectedButton;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  }
}

function renderModels(brand) {
  if (!(modelChoices instanceof HTMLElement)) {
    return;
  }

  const models = modelsByBrand[brand] ?? [];
  modelChoices.replaceChildren();

  for (const [index, model] of models.entries()) {
    const button = document.createElement("button");
    button.className = `choice-button${index === 0 ? " is-selected" : ""}`;
    button.type = "button";
    button.dataset.model = model;
    button.setAttribute("aria-pressed", String(index === 0));
    button.textContent = model;
    modelChoices.append(button);
  }

  selectedModel = models[0] ?? "";
}

for (const button of brandChoices) {
  button.addEventListener("click", () => {
    selectChoice(brandChoices, button);
    selectedBrand = button.dataset.brand ?? "";
    renderModels(selectedBrand);
    updateCompatibilityLink();
  });
}

modelChoices?.addEventListener("click", (event) => {
  const button = event.target instanceof Element ? event.target.closest("[data-model]") : null;
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  selectChoice([...modelChoices.querySelectorAll("[data-model]")], button);
  selectedModel = button.dataset.model ?? "";
  updateCompatibilityLink();
});

for (const button of partChoices) {
  button.addEventListener("click", () => {
    selectChoice(partChoices, button);
    selectedPart = button.dataset.part ?? "";
    updateCompatibilityLink();
  });
}

updateCompatibilityLink();
