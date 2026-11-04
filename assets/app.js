(function () {
  var DETAILS = {
    voice: {
      problem: "Calls land in voicemail while someone is already on the phone, and the caller tries the next agency.",
      steps: [
        ["Approve the words", "You write the missed-call text and the phone script. That is all it can say."],
        ["Answer the miss", "A missed call sends your text. The phone assistant books only inside the hours you set."],
        ["Hand off", "Anything outside the script comes to a person, with a short summary."]
      ],
      demo: "thread",
      lines: [
        { side: "them", who: "Missed call · example", text: "(404) 555-0148" },
        { side: "you", who: "Your number", text: "Sorry we missed you. This is [Agency]. What do you need?" },
        { side: "them", who: "Caller", text: "I need a certificate for a job today." },
        { side: "you", who: "Your number", text: "A person will call you back. What name should they ask for?" }
      ]
    },
    "follow-up": {
      problem: "A new lead goes cold because the second and third note never go out.",
      steps: [
        ["Approve it once", "You sign off on the sequence, the hours, and the wording."],
        ["Send on your days", "The notes go out on the schedule you set."],
        ["Stop cleanly", "It stops when they book, or when they ask you to stop."]
      ],
      demo: "thread",
      lines: [
        { side: "you", who: "Day 0 · example", text: "Thanks for reaching out. Want a 15-minute call this week?" },
        { side: "you", who: "Day 2 · example", text: "Still happy to look at this. I can do Tuesday at 10 or Wednesday at 2." },
        { side: "you", who: "Day 5 · example", text: "Last note from me. Reply stop and I will not write again." }
      ]
    },
    inbox: {
      problem: "Someone has to read the whole inbox to find the few messages that matter today.",
      steps: [
        ["Label the mail", "Quote, claim, service, or junk."],
        ["Draft when needed", "A reply is drafted only for the messages that need one."],
        ["Wait on the risky ones", "Claims, money, and coverage stay for a person."]
      ],
      demo: "inbox"
    },
    renewals: {
      problem: "Renewal dates live on a spreadsheet, and one of them gets missed.",
      steps: [
        ["Read your list", "Only the policy list you provide."],
        ["Flag the dates", "60, 30, and 14 days, most urgent first."],
        ["Draft the note", "You decide which reminders can send."]
      ],
      demo: "renewals"
    },
    social: {
      problem: "The same short video has to be checked, then posted again somewhere else.",
      steps: [
        ["Draft the clip", "A caption and a cut, in your brand."],
        ["You approve", "Nothing posts until you say so."],
        ["Check that it is live", "A later pass confirms the post went up."]
      ],
      demo: "social"
    },
    report: {
      problem: "Knowing where things stand means opening several tools.",
      steps: [
        ["Read what you allow", "Only the sources you connect."],
        ["Write one note", "What came in, what is waiting, what renews."],
        ["Leave gaps blank", "If a number is not there, the note says unknown."]
      ],
      demo: "report"
    },
    chief: {
      problem: "Work slips when the next step has no owner.",
      steps: [
        ["Ask in plain words", "One front door for the team."],
        ["Draft the next step", "A small assistant takes that one job."],
        ["Wait for a yes", "Anything sent to another person stays on your list."]
      ],
      demo: "chief"
    },
    "signal-desk": {
      problem: "A bought lead list is already old, and it does not say why today is the day to call.",
      steps: [
        ["Read one public source", "Licenses, permits, funding notices, weather reports."],
        ["Keep a reason", "Each row says why it is on the list."],
        ["You choose", "Phone numbers and emails stay off the list."]
      ],
      demo: "signals"
    }
  };

  var SIGNALS = [
    {
      name: "Comp Clock",
      what: "Workers’ comp renewals that are coming due.",
      rows: ["Example employer · renewal inside 90 days", "Example employer · 20 people on the filing · initials only"]
    },
    {
      name: "Fresh Raise",
      what: "Companies that just reported new funding.",
      rows: ["Example company · funding notice this month", "Example company · first notice this quarter"]
    },
    {
      name: "New Agencies",
      what: "Agencies that just received a license.",
      rows: ["Example agency · license issued this month", "Example agency · home state listed first"]
    },
    {
      name: "Storm Desk",
      what: "Recent hail, wind, and tornado reports.",
      rows: ["Example county · hail report · last 30 days", "Example county · wind report · last 30 days"]
    }
  ];

  function reduceMotion() {
    return document.documentElement.classList.contains("reduce") ||
      (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  var stopDemo = function () {};
  var dialog, titleNode, bodyNode, sheet, lastFocus, currentId, pushed, closing;

  function ensureDialog() {
    if (dialog) return;
    dialog = document.createElement("dialog");
    dialog.className = "detail";
    dialog.setAttribute("aria-labelledby", "detail-title");
    sheet = el("div", "sheet");
    var top = el("div", "sheet-top");
    titleNode = el("h2", "");
    titleNode.id = "detail-title";
    titleNode.tabIndex = -1;
    var close = el("button", "close", "Close");
    close.type = "button";
    close.setAttribute("data-close", "");
    top.append(titleNode, close);
    bodyNode = el("div", "");
    sheet.append(top, bodyNode);
    dialog.append(sheet);
    document.body.append(dialog);
    close.addEventListener("click", function () { requestClose(false); });
    dialog.addEventListener("cancel", function (e) {
      e.preventDefault();
      requestClose(false);
    });
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) requestClose(false);
    });
  }

  function originRect(id) {
    var card = document.getElementById(id);
    if (!card) return null;
    return card.getBoundingClientRect();
  }

  function fly(fromRect, reverse, done) {
    if (!sheet) { if (done) done(); return; }
    if (reduceMotion() || !fromRect) {
      sheet.style.transition = "none";
      sheet.style.transform = "none";
      sheet.style.opacity = "1";
      if (done) done();
      return;
    }
    var to = sheet.getBoundingClientRect();
    var scale = Math.max(0.18, Math.min(0.94, fromRect.width / Math.max(to.width, 1)));
    var dx = (fromRect.left + fromRect.width / 2) - (to.left + to.width / 2);
    var dy = (fromRect.top + fromRect.height / 2) - (to.top + to.height / 2);
    var shift = "translate(" + dx + "px," + dy + "px) scale(" + scale + ")";
    if (!reverse) {
      sheet.style.transition = "none";
      sheet.style.transformOrigin = "center center";
      sheet.style.transform = shift;
      sheet.style.opacity = "0.5";
      void sheet.offsetWidth;
      sheet.style.transition = "transform .46s cubic-bezier(.16,.84,.24,1), opacity .3s ease";
      sheet.style.transform = "none";
      sheet.style.opacity = "1";
      return;
    }
    sheet.style.transition = "transform .34s cubic-bezier(.4,0,.2,1), opacity .26s ease";
    sheet.style.transform = shift;
    sheet.style.opacity = "0.15";
    var ended = false;
    function finish() {
      if (ended) return;
      ended = true;
      done();
    }
    sheet.addEventListener("transitionend", finish, { once: true });
    setTimeout(finish, 400);
  }

  function openCard(id, fromHistory) {
    var data = DETAILS[id];
    var card = document.getElementById(id);
    if (!data || !card) return;
    ensureDialog();
    stopDemo();
    currentId = id;
    lastFocus = document.activeElement;
    var heading = card.querySelector("h3");
    titleNode.textContent = heading ? heading.textContent : id;
    renderBody(data);
    var rect = originRect(id);
    if (!reduceMotion()) sheet.style.opacity = "0";
    if (!dialog.open) dialog.showModal();
    fly(rect, false);
    titleNode.focus();
    document.querySelectorAll("[data-open]").forEach(function (btn) {
      btn.setAttribute("aria-expanded", btn.getAttribute("data-open") === id ? "true" : "false");
    });
    if (!fromHistory) {
      if (dialog.open && pushed) history.replaceState({ card: id }, "", "#" + id);
      else {
        history.pushState({ card: id }, "", "#" + id);
        pushed = true;
      }
    }
  }

  function requestClose(fromHistory) {
    if (!dialog || !dialog.open || closing) return;
    closing = true;
    var rect = currentId ? originRect(currentId) : null;
    var id = currentId;
    stopDemo();
    fly(rect, true, function () {
      if (dialog.open) dialog.close();
      sheet.style.transition = "none";
      sheet.style.transform = "none";
      sheet.style.opacity = "1";
      currentId = null;
      closing = false;
      document.querySelectorAll("[data-open]").forEach(function (btn) {
        btn.setAttribute("aria-expanded", "false");
      });
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    });
    if (!fromHistory && location.hash.replace("#", "") === id) {
      if (pushed) {
        pushed = false;
        history.back();
      } else {
        history.replaceState(null, "", location.pathname + location.search);
      }
    }
  }

  function renderBody(data) {
    bodyNode.textContent = "";
    bodyNode.append(el("h3", "", "The problem"), el("p", "", data.problem));
    var how = el("h3", "", "How it works");
    var list = document.createElement("ol");
    data.steps.forEach(function (step) {
      var item = document.createElement("li");
      item.append(el("strong", "", step[0] + ". "));
      item.append(document.createTextNode(step[1]));
      list.append(item);
    });
    var host = el("div", "demo");
    bodyNode.append(how, list, host);
    stopDemo = mountDemo(host, data) || function () {};
  }

  function mountDemo(host, data) {
    var flag = el("p", "tag", "Example");
    host.append(flag);
    if (data.demo === "thread") return threadDemo(host, data.lines);
    if (data.demo === "inbox") return inboxDemo(host);
    if (data.demo === "renewals") return renewalDemo(host);
    if (data.demo === "social") return socialDemo(host);
    if (data.demo === "report") return reportDemo(host);
    if (data.demo === "chief") return chiefDemo(host);
    if (data.demo === "signals") return signalDemo(host);
    return function () {};
  }

  function threadDemo(host, lines) {
    var timers = [];
    var log = el("div", "bubbles");
    log.setAttribute("aria-live", "polite");
    var btn = el("button", "btn ghost", "Play the example");
    btn.type = "button";
    function add(line) {
      var bubble = el("div", "bubble " + line.side);
      bubble.append(el("span", "who", line.who), document.createTextNode(line.text));
      log.append(bubble);
    }
    btn.addEventListener("click", function () {
      timers.forEach(clearTimeout);
      timers = [];
      log.textContent = "";
      if (reduceMotion()) {
        lines.forEach(add);
        btn.textContent = "Play again";
        return;
      }
      btn.disabled = true;
      var n = 0;
      (function step() {
        if (n >= lines.length) {
          btn.disabled = false;
          btn.textContent = "Play again";
          return;
        }
        add(lines[n]);
        n += 1;
        timers.push(setTimeout(step, 700));
      })();
    });
    host.append(btn, log, el("p", "fine", "Example only. Not a real customer, and nothing is sent."));
    return function () { timers.forEach(clearTimeout); };
  }

  function inboxDemo(host) {
    var mail = [
      {
        subject: "Our policy renews next month. Can you send options?",
        choices: [
          ["Quote", true, "Example: labeled as a quote. The reply waits for you."],
          ["Claim", false, "Example: this one is a quote request, not a claim."],
          ["Junk", false, "Example: a person still needs this. It is not junk."]
        ]
      },
      {
        subject: "I need to file a claim for water in the shop.",
        choices: [
          ["Quote", false, "Example: this is a claim, so it stays with a person."],
          ["Claim", true, "Example: labeled as a claim. The reply waits for approval."],
          ["Junk", false, "Example: a claim is never junk."]
        ]
      }
    ];
    var index = 0;
    var scene = el("p", "result", "");
    var row = el("div", "choices");
    var note = el("p", "fine", "");
    note.setAttribute("aria-live", "polite");
    function draw() {
      var item = mail[index];
      scene.textContent = item.subject;
      row.textContent = "";
      note.textContent = "";
      item.choices.forEach(function (choice) {
        var button = el("button", "", choice[0]);
        button.type = "button";
        button.addEventListener("click", function () {
          row.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
          button.setAttribute("aria-pressed", "true");
          note.textContent = choice[2];
        });
        row.append(button);
      });
    }
    var next = el("button", "btn ghost", "Next example");
    next.type = "button";
    next.addEventListener("click", function () {
      index = (index + 1) % mail.length;
      draw();
    });
    host.append(scene, row, note, next);
    draw();
    return function () {};
  }

  function renewalDemo(host) {
    var drafts = {
      "60 days": "Hi [first name], your policy renews on [date], about 60 days out. Want me to pull options before then?",
      "30 days": "Hi [first name], your renewal is about 30 days out. I can send a short list of options this week.",
      "14 days": "Hi [first name], your renewal is 14 days out. This one is first on the call list. Example only."
    };
    var row = el("div", "choices");
    var out = el("p", "result", "Pick a mark to see the example reminder.");
    out.setAttribute("aria-live", "polite");
    Object.keys(drafts).forEach(function (label) {
      var button = el("button", "", label);
      button.type = "button";
      button.addEventListener("click", function () {
        row.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        button.setAttribute("aria-pressed", "true");
        out.textContent = drafts[label];
      });
      row.append(button);
    });
    host.append(row, out, el("p", "fine", "Example draft. Names and dates are placeholders. Nothing is sent."));
    return function () {};
  }

  function socialDemo(host) {
    var card = el("div", "result");
    card.append(el("p", "", "Three things to check before a renewal. Example caption."));
    card.append(el("p", "fine", "TikTok · YouTube Shorts · Instagram Reels"));
    var btn = el("button", "btn accent", "Approve example");
    btn.type = "button";
    var note = el("p", "fine", "");
    note.setAttribute("aria-live", "polite");
    btn.addEventListener("click", function () {
      note.textContent = "Approved · example. Nothing is posted from this page.";
      btn.disabled = true;
    });
    host.append(card, btn, note);
    return function () {};
  }

  function reportDemo(host) {
    var out = el("div", "result");
    out.hidden = true;
    out.append(
      el("p", "", "Came in: 4 new leads"),
      el("p", "", "Waiting on you: 2 drafts"),
      el("p", "", "Renews this week: unknown")
    );
    var btn = el("button", "btn ghost", "Show an example Monday");
    btn.type = "button";
    btn.addEventListener("click", function () { out.hidden = false; });
    host.append(btn, out, el("p", "fine", "Example figures, not a real week. Nothing is emailed."));
    return function () {};
  }

  function chiefDemo(host) {
    var label = el("label", "field");
    label.append(document.createTextNode("What should it do?"));
    var input = document.createElement("input");
    input.type = "text";
    input.value = "Remind me who I owe a call";
    label.append(input);
    var btn = el("button", "btn ghost", "Make the example draft");
    btn.type = "button";
    var out = el("div", "result");
    out.hidden = true;
    out.setAttribute("aria-live", "polite");
    btn.addEventListener("click", function () {
      out.hidden = false;
      out.textContent = "";
      var ask = input.value.trim() || "Remind me who I owe a call";
      out.append(el("p", "fine", "Request"));
      out.append(el("p", "", ask));
      out.append(el("p", "fine", "Draft · waiting for your OK"));
      out.append(el("p", "", "Hi [first name], checking in as asked. Reply with a time that works."));
    });
    host.append(label, btn, out, el("p", "fine", "Example draft. Nothing is sent."));
    return function () {};
  }

  function signalDemo(host) {
    var row = el("div", "choices");
    var what = el("p", "", "");
    var list = el("ul", "rows");
    function show(item, button) {
      row.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      button.setAttribute("aria-pressed", "true");
      what.textContent = item.what;
      list.textContent = "";
      item.rows.forEach(function (text) { list.append(el("li", "", text)); });
    }
    SIGNALS.forEach(function (item, i) {
      var button = el("button", "", item.name);
      button.type = "button";
      button.addEventListener("click", function () { show(item, button); });
      row.append(button);
      if (i === 0) show(item, button);
    });
    host.append(row, what, list, el("p", "fine", "Example rows. Not real leads. No phone numbers or emails."));
    return function () {};
  }

  document.querySelectorAll("[data-open]").forEach(function (btn) {
    btn.setAttribute("aria-haspopup", "dialog");
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", function () { openCard(btn.getAttribute("data-open"), false); });
  });

  window.addEventListener("popstate", function () {
    var id = location.hash.replace(/^#/, "");
    if (id && DETAILS[id] && document.getElementById(id)) openCard(id, true);
    else if (dialog && dialog.open) requestClose(true);
  });

  var startId = location.hash.replace(/^#/, "");
  if (startId && DETAILS[startId] && document.getElementById(startId)) openCard(startId, true);

  var form = document.getElementById("callback");
  if (form) {
    var status = document.getElementById("callback-status");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("cb-name").value.trim();
      var phone = document.getElementById("cb-phone").value.trim();
      var need = document.getElementById("cb-need").value.trim();
      var body = "Name: " + name + "\nPhone: " + phone + "\n\nWhat I need:\n" + need + "\n";
      if (status) status.textContent = "Your email app should open with the note filled in. If it does not, write to consulting@noahwalsey.com.";
      window.location.href = "mailto:consulting@noahwalsey.com?subject=" + encodeURIComponent("Call back request") + "&body=" + encodeURIComponent(body);
    });
  }
})();
