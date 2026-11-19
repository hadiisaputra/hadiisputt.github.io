const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector(".nav-menu");

if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", () => {
    navMenu.classList.toggle("active");
    const open = navMenu.classList.contains("active");
    menuToggle.innerHTML = open ? "&#10005;" : "&#9776;";
    menuToggle.setAttribute("aria-expanded", String(open));
  });
}

const navLinks = document.querySelectorAll(".nav-link");
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (navMenu && navMenu.classList.contains("active")) {
      navMenu.classList.remove("active");
      if (menuToggle) menuToggle.innerHTML = "&#9776;";
    }
  });
});

const header = document.querySelector(".header");
window.addEventListener("scroll", () => {
  if (!header) return;
  header.classList.toggle("scrolled", window.scrollY > 50);
});

const sections = document.querySelectorAll("section[id]");
function updateActiveNavigation() {
  const scrollPosition = window.scrollY + 150;
  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute("id");
    const navigationLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
    if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
      navLinks.forEach((link) => link.classList.remove("active"));
      if (navigationLink) navigationLink.classList.add("active");
    }
  });
}
window.addEventListener("scroll", updateActiveNavigation);

const revealElements = document.querySelectorAll(
  ".section-header, .about-text, .skill-card, .timeline-item, .project-card"
);
revealElements.forEach((element) => {
  element.classList.add("js-reveal");
});
function revealOnScroll() {
  const windowHeight = window.innerHeight;
  revealElements.forEach((element) => {
    if (element.getBoundingClientRect().top < windowHeight - 100) {
      element.classList.add("is-visible");
    }
  });
}
window.addEventListener("scroll", revealOnScroll);
window.addEventListener("load", revealOnScroll);

document.querySelectorAll(".skill-card").forEach((card, index) => {
  card.classList.add(`reveal-delay-${index}`);
});
document.querySelectorAll(".project-card").forEach((card, index) => {
  card.classList.add(`reveal-delay-${index}`);
});

const backToTop = document.createElement("button");
backToTop.classList.add("back-to-top");
backToTop.innerHTML = "&#8593;";
backToTop.setAttribute("aria-label", "Back to top");
document.body.appendChild(backToTop);

window.addEventListener("scroll", () => {
  backToTop.classList.toggle("is-visible", window.scrollY > 500);
});

backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.querySelectorAll(".project-image img").forEach((image) => {
  image.addEventListener("error", () => {
    image.parentElement.classList.add("image-error");
  });
});

document.querySelectorAll('a[href="#"]').forEach((link) => {
  link.addEventListener("click", (event) => event.preventDefault());
});

window.addEventListener("load", () => document.body.classList.add("loaded"));

/* ============ QUICK SEARCH (⌘K / Ctrl+K) ============ */
const searchDialog = document.getElementById("search-dialog");
const searchTrigger = document.querySelector(".search-trigger");
const searchTriggerLabel = document.querySelector(".search-trigger-label");
const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");
const searchEmpty = document.getElementById("search-empty");

if (searchDialog && searchTrigger && searchInput && searchResults) {
  // Label shortcut disesuaikan platform: "⌘K" di macOS, "Ctrl+K" di lainnya
  const isMac = /mac|iphone|ipad|ipod/i.test(
    (navigator.userAgentData && navigator.userAgentData.platform) ||
      navigator.platform ||
      navigator.userAgent
  );
  const shortcutText = isMac ? "⌘K" : "Ctrl+K";
  if (searchTriggerLabel) searchTriggerLabel.textContent = shortcutText;
  searchTrigger.setAttribute("aria-label", `Open quick search (${shortcutText})`);

  // Kumpulkan data pencarian: section navigasi + kartu project
  const searchItems = [];
  document.querySelectorAll(".nav-link").forEach((link) => {
    searchItems.push({
      label: link.textContent.trim(),
      sub: "Section",
      run: () => link.click(),
    });
  });
  document.querySelectorAll(".project-card").forEach((card) => {
    const title = card.querySelector(".project-title");
    const category = card.querySelector(".project-category");
    if (!title) return;
    searchItems.push({
      label: title.textContent.trim(),
      sub: category ? category.textContent.trim() : "Project",
      run: () => card.scrollIntoView({ behavior: "smooth", block: "center" }),
    });
  });

  let filteredItems = [];
  let activeIndex = 0;

  function renderResults(query) {
    const q = query.trim().toLowerCase();
    filteredItems = searchItems.filter(
      (item) =>
        !q ||
        item.label.toLowerCase().includes(q) ||
        item.sub.toLowerCase().includes(q)
    );
    searchResults.innerHTML = "";
    if (filteredItems.length === 0) {
      searchEmpty.hidden = false;
      searchInput.removeAttribute("aria-activedescendant");
      return;
    }
    searchEmpty.hidden = true;
    activeIndex = 0;
    filteredItems.forEach((item, index) => {
      const option = document.createElement("li");
      option.id = `search-option-${index}`;
      option.setAttribute("role", "option");
      option.classList.toggle("is-active", index === 0);
      option.setAttribute("aria-selected", String(index === 0));

      const label = document.createElement("span");
      label.className = "search-result-label";
      label.textContent = item.label;

      const sub = document.createElement("span");
      sub.className = "search-result-sub";
      sub.textContent = item.sub;

      option.append(label, sub);
      option.addEventListener("click", () => activateItem(index));
      searchResults.appendChild(option);
    });
    searchInput.setAttribute("aria-activedescendant", "search-option-0");
  }

  function setActive(nextIndex) {
    const options = searchResults.querySelectorAll("li");
    if (!options.length) return;
    activeIndex = (nextIndex + options.length) % options.length;
    options.forEach((option, index) => {
      const isActive = index === activeIndex;
      option.classList.toggle("is-active", isActive);
      option.setAttribute("aria-selected", String(isActive));
    });
    const current = options[activeIndex];
    searchInput.setAttribute("aria-activedescendant", current.id);
    current.scrollIntoView({ block: "nearest" });
  }

  function activateItem(index) {
    const item = filteredItems[index];
    if (!item) return;
    searchDialog.close();
    item.run();
  }

  function openSearch() {
    if (searchDialog.open) return;
    searchInput.value = "";
    renderResults("");
    searchDialog.showModal();
    searchInput.focus();
  }

  function closeSearch() {
    if (searchDialog.open) searchDialog.close();
  }

  searchTrigger.addEventListener("click", openSearch);
  searchInput.addEventListener("input", () => renderResults(searchInput.value));

  // Navigasi hasil dengan keyboard
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive(activeIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(activeIndex - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      activateItem(activeIndex);
    }
  });

  // Klik backdrop (area gelap di luar panel) untuk menutup
  searchDialog.addEventListener("click", (event) => {
    if (event.target === searchDialog) closeSearch();
  });

  const searchClose = document.querySelector(".search-close");
  if (searchClose) searchClose.addEventListener("click", closeSearch);

  // Shortcut global: Ctrl+K (Windows/Linux) atau ⌘K (macOS)
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (searchDialog.open) closeSearch();
      else openSearch();
    }
  });
}
