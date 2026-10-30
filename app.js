/* Open Source Game Launcher — App Logic */
(() => {
    const GRID = document.getElementById("grid");
    const SEARCH = document.getElementById("search");
    const FILTERS = document.querySelector(".filters");
    const EMPTY = document.getElementById("empty");
    const STAT_COUNT = document.getElementById("stat-count");

    let games = [];
    let categories = [];
    let currentCat = "all";
    let currentSearch = "";

    // Fetch the manifest
    async function loadManifest() {
        try {
            const res = await fetch("games.json");
            if (!res.ok) throw new Error("Failed to load games.json");
            const data = await res.json();
            games = data.games || [];
            categories = data.categories || [];
            STAT_COUNT.textContent = games.length;
            renderFilters();
            renderGames();
        } catch (err) {
            console.error(err);
            GRID.innerHTML = `<p style="color:var(--text-dim); text-align:center; padding:40px;">Failed to load game list. Please try again later.</p>`;
        }
    }

    // Build category filter buttons
    function renderFilters() {
        // "All" button already exists in HTML; add dynamic ones after it
        const allBtn = FILTERS.querySelector('[data-cat="all"]');
        FILTERS.innerHTML = "";
        FILTERS.appendChild(allBtn);

        categories.forEach((cat) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "filter-btn";
            btn.dataset.cat = cat.id;
            btn.style.color = cat.color;
            btn.textContent = `${cat.emoji} ${cat.label}`;
            FILTERS.appendChild(btn);
        });

        FILTERS.addEventListener("click", (e) => {
            const btn = e.target.closest(".filter-btn");
            if (!btn) return;
            setFilter(btn.dataset.cat);
        });
    }

    function setFilter(cat) {
        currentCat = cat;
        // Update active states
        FILTERS.querySelectorAll(".filter-btn").forEach((b) => {
            b.classList.toggle("active", b.dataset.cat === cat);
        });
        renderGames();
    }

    // Render game cards
    function renderGames() {
        GRID.innerHTML = "";
        let shown = 0;

        const filtered = games.filter((g) => {
            const matchCat = currentCat === "all" || g.category === currentCat;
            const matchSearch = g.name.toLowerCase().includes(currentSearch) ||
                (g.description || "").toLowerCase().includes(currentSearch) ||
                (g.tags || []).some((t) => t.toLowerCase().includes(currentSearch));
            return matchCat && matchSearch;
        });

        if (filtered.length === 0) {
            EMPTY.style.display = "block";
            return;
        }
        EMPTY.style.display = "none";

        filtered.forEach((g) => {
            const catInfo = categories.find((c) => c.id === g.category) || {};
            const card = document.createElement("article");
            card.className = "card";
            card.dataset.id = g.id;
            card.setAttribute("role", "button");
            card.setAttribute("tabindex", "0");
            card.setAttribute("aria-label", `Play ${g.name}`);
            card.innerHTML = `
                <div class="card-thumb">
                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${g.name}">
                        <rect width="100" height="100" fill="#0f172a" rx="8" />
                        <circle cx="50" cy="42" r="14" fill="${catInfo.color || "#38bdf8"}" />
                        <path d="M44 56 L56 50 L44 44 Z" fill="#ffffff" />
                        <text x="50" y="82" font-family="system-ui" font-size="10" fill="#64748b" text-anchor="middle">${g.tech}</text>
                    </svg>
                </div>
                <div class="card-body">
                    <span class="cat-badge" style="background:${catInfo.color || "#334155"}">${catInfo.label || g.category}</span>
                    <h3 class="card-title">${escapeHtml(g.name)}</h3>
                    <p class="card-desc">${escapeHtml(g.description || "")}</p>
                </div>
                <div class="card-footer">
                    <span class="play-hint">PLAY</span>
                    <span>${g.tags && g.tags.length ? g.tags.slice(0, 2).join(" • ") : ""}</span>
                </div>
            `;

            // Click / Enter / Space to play
            const play = () => {
                const url = g.path.startsWith("http") ? g.path : g.path;
                window.open(url, "_blank", "noopener,noreferrer");
            };

            card.addEventListener("click", play);
            card.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    play();
                }
            });

            GRID.appendChild(card);
            shown++;
        });
    }

    // Search input
    SEARCH.addEventListener("input", (e) => {
        currentSearch = e.target.value.toLowerCase().trim();
        renderGames();
    });

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    loadManifest();
})();
