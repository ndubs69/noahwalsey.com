(function () {
  var mainTabs = ["home", "services", "how", "about"];
  var cats = ["answer", "follow", "signals"];
  var items = {
    voice: "answer",
    inbox: "answer",
    chief: "answer",
    "follow-up": "follow",
    renewals: "follow",
    social: "follow",
    report: "follow",
    "signal-desk": "signals"
  };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function all(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }

  function setTab(list, name, attr) {
    all("[role='tab']", list).forEach(function (tab) {
      var on = tab.getAttribute(attr) === name;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(tab.getAttribute("aria-controls"));
      if (panel) panel.hidden = !on;
    });
  }

  function closeDetails(except) {
    all(".item").forEach(function (item) {
      var open = item.id === except;
      var btn = $(".item-btn", item);
      var panel = $(".detail", item);
      if (!btn || !panel) return;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      panel.hidden = !open;
    });
  }

  function show(hash, focusDetail) {
    var id = (hash || "").replace(/^#/, "");
    var main = "home";
    var cat = "answer";
    var item = "";
    if (id === "services" || id === "answer" || id === "follow" || id === "signals") {
      main = "services";
      if (cats.indexOf(id) !== -1) cat = id;
    } else if (id === "how" || id === "about") {
      main = id;
    } else if (items[id]) {
      main = "services";
      cat = items[id];
      item = id;
    }
    setTab($(".top .tablist"), main, "data-tab");
    if (main === "services") {
      setTab($(".sub"), cat, "data-cat");
      closeDetails(item);
      if (focusDetail && item) {
        var btn = $("#" + item + " .item-btn");
        if (btn) btn.focus();
      }
    } else {
      closeDetails("");
    }
  }

  function go(hash) {
    if (location.hash === hash) show(hash, false);
    else location.hash = hash;
  }

  all(".top .tablist [role='tab']").forEach(function (tab) {
    tab.addEventListener("click", function () { go("#" + tab.getAttribute("data-tab")); });
  });
  all(".sub [role='tab']").forEach(function (tab) {
    tab.addEventListener("click", function () { go("#" + tab.getAttribute("data-cat")); });
  });
  all(".item-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.parentNode.id;
      if (btn.getAttribute("aria-expanded") === "true") go("#services");
      else go("#" + id);
    });
  });

  function arrows(list, attr) {
    list.addEventListener("keydown", function (e) {
      var tabs = all("[role='tab']", list);
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var next = e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % tabs.length
        : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i - 1 + tabs.length) % tabs.length
        : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : -1;
      if (next < 0) return;
      e.preventDefault();
      tabs[next].focus();
      go("#" + tabs[next].getAttribute(attr));
    });
  }
  arrows($(".top .tablist"), "data-tab");
  arrows($(".sub"), "data-cat");

  window.addEventListener("hashchange", function () { show(location.hash, false); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (location.hash && items[location.hash.slice(1)]) go("#services");
  });

  var form = document.getElementById("callback");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("cb-name").value.trim();
      var phone = document.getElementById("cb-phone").value.trim();
      var need = document.getElementById("cb-need").value.trim();
      var body = "Name: " + name + "\nPhone: " + phone + "\n\nWhat I need:\n" + need + "\n";
      var status = document.getElementById("callback-status");
      if (status) status.textContent = "Your email app should open. If it does not, write to consulting@noahwalsey.com.";
      window.location.href = "mailto:consulting@noahwalsey.com?subject=" + encodeURIComponent("Call back request") + "&body=" + encodeURIComponent(body);
    });
  }

  show(location.hash || "#home", false);
})();
