/**
 * MiniStore Template Manager
 * Handles loading and reusing header/footer templates across pages
 */

class TemplateManager {
  constructor() {
    this.templates = {
      header: null,
      footer: null,
    };
    this.cacheExpiry = 3600000; // 1 hour cache
  }

  async init() {
    try {
      await this.loadTemplates();
      this.insertTemplates();
      this.setupComponents();
    } catch (error) {
      console.error("Template initialization failed:", error);
      this.handleTemplateErrors();
    }
  }

  async loadTemplates() {
    const now = Date.now();
    const cacheKey = `ministore_templates_${now}`;

    // Try to get templates from cache first
    const cachedTemplates = this.getCachedTemplates();
    if (cachedTemplates) {
      this.templates = cachedTemplates;
      return;
    }

    // Load fresh templates if cache is empty or expired
    const templatesToLoad = [
      {
        name: "header",
        url: "./header.html",
      },
      {
        name: "footer",
        url: "./footer.html",
        processor: (content) =>
          content.replace(
            "${new Date().getFullYear()}",
            new Date().getFullYear()
          ),
      },
    ];

    for (const template of templatesToLoad) {
      try {
        const response = await fetch(template.url);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        let content = await response.text();
        if (template.processor) {
          content = template.processor(content);
        }

        this.templates[template.name] = content;
      } catch (error) {
        console.error(`Failed to load ${template.name}:`, error);
        this.templates[template.name] = this.getFallbackTemplate(template.name);
      }
    }

    // Cache the loaded templates
    this.cacheTemplates();
  }

  insertTemplates() {
    // Insert header at the beginning of the body
    if (this.templates.header) {
      document.body.insertAdjacentHTML("afterbegin", this.templates.header);
    }

    // Insert footer at the end of the body
    if (this.templates.footer) {
      document.body.insertAdjacentHTML("beforeend", this.templates.footer);
    }
  }

  setupComponents() {
    // Mobile menu toggle
    const mobileToggle = document.getElementById("mobileMenuToggle");
    const mainNav = document.getElementById("mainNav");

    if (mobileToggle && mainNav) {
      mobileToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        mainNav.classList.toggle("active");
        mobileToggle.setAttribute(
          "aria-expanded",
          mainNav.classList.contains("active")
        );
      });

      document.addEventListener("click", () => {
        mainNav.classList.remove("active");
        mobileToggle.setAttribute("aria-expanded", "false");
      });

      mainNav.addEventListener("click", (e) => e.stopPropagation());
    }

    // Update cart count
    this.updateCartCount();

    // Highlight current page
    this.highlightCurrentPage();
  }

  updateCartCount() {
    const cartCount = document.getElementById("cart-count");
    if (!cartCount) return;

    try {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const totalItems = cart.reduce(
        (total, item) => total + (item.quantity || 0),
        0
      );
      cartCount.textContent = totalItems;
      cartCount.style.display = totalItems > 0 ? "flex" : "none";
    } catch (e) {
      console.error("Cart update failed:", e);
      if (cartCount) cartCount.style.display = "none";
    }
  }

  highlightCurrentPage() {
    const currentPage =
      window.location.pathname.split("/").pop() || "index.html";
    const navLinks = document.querySelectorAll(".nav-links a");

    navLinks.forEach((link) => {
      const linkPage = link.getAttribute("href").split("/").pop();
      if (linkPage === currentPage) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  cacheTemplates() {
    try {
      const cacheData = {
        templates: this.templates,
        timestamp: Date.now(),
      };
      localStorage.setItem("ministore_templates", JSON.stringify(cacheData));
    } catch (e) {
      console.warn("Failed to cache templates:", e);
    }
  }

  getCachedTemplates() {
    try {
      const cached = localStorage.getItem("ministore_templates");
      if (!cached) return null;

      const { templates, timestamp } = JSON.parse(cached);

      if (Date.now() - timestamp > this.cacheExpiry) {
        return null; // Cache expired
      }

      return templates;
    } catch (e) {
      return null;
    }
  }

  getFallbackTemplate(name) {
    const fallbacks = {
      header: `
                <header class="main-header">
                    <div class="header-container">
                        <a href="index.html" class="logo">
                            <i class="fas fa-store" style="color: var(--gold);"></i>
                            <span style="background: var(--gold-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">MiniStore</span>
                        </a>
                        <button id="mobileMenuToggle" aria-label="Toggle menu"><i class="fas fa-bars"></i></button>
                    </div>
                </header>
            `,
      footer: `
                <footer style="background: var(--plum-gradient);">
                    <div class="footer-content">
                        <p class="copyright" style="color: var(--cream);">
                            © ${new Date().getFullYear()} MiniStore. All rights reserved.
                        </p>
                    </div>
                </footer>
            `,
    };
    return fallbacks[name] || "";
  }

  handleTemplateErrors() {
    // Insert minimal fallback UI if templates fail to load
    if (!this.templates.header) {
      document.body.insertAdjacentHTML(
        "afterbegin",
        this.getFallbackTemplate("header")
      );
    }
    if (!this.templates.footer) {
      document.body.insertAdjacentHTML(
        "beforeend",
        this.getFallbackTemplate("footer")
      );
    }
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const templateManager = new TemplateManager();
  templateManager.init();

  // Expose update method for cart changes
  window.updateCartCount = () => templateManager.updateCartCount();
});

// Handle cart updates from other tabs
window.addEventListener("storage", (e) => {
  if (e.key === "cart") {
    const cartCount = document.getElementById("cart-count");
    if (cartCount) {
      window.updateCartCount();
    }
  }
});
