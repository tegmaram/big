/* Open Source Game Launcher — App Logic */
(() => {
    const GRID_SELF = document.getElementById("grid-self");
    const GRID_EXT = document.getElementById("grid-ext");
    const SECTION_SELF = document.getElementById("section-self");
    const SECTION_EXT = document.getElementById("section-ext");
    const SEARCH = document.getElementById("search");
    const FILTERS = document.querySelector(".filters");
    const EMPTY = document.getElementById("empty");
    const STAT_SELF = document.getElementById("stat-self");
    const STAT_EXT = document.getElementById("stat-ext");
    const COUNT_SELF = document.getElementById("count-self");
    const COUNT_EXT = document.getElementById("count-ext");

    let games = [];
    let categories = [];
    let currentCat = "all"; // all | self | external
    let currentSearch = "";

    // Fetch the manifest
    async function loadManifest() {
        try {
            const res = await fetch("games.json");
            if (!res.ok) throw new Error("Failed to load games.json");
            const data = await res.json();
            games = data.games || [];
            categories = data.categories || [];

            const selfGames = games.filter(g => !g.external);
            const extGames = games.filter(g => g.external);

            STAT_SELF.textContent = selfGames.length;
            STAT_EXT.textContent = extGames.length;
            COUNT_SELF.textContent = selfGames.length;
            COUNT_EXT.textContent = extGames.length;

            renderFilters();
            renderGames();
        } catch (err) {
            console.error(err);
            GRID_SELF.innerHTML = `<p style="color:var(--text-dim); text-align:center; padding:40px;">Failed to load game list. Please try again later.</p>`;
        }
    }

    // Build category filter buttons
    function renderFilters() {
        // Existing static buttons: All, Self-hosted only, External only
        // Add dynamic category buttons after them
        const staticButtons = FILTERS.querySelectorAll("[data-cat='all'], [data-cat='self'], [data-cat='external']");
        FILTERS.innerHTML = "";
        staticButtons.forEach(b => FILTERS.appendChild(b));

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
        FILTERS.querySelectorAll(".filter-btn").forEach((b) => {
            b.classList.toggle("active", b.dataset.cat === cat);
        });
        renderGames();
    }

    // Render a single game card
    function createCard(g) {
        const catInfo = categories.find((c) => c.id === g.category) || {};
        const card = document.createElement("article");
        card.className = "card" + (g.external ? " card-external" : "");
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
                ${g.external ? '<div class="ext-overlay">EXTERNAL</div>' : '<div class="self-badge">✓ WORKS</div>'}
            </div>
            <div class="card-body">
                <span class="cat-badge" style="background:${catInfo.color || "#334155"}">${catInfo.label || g.category}</span>
                ${g.external ? '<span class="ext-badge">EXTERNAL</span>' : '<span class="works-badge">FULLY WORKING</span>'}
                <h3 class="card-title">${escapeHtml(g.name)}</h3>
                <p class="card-desc">${escapeHtml(g.description || "")}</p>
            </div>
            <div class="card-footer">
                <span class="play-hint">${g.external ? "OPEN" : "PLAY"}</span>
                <span>${g.tags && g.tags.length ? g.tags.slice(0, 2).join(" • ") : ""}</span>
            </div>
        `;

        // Click / Enter / Space to play
        const play = () => {
            const url = g.path.startsWith("http") ? g.path : g.path;
            // Try opening in new tab first; Safari/other browsers may block popups
            const win = window.open(url, "_blank", "noopener,noreferrer");
            if (!win || win.closed || typeof win.closed === "undefined") {
                // Popup was blocked — fall back to same-tab navigation
                window.location.href = url;
            }
        };

        card.addEventListener("click", play);
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                play();
            }
        });

        return card;
    }

    // Render games into both grids
    function renderGames() {
        GRID_SELF.innerHTML = "";
        GRID_EXT.innerHTML = "";

        let shownSelf = 0;
        let shownExt = 0;

        games.forEach((g) => {
            const matchCat =
                currentCat === "all" ||
                (currentCat === "self" && !g.external) ||
                (currentCat === "external" && g.external);
            const matchSearch = g.name.toLowerCase().includes(currentSearch) ||
                (g.description || "").toLowerCase().includes(currentSearch) ||
                (g.tags || []).some((t) => t.toLowerCase().includes(currentSearch));

            if (!matchCat || !matchSearch) return;

            const card = createCard(g);

            if (g.external) {
                GRID_EXT.appendChild(card);
                shownExt++;
            } else {
                GRID_SELF.appendChild(card);
                shownSelf++;
            }
        });

        // Show/hide sections based on filter
        if (currentCat === "self") {
            SECTION_SELF.style.display = "block";
            SECTION_EXT.style.display = "none";
        } else if (currentCat === "external") {
            SECTION_SELF.style.display = "none";
            SECTION_EXT.style.display = "block";
        } else {
            SECTION_SELF.style.display = "block";
            SECTION_EXT.style.display = "block";
        }

        // Empty state
        const totalShown = shownSelf + shownExt;
        if (totalShown === 0) {
            EMPTY.style.display = "block";
        } else {
            EMPTY.style.display = "none";
        }
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
