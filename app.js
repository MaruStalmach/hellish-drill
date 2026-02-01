let allLoadedQuestions = [];
let questions = [];
let currentIndex = 0;

// Logika postępu
let learnedLearnMode = [];
let learnedTestMode = [];
let wrongQuestions = [];

// Flagi stanów
let isTestMode = false;
let isLearnMode = false;
let isKeyboardMode = false;
let isAnswerChecked = false;

// 🔥🔥🔥 PIEKIELNE WIADOMOŚCI 🔥🔥🔥
const hellMessages = {
  success: [
    "No brawo. Chcesz medal z kartofla?",
    "Szok. Jednak masz mózg.",
    "Udało się. Pewnie przypadek.",
    "Wow, nie spieprzyłeś tego. Jestem pod wrażeniem.",
    "Wreszcie. Ile można było czekać?",
    "Cud. Po prostu kurwa cud.",
    "No, ujdzie w tłoku.",
    "Dobra, nie podniecaj się tak, jedziemy dalej.",
    "Zrobiłeś to. Twoja matka byłaby dumna, może.",
    "Niesamowite, potrafisz czytać ze zrozumieniem.",
    "No proszę, małpa by szybciej trafiła, ale zaliczam.",
  ],
  fail: [
    "Kurwa, serio? To było proste.",
    "Ja pierdolę, wstyd.",
    "Jesteś debilem czy tylko udajesz?",
    "Oczy mi krwawią od twojej głupoty.",
    "Wypierdalaj do książek, nieuku.",
    "Porażka. Dno i metr mułu.",
    "Nawet szatan by się załamał twoim poziomem.",
    "Kurwa mać... klikasz byle co?",
    "Chyba sobie żartujesz z tą odpowiedzią.",
    "Weź się w garść albo spierdalaj.",
    "Boli mnie to, jak bardzo jesteś tępy.",
  ],
};

function getRandomHellMessage(type = "success") {
  const arr = hellMessages[type];
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- Obsługa Klawiatury (Globalny Listener) ---

document.addEventListener("keydown", (e) => {
  if (!isKeyboardMode) return;

  if (isTestMode) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (currentIndex >= questions.length) {
        startTest();
        return;
      }

      if (!isAnswerChecked) checkAnswer();
      else nextTestQuestion();
    }

    if (!isAnswerChecked && e.key >= "1" && e.key <= "9") {
      const index = parseInt(e.key) - 1;
      selectAnswerByIndex(index);
    }
  }

  if (isLearnMode) {
    if (e.key === "ArrowLeft") {
      prevQuestion();
    }
    if (e.key === "ArrowRight") {
      nextQuestion();
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (currentIndex >= questions.length) {
        renderHome();
      } else {
        markAsLearned();
      }
    }
    if (e.key === "Backspace" || e.key === "Escape") {
      renderHome();
    }
  }
});

function selectAnswerByIndex(index) {
  const inputs = document.querySelectorAll('input[name="answer"]');
  if (index >= inputs.length) return;

  const input = inputs[index];
  if (input.type === "radio") {
    input.checked = true;
  } else if (input.type === "checkbox") {
    input.checked = !input.checked;
  }
}

// --- Obsługa Plików i UI ---

function toggleInfo() {
  const box = document.getElementById("infoBox");
  box.classList.toggle("visible");
}

document.getElementById("fileInput").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const nameDisplay = document.getElementById("fileName");
  nameDisplay.textContent = `Ofiara: ${file.name} 🩸`;
  nameDisplay.classList.remove("hidden");
  nameDisplay.classList.add("block");

  const reader = new FileReader();

  reader.onload = function (e) {
    allLoadedQuestions = parseFile(e.target.result);
    questions = [...allLoadedQuestions];
    resetAllProgress();
    document.getElementById("infoBox").classList.remove("visible");

    if (questions.length === 0) {
      alert("Plik jest pusty albo spierdolony. Sprawdź instrukcję 💀");
      return;
    }
    renderHome();
  };
  reader.readAsText(file, "UTF-8");
});

