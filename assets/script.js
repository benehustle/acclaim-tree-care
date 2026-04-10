/* ==========================================================================
   Acclaim Tree Care & Services — site behaviour
   ========================================================================== */

/* --------------------------------------------------------------------------
   loadIncludes — fetch header/footer, then init nav
   -------------------------------------------------------------------------- */
async function loadIncludes() {
  const headerPh = document.getElementById("header-placeholder");
  const footerPh = document.getElementById("footer-placeholder");
  if (!headerPh || !footerPh) return;

  try {
    const [headerRes, footerRes] = await Promise.all([
      fetch("includes/header.html"),
      fetch("includes/footer.html"),
    ]);
    if (headerRes.ok) {
      headerPh.innerHTML = await headerRes.text();
    }
    if (footerRes.ok) {
      footerPh.innerHTML = await footerRes.text();
    }
  } catch (e) {
    console.error("Could not load includes:", e);
  }

  const yearEl = document.getElementById("footer-year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  initNav();
  setActiveNavLink();
}

/* --------------------------------------------------------------------------
   initNav — hamburger, scroll shrink, drawer close
   -------------------------------------------------------------------------- */
function initNav() {
  const header = document.querySelector(".header");
  const toggle = document.querySelector(".nav-toggle");
  const drawer = document.querySelector(".drawer");
  const overlay = document.querySelector(".drawer-overlay");

  if (header) {
    const onScroll = () => {
      if (window.scrollY > 40) {
        header.classList.add("header--scrolled");
      } else {
        header.classList.remove("header--scrolled");
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function closeDrawer() {
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    drawer?.classList.remove("is-open");
    overlay?.classList.remove("is-open");
    if (overlay) overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function openDrawer() {
    if (toggle) toggle.setAttribute("aria-expanded", "true");
    drawer?.classList.add("is-open");
    overlay?.classList.add("is-open");
    if (overlay) overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  toggle?.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    if (open) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  overlay?.addEventListener("click", closeDrawer);

  drawer?.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", closeDrawer);
  });
}

/* --------------------------------------------------------------------------
   setActiveNavLink — match pathname to nav hrefs
   -------------------------------------------------------------------------- */
function setActiveNavLink() {
  let path = window.location.pathname || "";
  const file = path.split("/").pop() || "index.html";
  const normalized = file === "" || file === "/" ? "index.html" : file;

  document.querySelectorAll(".nav-desktop__links a, .drawer__links a").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("tel:") || href.startsWith("#")) return;
    const linkFile = href.split("/").pop();
    if (linkFile === normalized || (normalized === "index.html" && (linkFile === "index.html" || href === "index.html" || href === "./index.html"))) {
      link.classList.add("is-active");
    } else {
      link.classList.remove("is-active");
    }
  });
}

/* --------------------------------------------------------------------------
   initSmoothScroll — anchor links with 90px header offset
   -------------------------------------------------------------------------- */
function initSmoothScroll() {
  document.body.addEventListener("click", (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    const id = anchor.getAttribute("href");
    if (!id || id === "#") return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  });
}

/* --------------------------------------------------------------------------
   initScrollAnimations — IntersectionObserver
   -------------------------------------------------------------------------- */
function initScrollAnimations() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll(".animate-on-scroll").forEach((el) => observer.observe(el));

  document.querySelectorAll(".animate-stagger").forEach((group) => {
    Array.from(group.children).forEach((child, i) => {
      child.style.transitionDelay = `${i * 80}ms`;
      observer.observe(child);
    });
  });
}

/* --------------------------------------------------------------------------
   initCounters — stat numbers with easing
   -------------------------------------------------------------------------- */
function initCounters() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".stat-number").forEach((el) => {
      el.textContent = el.dataset.target + (el.dataset.suffix || "");
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        const el = entry.target;
        const target = parseFloat(el.dataset.target);
        const suffix = el.dataset.suffix || "";
        const decimals = parseInt(el.dataset.decimals, 10) || 0;
        const duration = 1800;
        const start = performance.now();

        function update(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = (target * eased).toFixed(decimals) + (progress === 1 ? suffix : "");
          if (progress < 1) requestAnimationFrame(update);
        }

        requestAnimationFrame(update);
      });
    },
    { threshold: 0.5 }
  );

  document.querySelectorAll(".stat-number").forEach((el) => observer.observe(el));
}

/* --------------------------------------------------------------------------
   initCallBar — delay 2s, session dismiss
   -------------------------------------------------------------------------- */
function initCallBar() {
  const bar = document.querySelector(".call-bar");
  if (!bar) return;

  const storageKey = "acclaim_call_bar_dismissed";
  if (sessionStorage.getItem(storageKey) === "1") {
    return;
  }

  window.setTimeout(() => {
    bar.classList.add("is-visible");
    document.body.classList.add("has-call-bar");
  }, 2000);

  bar.querySelector(".call-bar__dismiss")?.addEventListener("click", () => {
    bar.classList.remove("is-visible");
    document.body.classList.remove("has-call-bar");
    sessionStorage.setItem(storageKey, "1");
  });
}

/* --------------------------------------------------------------------------
   initContactForm — validation + success (phone from data attributes)
   -------------------------------------------------------------------------- */
function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const successEl = form.querySelector(".form-success");
  const displayPhone = form.getAttribute("data-phone-display") || "";
  const e164 = form.getAttribute("data-phone-e164") || "";

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    let valid = true;
    const fields = form.querySelectorAll("[required]");

    fields.forEach((field) => {
      const group = field.closest(".form-group");
      if (!group) return;

      let ok = true;
      if (field.type === "email") {
        ok = field.value.trim() !== "" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
      } else {
        ok = field.value.trim() !== "";
      }

      if (!ok) {
        valid = false;
        group.classList.add("is-invalid");
      } else {
        group.classList.remove("is-invalid");
      }
    });

    if (!valid) return;

    successEl.textContent =
      "Thanks — we'll be in touch soon! For urgent jobs call " +
      (displayPhone || e164) +
      " directly.";
    successEl.classList.add("is-visible");
    form.reset();
    fields.forEach((field) => {
      field.closest(".form-group")?.classList.remove("is-invalid");
    });
  });
}

/* --------------------------------------------------------------------------
   initFaq — smooth accordion for details/summary
   -------------------------------------------------------------------------- */
function initFaq() {
  document.querySelectorAll(".faq__item").forEach((details) => {
    const answer = details.querySelector(".faq__answer");
    if (!answer) return;

    details.addEventListener("toggle", () => {
      if (details.open) {
        answer.style.maxHeight = answer.scrollHeight + "px";
      } else {
        answer.style.maxHeight = "0px";
      }
    });

    answer.style.maxHeight = "0px";
    answer.style.transition = "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)";
    if (details.open) {
      answer.style.maxHeight = answer.scrollHeight + "px";
    }
  });
}

/* --------------------------------------------------------------------------
   DOMContentLoaded
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  initSmoothScroll();
  loadIncludes();

  initScrollAnimations();
  initCounters();
  initCallBar();
  initContactForm();
  initFaq();
});
