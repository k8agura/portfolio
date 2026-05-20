const username = "k8agura";
const projectsGrid = document.querySelector("#projects-grid");
const template = document.querySelector("#project-card-template");
const repoCount = document.querySelector("#repo-count");
const languageCount = document.querySelector("#language-count");
const themeToggle = document.querySelector(".theme-toggle");
const themeToggleText = document.querySelector(".theme-toggle-text");

let allRepos = [];

const fallbackDescriptions = {
  blogdotnet: "Блоговая платформа на .NET с акцентом на серверную логику и структуру приложения.",
  practicjobcraft: "Практический проект с более крупной кодовой базой и полноценной организацией интерфейсов.",
  fixerrorsblogfront: "Frontend-часть проекта, связанная с доработкой и исправлением клиентского интерфейса.",
  tasktracker: "Небольшой проект по организации задач и работе с прикладной логикой.",
  testtask: "Тестовое задание с фокусом на аккуратную реализацию и базовую структуру решения.",
  testbitrix: "Практический проект в контексте веб-разработки и интеграционного подхода.",
  adminpanel: "Интерфейсная часть административной панели для работы с внутренними сущностями."
};

const languageGroups = {
  JavaScript: "frontend",
  TypeScript: "frontend",
  HTML: "frontend",
  CSS: "frontend",
  SCSS: "frontend",
  Vue: "frontend",
  React: "frontend",
  "C#": "backend",
  PHP: "backend",
  Java: "backend",
  Python: "backend"
};

const normalizeKey = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

const inferDescription = (repo) => {
  if (repo.description) {
    return repo.description;
  }

  const normalized = normalizeKey(repo.name);

  return fallbackDescriptions[normalized] || "Репозиторий с практической разработкой, где можно посмотреть структуру кода, подход и способ реализации.";
};

const sortRepos = (repos) => {
  return repos.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
};

const renderRepos = () => {
  projectsGrid.innerHTML = "";

  allRepos.forEach((repo, index) => {
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector(".project-card");

    card.style.transitionDelay = `${Math.min(index * 80, 320)}ms`;
    card.setAttribute("data-side", index % 2 === 0 ? "left" : "right");
    fragment.querySelector(".project-type").textContent = languageGroups[repo.language] === "backend" ? "Backend" : languageGroups[repo.language] === "frontend" ? "Frontend" : "Project";
    fragment.querySelector(".project-language").textContent = repo.language || "Mixed stack";
    fragment.querySelector(".project-title").textContent = repo.name;
    fragment.querySelector(".project-description").textContent = inferDescription(repo);
    fragment.querySelector(".project-language-note").textContent = repo.language ? `Технология: ${repo.language}` : "Технология: multi-stack";
    fragment.querySelector(".project-link-repo").href = repo.html_url;
    fragment.querySelector(".project-link-code").href = `${repo.html_url}/tree/${repo.default_branch}`;

    projectsGrid.appendChild(fragment);
  });

  observeReveal();
};

const setMetrics = () => {
  const languages = new Set(allRepos.map((repo) => repo.language).filter(Boolean));
  const stackCloud = document.querySelector("#stack-cloud");

  repoCount.textContent = allRepos.length;
  languageCount.textContent = Math.max(languages.size, 6);

  languages.forEach((language) => {
    const hasLanguage = Array.from(stackCloud.children).some((item) => item.textContent === language);

    if (!hasLanguage) {
      const tag = document.createElement("span");
      tag.textContent = language;
      stackCloud.appendChild(tag);
    }
  });
};

const loadRepos = async () => {
  try {
    const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`);

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const repos = await response.json();

    allRepos = sortRepos(
      repos
        .filter((repo) => !repo.fork && !repo.private)
        .map((repo) => ({ ...repo }))
    );

    setMetrics();
    renderRepos();
  } catch (error) {
    projectsGrid.innerHTML = `
      <article class="glass-card">
        <h3>Не удалось загрузить проекты</h3>
        <p>GitHub временно не ответил. Профиль все равно доступен по ссылке ниже.</p>
        <a class="button button-primary" href="https://github.com/${username}" target="_blank" rel="noreferrer">Перейти в GitHub</a>
      </article>
    `;
    console.error(error);
  }
};

const observeReveal = () => {
  const revealItems = document.querySelectorAll(".reveal:not(.is-visible)");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18
    }
  );

  revealItems.forEach((item) => observer.observe(item));
};

const applyTheme = (theme) => {
  const isDark = theme === "dark";

  document.body.classList.toggle("theme-dark", isDark);
  themeToggleText.textContent = isDark ? "Светлая тема" : "Темная тема";
};

const savedTheme = localStorage.getItem("portfolio-theme");
const preferredTheme = savedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

applyTheme(preferredTheme);

themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("theme-dark") ? "light" : "dark";

  localStorage.setItem("portfolio-theme", nextTheme);
  applyTheme(nextTheme);
});

document.addEventListener("mousemove", (event) => {
  const heroCard = document.querySelector(".hero-card");

  if (!heroCard || window.innerWidth < 1080) {
    return;
  }

  const x = (event.clientX / window.innerWidth - 0.5) * 10;
  const y = (event.clientY / window.innerHeight - 0.5) * 10;

  heroCard.style.setProperty("--offset-x", `${x * 0.45}px`);
  heroCard.style.setProperty("--offset-y", `${y * 0.2}px`);
});

window.addEventListener("mouseout", (event) => {
  if (event.relatedTarget !== null) {
    return;
  }

  const heroCard = document.querySelector(".hero-card");

  if (!heroCard) {
    return;
  }

  heroCard.style.setProperty("--offset-x", "0px");
  heroCard.style.setProperty("--offset-y", "0px");
});

observeReveal();
loadRepos();