function parseFile(text) {
  const parsedQuestions = [];
  const rawQuestions = text.split(/\n\s*\n/);

  rawQuestions.forEach((q) => {
    const lines = q
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l !== "");
    if (lines.length === 0) return;

    const questionText = lines[0];
    const answers = [];
    let explanation = "";

    lines.slice(1).forEach((line) => {
      if (line.startsWith(">>>")) {
        answers.push({ text: line.substring(3).trim(), correct: true });
      } else if (line.startsWith("---")) {
        explanation = line.substring(3).trim();
      } else {
        answers.push({ text: line, correct: false });
      }
    });

    if (answers.length > 0) {
      const correctCount = answers.filter((a) => a.correct).length;
      parsedQuestions.push({
        question: questionText,
        answers: answers,
        explanation: explanation,
        type: correctCount > 1 ? "multi" : "single",
      });
    }
  });
  return parsedQuestions;
}

// --- Renderowanie Widoków (STYL PIEKIELNY) ---

function renderHome() {
  if (questions.length === 0) return;

  isTestMode = false;
  isLearnMode = false;

  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="bg-neutral-900 border border-red-900 shadow-[0_0_40px_rgba(220,38,38,0.15)] rounded p-8 fade-in relative">
      <h2 class="text-4xl font-hell text-red-600 text-center mb-6 tracking-widest">Wybierz Torturę</h2>
      
      <div class="absolute top-4 right-4">
        <label class="flex items-center cursor-pointer group" title="Włącz sterowanie klawiaturą">
            <input type="checkbox" id="keyboardToggle" class="sr-only peer" ${isKeyboardMode ? "checked" : ""}>
            <div class="relative w-9 h-5 bg-gray-700 peer-focus:outline-none rounded peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded after:h-4 after:w-4 after:transition-all peer-checked:bg-red-700 peer-checked:after:bg-white"></div>
            <span class="ml-2 text-xs font-bold text-gray-500 group-hover:text-red-500 transition-colors">Klawiatura ⌨️</span>
        </label>
      </div>

      <div class="flex flex-col md:flex-row justify-center gap-4 mb-8 mt-4">
        <button onclick="startLearnMode()" class="bg-red-900 hover:bg-red-700 border border-red-600 text-white font-bold py-4 px-8 rounded shadow-lg transition transform hover:-translate-y-1 w-full md:w-auto uppercase tracking-wider">
            🕯️ Tryb Nauki
        </button>
        <button onclick="renderTestOptions()" class="bg-neutral-800 hover:bg-neutral-700 border border-gray-600 text-gray-200 font-bold py-4 px-8 rounded shadow-lg transition transform hover:-translate-y-1 w-full md:w-auto uppercase tracking-wider">
            ⚰️ Tryb Testu
        </button>
      </div>
      
      ${renderProgressBar("learn")}
      ${renderProgressBar("test")}
      
      <div class="text-center mt-8 pt-6 border-t border-red-900/30">
         <button onclick="resetAllProgress()" class="text-sm text-gray-600 hover:text-red-500 underline cursor-pointer uppercase font-bold">
            🔄 Wymaż pamięć (Reset)
         </button>
      </div>
    </div>
  `;

  document.getElementById("keyboardToggle").addEventListener("change", (e) => {
    isKeyboardMode = e.target.checked;
  });
}

function startLearnMode() {
  if (questions.length === 0) {
    alert("Brak pytań! 💀");
    return;
  }
  currentIndex = 0;
  isTestMode = false;
  isLearnMode = true;
  renderLearnMode();
}

function renderLearnMode() {
  const app = document.getElementById("app");

  if (currentIndex >= questions.length) {
    renderEndScreen("learn");
    return;
  }

  const q = questions[currentIndex];

  const keyPrev = isKeyboardMode
    ? '<span class="text-[10px] opacity-50 ml-1 text-red-400">(←)</span>'
    : "";
  const keyNext = isKeyboardMode
    ? '<span class="text-[10px] opacity-50 ml-1 text-red-400">(→)</span>'
    : "";
  const keyEnter = isKeyboardMode
    ? '<span class="text-[10px] opacity-50 ml-1 block text-center text-red-400">(Enter)</span>'
    : "";

  app.innerHTML = `
    <div class="bg-neutral-900 p-6 rounded border border-red-800 shadow-[0_0_30px_rgba(0,0,0,0.8)] fade-in max-w-2xl mx-auto">
      <div class="flex justify-between text-xs text-red-600 mb-2 uppercase font-bold tracking-widest font-mono">
        <span>🕯️ Nauka</span>
        <span>Ofiara ${currentIndex + 1} / ${questions.length}</span>
      </div>
      
      <p class="font-bold text-xl text-gray-200 mb-6 font-serif tracking-wide border-l-4 border-red-700 pl-4 bg-black/30 py-2">${q.question}</p>
      
      <div class="space-y-3">
        ${q.answers
          .filter((a) => a.correct)
          .map(
            (a) => `
          <div class="bg-green-900/20 text-green-400 p-4 rounded border border-green-800 font-medium flex items-center shadow-sm">
             <span class="mr-3 text-xl">👁️</span> ${a.text}
          </div>
        `,
          )
          .join("")}
      </div>
      
      ${
        q.explanation
          ? `
        <div class="mt-6 bg-neutral-800 p-4 rounded border-l-4 border-blue-800 text-blue-200 text-sm italic">
            <span class="font-bold text-blue-400 not-italic">💡 Wyjaśnienie:</span> ${q.explanation}
        </div>
      `
          : ""
      }
      
      <div class="sweet-message mt-6 text-red-500 font-bold text-center italic h-6 font-mono text-sm">
        ${getRandomHellMessage("success")}
      </div>

      <div class="mt-8 flex justify-between items-center gap-2 flex-wrap">
        <button onclick="renderHome()" class="bg-black hover:bg-neutral-800 text-gray-500 py-2 px-4 rounded text-sm border border-neutral-700">UCIEKAJ (Menu)</button>
        
        <div class="flex gap-2 items-center">
            <button onclick="prevQuestion()" class="bg-neutral-800 hover:bg-neutral-700 text-gray-300 py-2 px-4 rounded disabled:opacity-30 border border-gray-600 flex items-center" ${currentIndex === 0 ? "disabled" : ""}>
                ⬅️ ${keyPrev}
            </button>
            
            <button onclick="markAsLearned()" class="bg-red-800 hover:bg-red-600 text-white font-bold py-2 px-6 rounded shadow-lg border border-red-500 hover:shadow-[0_0_15px_rgba(220,38,38,0.6)] transition flex flex-col items-center justify-center leading-tight uppercase tracking-wider">
                <span>Już wiem 🧠</span>
                ${keyEnter}
            </button>
            
            <button onclick="nextQuestion()" class="bg-neutral-700 hover:bg-neutral-600 text-white py-2 px-4 rounded border border-gray-500 flex items-center">
                ➡️ ${keyNext}
            </button>
        </div>
      </div>
    </div>
    <div class="max-w-2xl mx-auto">${renderProgressBar("learn")}</div>
  `;
}

function prevQuestion() {
  if (currentIndex > 0) {
    currentIndex--;
    renderLearnMode();
  }
}
function nextQuestion() {
  if (currentIndex < questions.length - 1) {
    currentIndex++;
    renderLearnMode();
  } else {
    renderEndScreen("learn");
  }
}

function markAsLearned() {
  if (!learnedLearnMode.includes(currentIndex)) {
    learnedLearnMode.push(currentIndex);
    saveProgress();
  }
  nextQuestion();
}

function renderProgressBar(mode = "learn") {
  let learnedList = mode === "learn" ? learnedLearnMode : learnedTestMode;
  if (questions.length === 0) return "";

  const percent = Math.round((learnedList.length / questions.length) * 100);
  const color = mode === "learn" ? "bg-red-600" : "bg-orange-600";
  const label = mode === "learn" ? "Postęp Cierpienia" : "Wynik Sądu";

  return `
    <div class="mt-6 w-full">
      <div class="flex justify-between text-xs font-bold text-gray-500 mb-1 uppercase">
        <span>${label}</span>
        <span class="text-red-500">${percent}%</span>
      </div>
      <div class="w-full bg-neutral-800 rounded h-4 overflow-hidden shadow-inner border border-neutral-700">
        <div class="${color} h-4 rounded transition-all duration-500 ease-out flex items-center justify-center text-[10px] text-black font-bold shadow-[0_0_10px_rgba(220,38,38,0.8)]" style="width: ${percent}%;">
          ${percent > 5 ? percent + "%" : ""}
        </div>
      </div>
      <div class="text-xs text-center mt-1 text-gray-600 font-mono">${learnedList.length} / ${questions.length}</div>
    </div>
  `;
}

// --- FUNKCJE TESTOWE ---

function renderTestOptions() {
  if (questions.length === 0) {
    alert("Wgraj plik! 💀");
    return;
  }

  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="bg-neutral-900 p-8 rounded border border-red-900 shadow-xl fade-in max-w-lg mx-auto text-center">
      <h2 class="text-3xl font-hell text-red-500 mb-4 tracking-widest">Sąd Ostateczny</h2>
      
      <p class="text-gray-500 mb-6 text-sm">
        Nie ma litości. Wykryję każdy błąd.
      </p>

      <div class="flex justify-center gap-4">
        <button onclick="renderHome()" class="text-gray-500 hover:text-gray-300 underline text-sm uppercase">Tchórzę (Wróć)</button>
        <button onclick="startTest()" class="bg-gradient-to-r from-red-900 to-black hover:from-red-700 hover:to-gray-900 text-red-100 font-bold py-3 px-8 rounded border border-red-700 shadow-[0_0_15px_rgba(220,38,38,0.4)] transition">
            ZACZNIJ RZEŹ 🩸
        </button>
      </div>
    </div>
  `;
}

