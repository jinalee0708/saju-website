/* ===== 사주운세 프론트엔드 로직 ===== */
(function () {
  "use strict";

  const Saju = window.Saju || {};
  const analyzeSaju = Saju.analyzeSaju;
  const checkCompatibility = Saju.checkCompatibility;

  const ELEMENT_META = {
    wood:  { ko: "목", color: "var(--wood)",  label: "목(木)" },
    fire:  { ko: "화", color: "var(--fire)",  label: "화(火)" },
    earth: { ko: "토", color: "var(--earth)", label: "토(土)" },
    metal: { ko: "금", color: "var(--metal)", label: "금(金)" },
    water: { ko: "수", color: "var(--water)", label: "수(水)" },
  };

  const FORTUNE_TABS = [
    { type: "general", label: "종합운" },
    { type: "love",    label: "연애운" },
    { type: "wealth",  label: "재물운" },
    { type: "career",  label: "직업운" },
    { type: "health",  label: "건강운" },
  ];

  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  /* ---------- 폼 제출 ---------- */
  $("saju-form").addEventListener("submit", function (e) {
    e.preventDefault();
    runAnalysis();
  });

  $("compat-form").addEventListener("submit", function (e) {
    e.preventDefault();
    runCompatibility();
  });

  function readInput() {
    return {
      name: $("input-name").value.trim() || undefined,
      birthDate: $("input-date").value,
      birthTime: $("input-time").value || undefined,
      gender: $("input-gender").value,
      calendar: "solar",
    };
  }

  /* ---------- 사주 분석 ---------- */
  function runAnalysis() {
    const input = readInput();
    if (!input.birthDate) { showError("생년월일을 입력해주세요."); return; }
    if (!input.gender) { showError("성별을 선택해주세요."); return; }

    showLoading(true);
    hideError();

    try {
      const result = analyzeSaju(input, {
        analysisType: "fortune",
        fortuneType: "general",
        targetYear: new Date().getFullYear(),
      });
      showLoading(false);
      $("results").classList.remove("hidden");
      renderSaju(result);
      renderElements(result);
      renderYongsin(result);
      renderFortuneTabs(result);
      fillCompatSelf(input);
      window.scrollTo({ top: $("results").offsetTop - 70, behavior: "smooth" });
    } catch (err) {
      showLoading(false);
      showError(err.message || "사주 계산 중 오류가 발생했습니다.");
    }
  }

  /* ---------- 사주팔자 렌더링 ---------- */
  function renderSaju(result) {
    const pillars = result.pillars;
    const order = [
      { key: "year",  name: "년주" },
      { key: "month", name: "월주" },
      { key: "day",   name: "일주" },
      { key: "hour",  name: "시주" },
    ];
    const wrap = $("pillars");
    wrap.innerHTML = "";

    order.forEach(function (item) {
      const p = pillars[item.key];
      const card = el("div", "pillar");
      card.appendChild(el("div", "pillar-mark", ""));
      card.appendChild(el("div", "pillar-name", item.name));
      card.appendChild(el("div", "pillar-label", p ? p.label : "–"));
      card.appendChild(el("div", "pillar-hanja", p ? p.hanja : ""));
      card.appendChild(el("div", "pillar-animal", p ? (p.branchAnimal + " 띠") : "시간 미상"));
      if (p) {
        const mark = card.querySelector(".pillar-mark");
        mark.textContent = ELEMENT_META[p.stemElement].ko + "·" + (p.yinYang === "yang" ? "양" : "음");
        mark.style.background = ELEMENT_META[p.stemElement].color;
      }
      wrap.appendChild(card);
    });

    const name = result.input.name || "";
    const time = result.timeAccuracy === "known"
      ? result.input.birthTime
      : "시간 미상 (연·월·일 해석)";
    $("person-line").textContent =
      (name ? name + " · " : "") + result.input.birthDate + " · " + time + " · " +
      (result.input.gender === "male" ? "남성" : "여성");

    const dm = result.dayMaster;
    const dmColor = ELEMENT_META[dm.element].color;
    $("daymaster-line").innerHTML =
      "일간(日干)은 <strong>" + dm.stem + "</strong>(" + ELEMENT_META[dm.element].ko + ", " +
      (dm.yinYang === "yang" ? "양" : "음") + ") · 기운 " +
      strengthText(dm.strength) +
      " · " + animalText(result.pillars.year.branchAnimal, result.pillars.day.branchAnimal) +
      (result.limitations && result.limitations.length
        ? " · <em>" + result.limitations.join(" ") + "</em>" : "");
    $("daymaster-line").style.borderLeftColor = dmColor;
  }

  function strengthText(s) {
    if (s === "strong") return "신강(身强)";
    if (s === "weak") return "신약(身弱)";
    return "신중(身中)";
  }
  function animalText(yearAnimal, dayAnimal) {
    return "년지 " + yearAnimal + " · 일지 " + dayAnimal;
  }

  /* ---------- 오행 분포 ---------- */
  function renderElements(result) {
    const counts = result.fiveElements;
    const max = Math.max(1, ...Object.values(counts));
    const wrap = $("element-bars");
    wrap.innerHTML = "";

    Object.keys(ELEMENT_META).forEach(function (key) {
      const count = counts[key] || 0;
      const meta = ELEMENT_META[key];
      const row = el("div", "element-row");
      row.appendChild(el("div", "element-name", meta.label));
      const track = el("div", "element-track");
      const fill = el("div", "element-fill");
      fill.style.background = meta.color;
      fill.style.width = (count / max) * 100 + "%";
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el("div", "element-count", String(count)));
      wrap.appendChild(row);
    });

    const tags = $("element-tags");
    tags.innerHTML = "";
    result.dominantElements.forEach(function (key) {
      const t = el("span", "tag strong", "강함 · " + ELEMENT_META[key].label);
      tags.appendChild(t);
    });
    result.weakElements.forEach(function (key) {
      const t = el("span", "tag weak", "부족 · " + ELEMENT_META[key].label);
      tags.appendChild(t);
    });
  }

  /* ---------- 용신 ---------- */
  function renderYongsin(result) {
    const ys = result.yongsin;
    const body = $("yongsin-body");
    body.innerHTML = "";

    const row1 = el("div", "yongsin-row");
    row1.appendChild(el("div", "yongsin-label", "주 용신"));
    const chip1 = el("span", "yongsin-chip", ys.primaryKo);
    chip1.style.background = ELEMENT_META[ys.primary].color;
    row1.appendChild(chip1);
    body.appendChild(row1);

    const row2 = el("div", "yongsin-row");
    row2.appendChild(el("div", "yongsin-label", "보조 기운"));
    const chip2 = el("span", "yongsin-chip", ys.secondaryKo);
    chip2.style.background = ELEMENT_META[ys.secondary].color;
    row2.appendChild(chip2);
    body.appendChild(row2);

    const note = el("p", "muted", ys.reasoning);
    note.style.marginTop = "10px";
    body.appendChild(note);
  }

  /* ---------- 운세 탭 ---------- */
  function renderFortuneTabs(result) {
    const tabs = $("fortune-tabs");
    const panel = $("fortune-panel");
    tabs.innerHTML = "";
    panel.innerHTML = "";

    FORTUNE_TABS.forEach(function (tab, idx) {
      const btn = el("button", "tab-btn" + (idx === 0 ? " active" : ""), tab.label);
      btn.type = "button";
      btn.addEventListener("click", function () {
        tabs.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        showFortune(result, tab.type);
      });
      tabs.appendChild(btn);
    });
    showFortune(result, FORTUNE_TABS[0].type);
  }

  function showFortune(result, type) {
    const panel = $("fortune-panel");
    const fortune = analyzeSaju(result.input, {
      analysisType: "fortune",
      fortuneType: type,
      targetYear: new Date().getFullYear(),
    }).fortune;

    panel.innerHTML = "";
    panel.appendChild(el("p", "tab-summary", fortune.summary));
    const ul = el("ul", "tab-guidance");
    (fortune.guidance || []).forEach(function (g) {
      ul.appendChild(el("li", "", g));
    });
    panel.appendChild(ul);
    if (fortune.caveat) {
      panel.appendChild(el("p", "tab-caveat", fortune.caveat));
    }
  }

  /* ---------- 궁합 ---------- */
  function fillCompatSelf(input) {
    $("compat-self-title").textContent = (input.name ? input.name + " (나)" : "나");
    if (input.birthDate) $("compat-date-1").value = input.birthDate;
    if (input.birthTime) $("compat-time-1").value = input.birthTime;
    $("compat-gender-1").value = input.gender;
  }

  function readCompatPair() {
    const p1 = {
      birthDate: $("compat-date-1").value,
      birthTime: $("compat-time-1").value || undefined,
      gender: $("compat-gender-1").value,
    };
    const p2 = {
      birthDate: $("compat-date-2").value,
      birthTime: $("compat-time-2").value || undefined,
      gender: $("compat-gender-2").value,
    };
    return { p1, p2 };
  }

  function runCompatibility() {
    const { p1, p2 } = readCompatPair();
    if (!p1.birthDate || !p2.birthDate) { showError("궁합을 보려면 두 사람의 생년월일을 모두 입력해주세요."); return; }
    hideError();

    try {
      const result = checkCompatibility({ person1: p1, person2: p2 });
      $("compat-result").classList.remove("hidden");
      renderCompatibility(result);
    } catch (err) {
      showError(err.message || "궁합 계산 중 오류가 발생했습니다.");
    }
  }

  function renderCompatibility(result) {
    const box = $("compat-result");
    box.innerHTML = "";

    // 점수
    const score = result.score;
    const scoreColor = score >= 70 ? "var(--wood)" : score >= 45 ? "var(--gold)" : "var(--fire)";
    const scoreBox = el("div", "compat-score");
    scoreBox.style.background = "linear-gradient(135deg, " + scoreColor + ", #00000033), " + scoreColor;
    scoreBox.appendChild(el("div", "score-num", score + "점"));
    scoreBox.appendChild(el("div", "score-label", "전체 궁합 점수"));
    box.appendChild(scoreBox);

    // 사람 요약
    const people = el("div", "compat-people");
    result.people.forEach(function (person, idx) {
      const card = el("div", "compat-person");
      const title = person.name || (idx === 0 ? "첫 번째 사람" : "두 번째 사람");
      card.appendChild(el("h4", "", title));
      const dm = person.dayMaster;
      card.appendChild(el("span", "pill tag",
        "일간 " + dm.stem + "(" + ELEMENT_META[dm.element].ko + ")"));
      card.appendChild(el("span", "pill tag",
        "강한 기운: " + person.dominantElements.map((k) => ELEMENT_META[k].ko).join(", ")));
      people.appendChild(card);
    });
    box.appendChild(people);

    // 요약 & 포커스
    const ul = el("ul", "compat-detail");
    ul.appendChild(el("li", "", result.summary));
    (result.focusAreas || []).forEach(function (f) { ul.appendChild(el("li", "", f)); });
    box.appendChild(ul);
  }

  /* ---------- 공용 ---------- */
  function showLoading(on) {
    $("loading").classList.toggle("hidden", !on);
  }

  function showError(msg) {
    $("error-body").textContent = msg;
    $("error-card").classList.remove("hidden");
    $("error-card").scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function hideError() { $("error-card").classList.add("hidden"); }

  // 기본값: 오늘 날짜
  $("input-date").value = new Date().toISOString().slice(0, 10);

  // 라이브러리 로드 확인
  if (!analyzeSaju || !checkCompatibility) {
    showError("사주 계산 라이브러리를 불러오지 못했습니다. saju.js 파일을 확인해주세요.");
  }
})();
