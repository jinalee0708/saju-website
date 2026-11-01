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

  // 일간 오행별 귀여운 동물 캐릭터
  const CHARACTERS = {
    wood: {
      name: "토닥토닥 토끼",
      species: "토끼",
      body: "#c9e6cf", face: "#fdf3f0", ear: "#8fc4a0", accent: "#e88ca0",
      desc: "부드럽고 쑥쑥 자라는 기운. 나를 먼저 챙기는 온기와 함께라면 어디서든 싹을 틔워요.",
      // 귀 모양: 길쭉한 토끼 귀
      ears: 'M38 58 Q30 18 52 22 Q56 40 52 58 Z M102 58 Q110 18 88 22 Q84 40 88 58 Z',
    },
    fire: {
      name: "불꽃 여우",
      species: "여우",
      body: "#ffd0a8", face: "#fff6ee", ear: "#ff9d66", accent: "#ff5d5d",
      desc: "따뜻하고 단단한 열정. 마음이 불타오를 때 그 에너지로 사람들을 이끄는 재능이 있어요.",
      ears: 'M40 62 L34 24 L62 46 Z M100 62 L106 24 L78 46 Z',
    },
    earth: {
      name: "든든 곰",
      species: "곰",
      body: "#d8b48a", face: "#f6ead9", ear: "#b98a5f", accent: "#8a5f3a",
      desc: "신뢰를 만드는 중심기둥. 느긋하지만 한 번 다짐하면 어떤 일도 끝까지 책임지는 힘의 소유자예요.",
      ears: 'M40 66 a14 14 0 1 1 0 1 M100 66 a14 14 0 1 1 0 1',
    },
    metal: {
      name: "냐옹 고양이",
      species: "고양이",
      body: "#cdd6e0", face: "#fbfcfe", ear: "#a8b4c2", accent: "#7a6bff",
      desc: "날카롭고 단정한 감각. 좋고 싫음이 선명하고, 정한 기준은 흔들리지 않는 확고한 심지를 지녔어요.",
      ears: 'M36 62 L38 20 L66 44 Z M104 62 L102 20 L74 44 Z',
    },
    water: {
      name: "반짝 수달",
      species: "수달",
      body: "#bcd7ee", face: "#f2f9ff", ear: "#7fb3dd", accent: "#3f8ad1",
      desc: "유연하고 깊은 공감 능력. 흐름을 읽는 눈빛으로 누구와도 자연스럽게 연결되는 매력이 있어요.",
      ears: 'M40 68 a11 11 0 1 1 0 1 M100 68 a11 11 0 1 1 0 1',
    },
  };

  // MBTI 축별 해석 문구
  const MBTI_READINGS = {
    E: { axis: "EI", label: "외향형 (E)", text: "바깥 활동과 사람 만남에서 에너지를 얻어요. 활발한 기운이 사주의 강한 오행과 만나 더 빛납니다." },
    I: { axis: "EI", label: "내향형 (I)", text: "혼자만의 시간에서 에너지를 회복해요. 깊은 집중력이 사주의 부족한 오행을 보완해줍니다." },
    S: { axis: "SN", label: "감각형 (S)", text: "지금 눈앞의 현실과 경험을 중시해요. 흙처럼 단단한 현실감으로 목표를 이루는 힘이 있습니다." },
    N: { axis: "SN", label: "직관형 (N)", text: "미래와 가능성을 상상하는 데 강해요. 물과 불처럼 흐르는 상상력이 새로운 길을 엽니다." },
    T: { axis: "TF", label: "사고형 (T)", text: "논리와 원칙으로 판단해요. 쇠처럼 단단한 판단력이 흔들림 없는 결정을 만듭니다." },
    F: { axis: "TF", label: "감정형 (F)", text: "사람의 마음과 관계를 중시해요. 따뜻한 감성이 상대의 마음을 여는 열쇠가 됩니다." },
    J: { axis: "JP", label: "판단형 (J)", text: "계획과 마감을 세워 움직여요. 가지런한 질서가 부족한 기운을 잡아주는 버팀목입니다." },
    P: { axis: "JP", label: "인식형 (P)", text: "유연하게 흐르는 대로 대응해요. 막힘없는 여유가 상황을 자연스럽게 풀어갑니다." },
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

  /* ---------- MBTI 선택 ---------- */
  const mbtiSelected = {};
  const MBTI_AXIS_ORDER = ["EI", "SN", "TF", "JP"];

  document.querySelectorAll(".mbti-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const axis = btn.dataset.axis;
      mbtiSelected[axis] = btn.dataset.value;
      // 같은 축 안에서 active 표시 갱신
      document.querySelectorAll('.mbti-btn[data-axis="' + axis + '"]').forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
      updateMbtiPreview();
    });
  });

  function getMbti() {
    let result = "";
    MBTI_AXIS_ORDER.forEach(function (axis) {
      result += mbtiSelected[axis] || "";
    });
    return result; // 예: "ENFP", 또는 미완성일 땐 짧은 문자열
  }

  function updateMbtiPreview() {
    const mbti = getMbti();
    $("mbti-preview").textContent = mbti.length === 4 ? mbti : (mbti || "–");
  }

  function readInput() {
    return {
      name: $("input-name").value.trim() || undefined,
      birthDate: $("input-date").value,
      birthTime: $("input-time").value || undefined,
      gender: $("input-gender").value,
      calendar: "solar",
      mbti: getMbti() || undefined,
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
      renderCharacter(result, input.mbti);
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

  /* ---------- MBTI × 사주 캐릭터 ---------- */
  function renderCharacter(result, mbti) {
    const element = result.dayMaster.element;
    const char = CHARACTERS[element];
    if (!char) return;
    if (!mbti) mbti = "";

    $("character-svg").innerHTML = buildCharacterSvg(element, mbti);
    $("character-name").textContent = char.name;
    $("character-name").style.color = ELEMENT_META[element].color;

    // 태그
    const tags = $("character-tags");
    tags.innerHTML = "";
    tags.appendChild(el("span", "tag", ELEMENT_META[element].label + " 일간"));
    tags.appendChild(el("span", "tag", char.species + " 캐릭터"));
    if (mbti && mbti.length === 4) {
      const t = el("span", "tag", mbti + " × " + ELEMENT_META[element].ko);
      t.style.borderColor = ELEMENT_META[element].color;
      t.style.color = ELEMENT_META[element].color;
      tags.appendChild(t);
    }

    $("character-desc").textContent = char.desc;

    // MBTI 해석
    const reading = $("mbti-reading");
    reading.innerHTML = "";
    if (mbti && mbti.length === 4) {
      mbti.split("").forEach(function (letter) {
        const info = MBTI_READINGS[letter];
        if (!info) return;
        const item = el("div", "reading-item");
        const b = el("b", "", info.label + " · ");
        item.appendChild(b);
        item.appendChild(document.createTextNode(info.text));
        reading.appendChild(item);
      });
    } else {
      const item = el("div", "reading-item");
      item.innerHTML = "MBTI를 선택하면 오행과 어울리는 성향 해석을 볼 수 있어요! 🐾";
      reading.appendChild(item);
    }
  }

  /* ---------- SVG 귀여운 캐릭터 ---------- */
  function buildCharacterSvg(element, mbti) {
    const char = CHARACTERS[element];
    const m = mbti && mbti.length === 4 ? mbti : "";

    // 표정: E는 반짝 큰 눈, I는 부드러운 눈
    const eyesOpen = m.charAt(0) === "E";
    // 뺨: F는 분홍 뺨, 아니면 연한 뺨
    const blush = m.charAt(2) === "F";
    // 입: F는 크게 웃음, T는 작은 미소
    const wideMouth = m.charAt(2) === "F";
    // 장식: J는 나비넥타이, P는 리본
    const bow = m.charAt(3) === "J";
    const ribbon = m.charAt(3) === "P";

    const eye = eyesOpen
      ? '<circle cx="55" cy="86" r="6" fill="#3b3128"/><circle cx="57" cy="84" r="2" fill="#fff"/>' +
        '<circle cx="85" cy="86" r="6" fill="#3b3128"/><circle cx="87" cy="84" r="2" fill="#fff"/>'
      : '<path d="M49 84 Q55 88 61 84" stroke="#3b3128" stroke-width="4" stroke-linecap="round" fill="none"/>' +
        '<path d="M79 84 Q85 88 91 84" stroke="#3b3128" stroke-width="4" stroke-linecap="round" fill="none"/>';

    const cheek = blush
      ? '<ellipse cx="44" cy="96" rx="6" ry="4" fill="#ffb3c1" opacity="0.8"/><ellipse cx="96" cy="96" rx="6" ry="4" fill="#ffb3c1" opacity="0.8"/>'
      : '<ellipse cx="44" cy="96" rx="5" ry="3" fill="#ffd0a8" opacity="0.7"/><ellipse cx="96" cy="96" rx="5" ry="3" fill="#ffd0a8" opacity="0.7"/>';

    const mouth = wideMouth
      ? '<path d="M64 100 Q70 108 76 100 Z" fill="#c96a5b"/>'
      : '<path d="M66 102 Q70 106 74 102" stroke="#b0604f" stroke-width="3.5" stroke-linecap="round" fill="none"/>';

    // 장식
    let accessory = "";
    if (bow) {
      accessory = '<g><path d="M70 122 l-10 -5 l10 5 l-10 5 Z" fill="#ff8fab"/>' +
        '<path d="M70 122 l10 -5 l-10 5 l10 5 Z" fill="#ff8fab"/><circle cx="70" cy="122" r="3.5" fill="#e85d85"/></g>';
    } else if (ribbon) {
      accessory = '<g><path d="M55 32 Q70 22 85 32 Q70 40 55 32 Z" fill="#ffc94d"/>' +
        '<circle cx="70" cy="32" r="4" fill="#f0a832"/></g>';
    } else {
      accessory = '<path d="M70 34 a4 4 0 1 0 0.01 0 Z" fill="#f7c94d" opacity="0.9"/>';
    }

    const svg =
      '<svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + char.name + '">' +
        // 몸 (둥근 몸통)
        '<ellipse cx="70" cy="96" rx="42" ry="38" fill="' + char.body + '"/>' +
        // 귀
        '<path d="' + char.ears + '" fill="' + char.ear + '"/>' +
        // 얼굴 (더 밝은 원)
        '<circle cx="70" cy="90" r="34" fill="' + char.face + '"/>' +
        // 얼굴 위 장식 (리본/꽃)
        accessory +
        // 눈
        eye +
        // 뺨
        cheek +
        // 입
        mouth +
        // 발 (아래 작은 발)
        '<ellipse cx="46" cy="130" rx="9" ry="6" fill="' + char.body + '"/>' +
        '<ellipse cx="94" cy="130" rx="9" ry="6" fill="' + char.body + '"/>' +
      '</svg>';

    return svg;
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