function startTest() {
  if (allLoadedQuestions.length === 0) {
    alert("Brak danych! 💀");
    return;
  }
  questions = [...allLoadedQuestions];
  isTestMode = true;
  isLearnMode = false;
  currentIndex = 0;
  wrongQuestions = [];
  renderTestQuestion();
}

function renderTestQuestion() {
  const app = document.getElementById("app");
  isAnswerChecked = false;

  // EKRAN KOŃCOWY
  if (currentIndex >= questions.length) {
    const score = questions.length - wrongQuestions.length;
    const percentage = Math.round((score / questions.length) * 100);

    if (percentage >= 50) triggerHellConfetti(); // Konfetti z ognia

    let title =
      percentage < 50
        ? "JESTEŚ GÓWNEM 💩"
        : percentage === 100
          ? "WŁADCA PIEKIEŁ 👑"
          : "JAKOŚ POSZŁO...";
    let message =
      percentage < 50
        ? "Kurwa, dramat. Wracaj do nauki albo giń."
        : "No, ujdzie. Nie spodziewałem się tego po tobie.";

    app.innerHTML = `
      <div class="bg-black p-8 rounded border-2 border-red-800 shadow-[0_0_50px_rgba(220,38,38,0.3)] text-center fade-in max-w-lg mx-auto">
        <h2 class="text-4xl font-hell text-red-600 mb-4 animate-pulse">${title}</h2>
        <p class="text-gray-400 mb-6 font-mono">${message}</p>
        <div class="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-black mb-2 stroke-white" style="-webkit-text-stroke: 1px #500;">${score} / ${questions.length}</div>
        
        <div class="bg-neutral-900 p-4 rounded border border-red-900/50 mb-8 mt-6">
            <div class="flex flex-col gap-3">
                <button onclick="startTest()" class="bg-red-900 hover:bg-red-800 text-white font-bold py-3 px-6 rounded border border-red-600 shadow-lg uppercase tracking-wider">🔄 Jeszcze raz, kurwa</button>
                ${wrongQuestions.length > 0 ? `<button onclick="repeatWrongQuestions()" class="bg-orange-800 hover:bg-orange-700 text-orange-100 font-bold py-3 px-6 rounded border border-orange-600 shadow transition uppercase">⚠️ Powtórz błędy (${wrongQuestions.length})</button>` : ""}
            </div>
        </div>
        <button onclick="renderHome()" class="text-gray-600 hover:text-red-500 underline text-sm uppercase">Menu Główne</button>
      </div>
    `;
    saveProgress();
    return;
  }

  // PYTANIE
  const q = questions[currentIndex];
  const inputType = q.type === "multi" ? "checkbox" : "radio";
  const typeLabel =
    q.type === "multi"
      ? "<span class='bg-purple-900/50 text-purple-300 px-2 py-1 rounded text-[10px] ml-2 border border-purple-700 font-mono'>Wielokrotny</span>"
      : "<span class='bg-red-900/50 text-red-300 px-2 py-1 rounded text-[10px] ml-2 border border-red-700 font-mono'>Pojedynczy</span>";

  const keyboardHint = isKeyboardMode
    ? `<div class="text-xs text-red-500 mt-2 italic text-center animate-pulse font-mono">⌨️ Wybierz [1-${q.answers.length}], Enter zatwierdź</div>`
    : "";

  app.innerHTML = `
    <div class="bg-neutral-900 p-6 rounded border border-red-900 shadow-xl fade-in max-w-2xl mx-auto">
      <div class="flex justify-between text-xs text-red-700 mb-2 uppercase font-bold tracking-wider items-center font-mono">
        <span>Sąd Ostateczny</span>
        <span>${currentIndex + 1} / ${questions.length}</span>
      </div>

      <div class="mb-6">
          <p class="font-bold text-xl text-gray-200 inline align-middle font-serif">${q.question}</p>
          ${typeLabel}
      </div>
      
      <div class="space-y-3">
        ${q.answers
          .map((a, i) => {
            const keyBadge = isKeyboardMode
              ? `<span class="bg-black text-red-500 text-[10px] font-mono px-2 py-1 rounded mr-2 border border-red-900 font-bold">${i + 1}</span>`
              : "";

            return `
              <label class="flex items-center bg-neutral-800 p-4 rounded cursor-pointer hover:bg-red-900/20 border border-neutral-700 hover:border-red-600 transition group">
                <input type="${inputType}" name="answer" value="${i}" class="mr-3 w-5 h-5 accent-red-600 bg-gray-700 border-gray-600"> 
                ${keyBadge}
                <span class="group-hover:text-red-400 text-gray-300 transition-colors">${a.text}</span>
              </label>
            `;
          })
          .join("")}
      </div>

      ${keyboardHint}

      <div class="mt-8 flex justify-between items-center">
        <button onclick="renderHome()" class="text-gray-600 hover:text-red-500 text-sm uppercase font-bold">Poddaję się</button>
        <button id="checkBtn" onclick="checkAnswer()" class="bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-8 rounded shadow-[0_0_15px_rgba(220,38,38,0.5)] hover:-translate-y-1 transition uppercase tracking-wider">SPRAWDZAM 🔥</button>
      </div>
    </div>
    <div class="max-w-2xl mx-auto">${renderProgressBar("test")}</div>
  `;
}

