const header = document.querySelector("[data-header]");
const progressBar = document.querySelector("[data-progress]");
const revealItems = document.querySelectorAll(".reveal");
const navLinks = document.querySelectorAll(".nav-links a");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(pointer: fine)");

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const updateScrollState = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 8);

  if (progressBar) {
    const scrollable =
      document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    progressBar.style.transform = `scaleX(${clamp(progress, 0, 1)})`;
  }
};

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
);

revealItems.forEach((item) => {
  const rect = item.getBoundingClientRect();
  if (rect.top < window.innerHeight && rect.bottom > 0) {
    item.classList.add("is-visible");
  }
  revealObserver.observe(item);
});

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle(
          "is-active",
          link.getAttribute("href") === `#${entry.target.id}`
        );
      });
    });
  },
  { rootMargin: "-38% 0px -52% 0px", threshold: 0 }
);

["works", "collection", "detail"].forEach((id) => {
  const section = document.getElementById(id);
  if (section) sectionObserver.observe(section);
});

const parallaxTargets = document.querySelectorAll(
  ".hero-visual > img, .feature-image > img, .detail-stack img"
);
let parallaxFrame = 0;

const updateParallax = () => {
  parallaxFrame = 0;
  if (reducedMotion.matches) return;

  parallaxTargets.forEach((target) => {
    const rect = target.getBoundingClientRect();
    const viewportCenter = window.innerHeight / 2;
    const elementCenter = rect.top + rect.height / 2;
    const distance = clamp((elementCenter - viewportCenter) / viewportCenter, -1, 1);
    const offset = Math.round(distance * -18);
    target.style.setProperty("--parallax-y", `${offset}px`);
  });
};

const requestParallax = () => {
  if (!parallaxFrame) {
    parallaxFrame = requestAnimationFrame(updateParallax);
  }
};

const setupTilt = () => {
  if (!finePointer.matches || reducedMotion.matches) return;

  document.querySelectorAll(".tilt-surface, .art-card").forEach((surface) => {
    surface.addEventListener("pointermove", (event) => {
      const rect = surface.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      surface.style.setProperty("--tilt-x", `${(-y * 7).toFixed(2)}deg`);
      surface.style.setProperty("--tilt-y", `${(x * 8).toFixed(2)}deg`);
      surface.classList.add("is-tilting");
    });

    surface.addEventListener("pointerleave", () => {
      surface.style.setProperty("--tilt-x", "0deg");
      surface.style.setProperty("--tilt-y", "0deg");
      surface.classList.remove("is-tilting");
    });
  });
};

const setupMagnifiers = () => {
  if (!finePointer.matches || reducedMotion.matches) return;

  document.querySelectorAll(".zoom-surface").forEach((surface) => {
    const image = surface.querySelector("img");
    if (!image) return;

    const lens = document.createElement("span");
    lens.className = "zoom-lens";
    lens.style.backgroundImage = `url("${image.currentSrc || image.src}")`;
    surface.append(lens);

    surface.addEventListener("pointerenter", () => {
      surface.classList.add("is-zooming");
    });

    surface.addEventListener("pointermove", (event) => {
      const rect = surface.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      lens.style.left = `${x * 100}%`;
      lens.style.top = `${y * 100}%`;
      lens.style.backgroundPosition = `${x * 100}% ${y * 100}%`;
    });

    surface.addEventListener("pointerleave", () => {
      surface.classList.remove("is-zooming");
    });
  });
};

const setupLightbox = () => {
  const lightbox = document.querySelector("[data-lightbox]");
  const image = document.querySelector("[data-lightbox-image]");
  const title = document.querySelector("[data-lightbox-title]");
  const copy = document.querySelector("[data-lightbox-copy]");
  const count = document.querySelector("[data-lightbox-count]");
  const closeButton = document.querySelector("[data-lightbox-close]");
  const prevButton = document.querySelector("[data-lightbox-prev]");
  const nextButton = document.querySelector("[data-lightbox-next]");
  const cards = [...document.querySelectorAll(".art-card")];
  let activeIndex = 0;
  let lastFocus = null;

  if (!lightbox || !image || !title || !copy || !count || !cards.length) return;

  const getCardData = (card, index) => ({
    src: card.querySelector("img")?.getAttribute("src") || "",
    alt: card.querySelector("img")?.getAttribute("alt") || "",
    title: card.querySelector("h3")?.textContent.trim() || "",
    copy: card.querySelector("p")?.textContent.trim() || "",
    count: `${String(index + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`,
  });

  const render = (index) => {
    activeIndex = (index + cards.length) % cards.length;
    const data = getCardData(cards[activeIndex], activeIndex);
    image.src = data.src;
    image.alt = data.alt;
    title.textContent = data.title;
    copy.textContent = data.copy;
    count.textContent = data.count;
  };

  const open = (index) => {
    lastFocus = document.activeElement;
    render(index);
    lightbox.hidden = false;
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
    requestAnimationFrame(() => {
      lightbox.classList.add("is-open");
      closeButton?.focus();
    });
  };

  const close = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
    window.setTimeout(() => {
      lightbox.hidden = true;
      lastFocus?.focus?.();
    }, reducedMotion.matches ? 0 : 220);
  };

  cards.forEach((card, index) => {
    const cardTitle = card.querySelector("h3")?.textContent.trim();
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `查看作品 ${cardTitle || index + 1}`);

    card.addEventListener("click", () => open(index));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open(index);
      }
    });
  });

  closeButton?.addEventListener("click", close);
  prevButton?.addEventListener("click", () => render(activeIndex - 1));
  nextButton?.addEventListener("click", () => render(activeIndex + 1));

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) close();
  });

  document.addEventListener("keydown", (event) => {
    if (lightbox.hidden) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") render(activeIndex - 1);
    if (event.key === "ArrowRight") render(activeIndex + 1);
  });
};

updateScrollState();
requestParallax();
setupTilt();
setupMagnifiers();
setupLightbox();

window.addEventListener(
  "scroll",
  () => {
    updateScrollState();
    requestParallax();
  },
  { passive: true }
);

window.addEventListener("resize", () => {
  updateScrollState();
  requestParallax();
});
