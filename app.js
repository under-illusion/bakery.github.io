(function () {
  var IMAGES_DIR = "./images/";
  var ALL = "__all__";
  var UNCAT = "__uncat__";

  var statusEl = document.getElementById("status");
  var galleryEl = document.getElementById("gallery");
  var filterBarEl = document.getElementById("filter-bar");
  var filterChipsEl = document.getElementById("filter-chips");

  var allItems = [];
  var selectedFilter = ALL;

  function setStatus(text, isError) {
    statusEl.textContent = text || "";
    statusEl.classList.toggle("is-error", !!isError);
  }

  function imageUrl(fileName) {
    var name = String(fileName || "").replace(/^\/+/, "");
    return IMAGES_DIR + encodeURIComponent(name);
  }

  function normalizeItems(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    return [];
  }

  function itemCategory(item) {
    var c = item.category;
    if (c == null) return "";
    return String(c).trim();
  }

  function uniqueCategories(items) {
    var seen = Object.create(null);
    items.forEach(function (item) {
      var c = itemCategory(item);
      if (c) seen[c] = true;
    });
    return Object.keys(seen).sort(function (a, b) {
      return a.localeCompare(b, "zh");
    });
  }

  function filterByCategory(items, key) {
    if (key === ALL) return items;
    if (key === UNCAT) {
      return items.filter(function (item) {
        return !itemCategory(item);
      });
    }
    return items.filter(function (item) {
      return itemCategory(item) === key;
    });
  }

  function buildFilterChips(items) {
    filterChipsEl.innerHTML = "";
    var cats = uniqueCategories(items);
    var anyLabeled = cats.length > 0;
    var anyUnlabeled = items.some(function (item) {
      return !itemCategory(item);
    });

    function addChip(key, label) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filter-chip";
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", key === selectedFilter ? "true" : "false");
      btn.dataset.filter = key;
      btn.textContent = label;
      if (key === selectedFilter) btn.classList.add("is-active");
      btn.addEventListener("click", function () {
        selectedFilter = key;
        syncChipActiveStates();
        applyView();
      });
      filterChipsEl.appendChild(btn);
    }

    addChip(ALL, "全部");

    if (anyLabeled && anyUnlabeled) addChip(UNCAT, "未分类");

    cats.forEach(function (c) {
      addChip(c, c);
    });

    var showBar = items.length > 0 && (cats.length > 0 || anyUnlabeled);
    filterBarEl.hidden = !showBar || (cats.length <= 1 && !anyUnlabeled);
    if (cats.length === 1 && !anyUnlabeled) filterBarEl.hidden = false;
    if (cats.length === 0 && !anyUnlabeled) filterBarEl.hidden = true;
  }

  function syncChipActiveStates() {
    var buttons = filterChipsEl.querySelectorAll(".filter-chip");
    buttons.forEach(function (btn) {
      var on = btn.dataset.filter === selectedFilter;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  function renderGallery(items) {
    galleryEl.innerHTML = "";

    if (!allItems.length) {
      setStatus("书册里还没有作品，请在 catalog.js 和 images 文件夹里添加内容。");
      galleryEl.hidden = true;
      return;
    }

    if (!items.length) {
      setStatus("当前类别下还没有作品，可切换到「全部」或其他类别看看。");
      galleryEl.hidden = true;
      return;
    }

    items.forEach(function (item) {
      var file = item.image || item.file || item.img || "";
      var name = item.name || item.title || "未命名";
      var price = item.price != null ? String(item.price) : "";
      var cat = itemCategory(item);

      var li = document.createElement("li");
      li.className = "card";

      var wrap = document.createElement("div");
      wrap.className = "card-image-wrap";

      var img = document.createElement("img");
      img.className = "card-image";
      img.alt = name;
      img.loading = "lazy";
      img.decoding = "async";
      img.src = imageUrl(file);

      img.addEventListener("error", function () {
        img.classList.add("is-missing");
        img.removeAttribute("src");
        img.alt = "图片未找到：" + file;
      });

      wrap.appendChild(img);

      var body = document.createElement("div");
      body.className = "card-body";

      if (cat) {
        var tag = document.createElement("p");
        tag.className = "card-category";
        tag.textContent = cat;
        body.appendChild(tag);
      }

      var h2 = document.createElement("h2");
      h2.className = "card-name";
      h2.textContent = name;

      body.appendChild(h2);

      if (price) {
        var p = document.createElement("p");
        p.className = "card-price";
        p.textContent = price;
        body.appendChild(p);
      }

      li.appendChild(wrap);
      li.appendChild(body);
      galleryEl.appendChild(li);
    });

    galleryEl.hidden = false;
    setStatus("");
  }

  function applyView() {
    var visible = filterByCategory(allItems, selectedFilter);
    renderGallery(visible);
  }

  allItems = normalizeItems(window.__BAKERY_CATALOG__);

  if (
    selectedFilter !== ALL &&
    filterByCategory(allItems, selectedFilter).length === 0 &&
    allItems.length > 0
  ) {
    selectedFilter = ALL;
  }

  buildFilterChips(allItems);
  applyView();
})();