function checkAnswer() {
  const q = questions[currentIndex];
  const selected = Array.from(
    document.querySelectorAll('input[name="answer"]:checked'),
  ).map((i) => parseInt(i.value));

  if (selected.length === 0) {
    alert("Zaznacz coś, kurwa! 🩸");
    return;
  }

  isAnswerChecked = true;

  const app = document.getElementById("app");
  const isCorrect = q.answers.every(
    (a, i) =>
      (a.correct && selected.includes(i)) ||
      (!a.correct && !selected.includes(i)),
  );

  let resultHTML = q.answers
    .map((a, i) => {
      let cls = "bg-neutral-800 border-neutral-700 text-gray-500";
      if (a.correct)
        cls = "bg-green-900/30 border-green-700 text-green-400 font-bold";
      else if (selected.includes(i) && !a.correct)
        cls = "bg-red-900/30 border-red-700 text-red-500 line-through";

      return `<div class="p-3 rounded border my-2 ${cls} flex items-center">
                <span class="mr-2">${a.correct ? "✔️" : selected.includes(i) ? "❌" : "⚫"}</span> ${a.text}
              </div>`;
    })
    .join("");

  if (isCorrect) {
    if (!learnedTestMode.includes(currentIndex))
      learnedTestMode.push(currentIndex);
  } else {
    wrongQuestions.push(currentIndex);
  }
  saveProgress();

  const keyboardHint = isKeyboardMode
    ? `<div class="text-xs text-gray-500 mt-2 italic text-center animate-pulse font-mono">⌨️ Wciśnij Enter, nie zamulaj</div>`
    : "";

  const messageColor = isCorrect ? "text-green-500" : "text-red-600";
  const headerText = isCorrect ? "UDAŁO CI SIĘ." : "KURWA, ŹLE!";

  app.innerHTML = `
    <div class="bg-black p-6 rounded border-2 ${isCorrect ? "border-green-900" : "border-red-900"} shadow-[0_0_30px_rgba(0,0,0,0.5)] fade-in max-w-2xl mx-auto relative overflow-hidden">
      ${!isCorrect ? '<div class="absolute inset-0 bg-red-900/10 pointer-events-none"></div>' : ""}
      
      <p class="font-bold text-xl text-gray-200 mb-4 font-serif relative z-10">${q.question}</p>
      
      <div class="mb-4 relative z-10">${resultHTML}</div>
      
      ${q.explanation ? `<div class="bg-blue-900/20 p-3 rounded border border-blue-800 text-blue-300 text-sm mb-4 relative z-10">💡 ${q.explanation}</div>` : ""}
      
      <div class="text-center font-hell tracking-widest text-3xl mb-2 ${messageColor} relative z-10">
        ${headerText}
      </div>
      <div class="sweet-message text-sm text-gray-400 text-center italic mb-6 font-mono border-b border-gray-800 pb-2 relative z-10">
         "${getRandomHellMessage(isCorrect ? "success" : "fail")}"
      </div>
      
      ${keyboardHint}

      <div class="flex justify-end relative z-10">
        <button id="nextBtn" onclick="nextTestQuestion()" class="bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 px-8 rounded border border-gray-600 shadow-lg uppercase">Dalej 💀</button>
      </div>
    </div>
    <div class="max-w-2xl mx-auto">${renderProgressBar("test")}</div>
  `;
}

