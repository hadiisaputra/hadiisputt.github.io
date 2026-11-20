/* ============================================================
   PORTFOLIO — client-side interactions
   ------------------------------------------------------------
   Seturut prinsip clean code:
   - Satu file dipecah per fitur, tiap fitur punya init() sendiri
     yang dipanggil sekali dari boot() di bagian bawah.
   - Angka ajaib diganti konstanta bernama.
   - Duplikasi (icon menu, penulisan aria, query DOM) dikeluarkan
     jadi helper sekali pakai.
   - Kode mati (tidak pernah dipakai CSS/HTML) dihapus.
   ============================================================ */

(function () {
  "use strict";

  /* ---------- DOM helpers ---------- */
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) =>
    Array.from(scope.querySelectorAll(selector));

  /* ---------- Konstanta ---------- */
  const MENU_ICON_OPEN = "✕";
  const MENU_ICON_CLOSED = "☰";
  /** Jarak dari atas viewport yang menentukan section mana punya link aktif. */
  const NAV_ACTIVE_OFFSET = 150;
  /** Jarak dari bawah viewport sebelum elemen mulai animasi reveal. */
  const REVEAL_OFFSET = 100;
  /** Posisi scroll (px) tombol "back to top" mulai muncul. */
  const BACK_TO_TOP_THRESHOLD = 500;
  /** Elemen yang mendapat animasi reveal saat di-scroll. */
  const REVEAL_SELECTOR = [
    ".section-header",
    ".about-text",
    ".skill-card",
    ".timeline-item",
    ".project-card",
  ].join(", ");

  /* ============================================================
     1. NAVIGASI — dropdown mobile + link aktif saat scroll
     ============================================================ */
  const menuToggle = $(".menu-toggle");
  const navMenu = $(".nav-menu");
  const navLinks = $$(".nav-link");
  const sections = $$("section[id]");

  /** Satu-satunya tempat mengubah state dropdown, dipakai oleh semua pemanggil. */
  function setMenuOpen(isOpen) {
    if (!menuToggle || !navMenu) return;
    navMenu.classList.toggle("active", isOpen);
    menuToggle.textContent = isOpen ? MENU_ICON_OPEN : MENU_ICON_CLOSED;
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  }

  function updateActiveNavigation() {
    const scrollPosition = window.scrollY + NAV_ACTIVE_OFFSET;
    const currentSection = sections.find(
      (section) =>
        scrollPosition >= section.offsetTop &&
        scrollPosition < section.offsetTop + section.offsetHeight
    );
    const currentHref = currentSection ? `#${currentSection.id}` : null;

    navLinks.forEach((link) => {
      link.classList.toggle(
        "active",
        currentHref !== null && link.getAttribute("href") === currentHref
      );
    });
  }

  function initNavigation() {
    if (menuToggle && navMenu) {
      menuToggle.addEventListener("click", () =>
        setMenuOpen(!navMenu.classList.contains("active"))
      );
    }

    navLinks.forEach((link) =>
      link.addEventListener("click", () => setMenuOpen(false))
    );

    window.addEventListener("scroll", updateActiveNavigation, {
      passive: true,
    });
  }

  /* ============================================================
     2. ANIMASI REVEAL — elemen muncul bertahap saat di-scroll
     ============================================================ */
  function applyRevealDelays(selector) {
    $$(selector).forEach((element, index) => {
      element.classList.add(`reveal-delay-${index}`);
    });
  }

  function initRevealAnimations() {
    const revealElements = $$(REVEAL_SELECTOR);

    revealElements.forEach((element) => element.classList.add("js-reveal"));
    applyRevealDelays(".skill-card");
    applyRevealDelays(".project-card");

    const revealVisibleElements = () => {
      const threshold = window.innerHeight - REVEAL_OFFSET;
      revealElements.forEach((element) => {
        if (element.getBoundingClientRect().top < threshold) {
          element.classList.add("is-visible");
        }
      });
    };

    window.addEventListener("scroll", revealVisibleElements, {
      passive: true,
    });
    window.addEventListener("load", revealVisibleElements);
  }

  /* ============================================================
     3. TOMBOL KEMBALI KE ATAS
     ============================================================ */
  function initBackToTop() {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "back-to-top";
    button.textContent = "↑";
    button.setAttribute("aria-label", "Back to top");
    button.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
    document.body.appendChild(button);

    window.addEventListener(
      "scroll",
      () =>
        button.classList.toggle(
          "is-visible",
          window.scrollY > BACK_TO_TOP_THRESHOLD
        ),
      { passive: true }
    );
  }

  /* ============================================================
     4. GAMBAR PROYEK — tampilkan placeholder bila file tidak ada
     ============================================================ */
  function initImageFallback() {
    $$(".project-image img").forEach((image) => {
      image.addEventListener("error", () =>
        image.parentElement.classList.add("image-error")
      );
    });
  }

  /* ============================================================
     5. QUICK SEARCH (⌘K / Ctrl+K)
     ============================================================ */
  function detectShortcutLabel() {
    const platform =
      (navigator.userAgentData && navigator.userAgentData.platform) ||
      navigator.platform ||
      navigator.userAgent;
    return /mac|iphone|ipad|ipod/i.test(platform) ? "⌘K" : "Ctrl+K";
  }

  function initQuickSearch() {
    const dialog = document.getElementById("search-dialog");
    const trigger = $(".search-trigger");
    const triggerLabel = $(".search-trigger-label");
    const input = document.getElementById("search-input");
    const results = document.getElementById("search-results");
    const emptyState = document.getElementById("search-empty");
    const closeButton = $(".search-close");

    if (!dialog || !trigger || !input || !results || !emptyState) return;

    const shortcut = detectShortcutLabel();
    if (triggerLabel) triggerLabel.textContent = shortcut;
    trigger.setAttribute("aria-label", `Open quick search (${shortcut})`);

    let visibleItems = [];
    let optionElements = [];
    let activeIndex = 0;

    /* ---- Sumber data: link navigasi + kartu proyek ---- */
    function collectItems() {
      const sectionItems = navLinks.map((link) => ({
        label: link.textContent.trim(),
        category: "Section",
        open: () => link.click(),
      }));

      const projectItems = $$(".project-card")
        .map((card) => {
          const title = card.querySelector(".project-title");
          const category = card.querySelector(".project-category");
          if (!title) return null;
          return {
            label: title.textContent.trim(),
            category: category ? category.textContent.trim() : "Project",
            open: () =>
              card.scrollIntoView({ behavior: "smooth", block: "center" }),
          };
        })
        .filter(Boolean);

      return [...sectionItems, ...projectItems];
    }

    const items = collectItems();

    /* ---- Filter & render ---- */
    function filterItems(query) {
      const normalized = query.trim().toLowerCase();
      if (!normalized) return items;
      return items.filter(
        ({ label, category }) =>
          label.toLowerCase().includes(normalized) ||
          category.toLowerCase().includes(normalized)
      );
    }

    function createOption(item, index, isActive) {
      const option = document.createElement("li");
      option.id = `search-option-${index}`;
      option.dataset.index = String(index);
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", String(isActive));
      option.classList.toggle("is-active", isActive);

      const label = document.createElement("span");
      label.className = "search-result-label";
      label.textContent = item.label;

      const category = document.createElement("span");
      category.className = "search-result-sub";
      category.textContent = item.category;

      option.append(label, category);
      return option;
    }

    function renderResults(query) {
      visibleItems = filterItems(query);
      optionElements = [];
      results.replaceChildren();

      if (visibleItems.length === 0) {
        emptyState.hidden = false;
        input.removeAttribute("aria-activedescendant");
        return;
      }

      emptyState.hidden = true;
      activeIndex = 0;
      optionElements = visibleItems.map((item, index) => {
        const option = createOption(item, index, index === 0);
        results.appendChild(option);
        return option;
      });
      input.setAttribute("aria-activedescendant", optionElements[0].id);
    }

    function setActive(nextIndex) {
      if (optionElements.length === 0) return;
      activeIndex =
        (nextIndex + optionElements.length) % optionElements.length;

      optionElements.forEach((option, index) => {
        const isActive = index === activeIndex;
        option.classList.toggle("is-active", isActive);
        option.setAttribute("aria-selected", String(isActive));
      });

      const activeOption = optionElements[activeIndex];
      input.setAttribute("aria-activedescendant", activeOption.id);
      activeOption.scrollIntoView({ block: "nearest" });
    }

    function activate(index) {
      const item = visibleItems[index];
      if (!item) return;
      close();
      item.open();
    }

    /* ---- Lifecycle dialog ---- */
    function open() {
      if (dialog.open) return;
      setMenuOpen(false); // jangan biarkan dropdown menumpuk di belakang dialog
      input.value = "";
      renderResults("");
      dialog.showModal();
      input.focus();
    }

    function close() {
      if (dialog.open) dialog.close();
    }

    /* ---- Events ---- */
    trigger.addEventListener("click", open);
    input.addEventListener("input", () => renderResults(input.value));

    const keyActions = {
      ArrowDown: () => setActive(activeIndex + 1),
      ArrowUp: () => setActive(activeIndex - 1),
      Enter: () => activate(activeIndex),
    };

    input.addEventListener("keydown", (event) => {
      const action = keyActions[event.key];
      if (!action) return;
      event.preventDefault();
      action();
    });

    // Satu listener untuk semua hasil, bukan satu listener per opsi
    results.addEventListener("click", (event) => {
      const option = event.target.closest("li[data-index]");
      if (option) activate(Number(option.dataset.index));
    });

    // Klik backdrop (area gelap di luar panel) untuk menutup
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) close();
    });

    if (closeButton) closeButton.addEventListener("click", close);

    // Shortcut global: Ctrl+K (Windows/Linux) atau ⌘K (macOS)
    document.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (dialog.open) close();
        else open();
      }
    });
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function boot() {
    initNavigation();
    initRevealAnimations();
    initBackToTop();
    initImageFallback();
    initQuickSearch();
  }

  boot();
})();