function nextTestQuestion() {
  if (currentIndex < questions.length - 1) {
    currentIndex++;
    renderTestQuestion();
  } else {
    currentIndex++;
    renderTestQuestion();
  }
}

// --- Logika Zapisu i Resetu ---

function saveProgress() {
  const progress = {
    learnedLearnMode: learnedLearnMode,
    learnedTestMode: learnedTestMode,
    wrongQuestions: wrongQuestions,
  };
  localStorage.setItem("hellDrillProgress", JSON.stringify(progress));
}

function loadProgress() {
  const progress = JSON.parse(localStorage.getItem("hellDrillProgress"));
  if (progress) {
    learnedLearnMode = progress.learnedLearnMode || [];
    learnedTestMode = progress.learnedTestMode || [];
    wrongQuestions = progress.wrongQuestions || [];
  }
}

function resetAllProgress() {
  currentIndex = 0;
  learnedLearnMode = [];
  learnedTestMode = [];
  wrongQuestions = [];
  isTestMode = false;
  localStorage.removeItem("hellDrillProgress");
  if (questions.length > 0) renderHome();
}

function repeatWrongQuestions() {
  if (wrongQuestions.length === 0) return;
  questions = wrongQuestions.map((index) => allLoadedQuestions[index]);
  wrongQuestions = [];
  currentIndex = 0;
  isTestMode = true;
  isLearnMode = false;
  alert(
    `Zaczynamy tortury od nowa! ${questions.length} błędów do naprawienia. Cierp! 🩸`,
  );
  renderTestQuestion();
}

function triggerHellConfetti() {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  // Kolory ognia i popiołu
  const hellColors = [
    "#ff0000",
    "#8b0000",
    "#ff4500",
    "#ffa500",
    "#000000",
    "#333333",
  ];

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);
    const particleCount = 50 * (timeLeft / duration);
    confetti(
      Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: hellColors,
      }),
    );
    confetti(
      Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: hellColors,
      }),
    );
  }, 250);
}

function renderEndScreen(mode) {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="bg-black p-8 rounded border-2 border-red-900 shadow-[0_0_50px_rgba(220,38,38,0.4)] text-center fade-in max-w-lg mx-auto">
      <h2 class="text-4xl font-hell text-red-600 mb-4 tracking-widest">KONIEC MĘKI</h2>
      <p class="text-gray-400 mb-8 font-mono">Przebrnąłeś przez wszystkie fiszki. Możesz odpocząć... na chwilę.</p>
      <button onclick="renderHome()" class="bg-red-900 hover:bg-red-700 text-white font-bold py-3 px-8 rounded border border-red-500 shadow-lg uppercase">Wróć do piekła</button>
    </div>
  `;
}
