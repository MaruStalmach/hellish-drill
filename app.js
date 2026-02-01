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
// 🔥🔥🔥 BARDZIEJ WULGARNE WIADOMOŚCI 🔥🔥🔥
const hellMessages = {
  success: [
    "No kurwa, w końcu!",
    "Jebany farciarz.",
    "Nie zesraj się ze szczęścia.",
    "Może jednak nie jesteś kompletnym zjebem.",
    "O, mózg ci się włączył? Niesamowite.",
    "Masz, wpierdalaj ten punkt.",
    "Zaliczone, ale i tak cię nienawidzę.",
    "Cud nad Wisłą, kurwa jego mać.",
    "Zgadłeś, chuju.",
    "Nawet ślepa kura trafi ziarno, debilu.",
    "Szok. Jednak coś tam wiesz, śmieciu.",
    "Brawo, kurwa. Chcesz ciastko?",
    "Udało się. Pewnie przez pomyłkę.",
    "No, ujdzie w tłoku, ale nie gwiazdorz.",
    "Raz na rok to i pizda strzeli.",
  ],
  fail: [
    "Co to kurwa miało być?!",
    "Jebnij się w ten pusty łeb.",
    "Wypierdalaj z tym gównem.",
    "Chujnia z grzybnią.",
    "Jesteś tak tępy, że aż mnie boli.",
    "Kurwa, małpa by to lepiej poklikała.",
    "Wstyd jak chuj.",
    "Spierdolone koncertowo.",
    "Zmarnowałeś mi czas, nieuku.",
    "Twoja stara by to lepiej rozwiązała.",
    "Debil. Po prostu kurwa debil.",
    "Ja pierdolę, dno i kilometr mułu.",
    "Klikasz byle co, ciulu?",
    "Weź się w garść albo spierdalaj.",
    "Oczy mi krwawią od twojej głupoty.",
    "Wypierdalaj do książek, tępaku.",
  ],
};

function getRandomHellMessage(type = "success") {
  const arr = hellMessages[type];
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- PARSER LATEX (KATEX) ---
function parseLatex(text) {
  if (!text) return "";
  return text.replace(/\^\^(.*?)\^\^/g, (match, latex) => {
    try {
      if (window.katex) {
        return window.katex.renderToString(latex, {
          throwOnError: false,
          displayMode: false,
        });
      } else {
        return latex;
      }
    } catch (e) {
      console.error(e);
      return match;
    }
  });
}

// --- Obsługa Klawiatury ---

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
  nameDisplay.textContent = `${file.name}`;
  nameDisplay.classList.remove("hidden");
  nameDisplay.classList.add("block");

  const reader = new FileReader();

  reader.onload = function (e) {
    allLoadedQuestions = parseFile(e.target.result);
    questions = [...allLoadedQuestions];
    resetAllProgress();
    document.getElementById("infoBox").classList.remove("visible");

    if (questions.length === 0) {
      alert("Plik pusty albo spierdolony. 💀");
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

// --- Renderowanie Widoków ---

function renderHome() {
  if (questions.length === 0) return;

  isTestMode = false;
  isLearnMode = false;

  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="bg-neutral-900 border-2 border-red-900 shadow-[0_0_60px_rgba(220,38,38,0.2)] rounded-xl p-8 fade-in relative w-full max-w-lg flex flex-col justify-center">
      <h2 class="text-4xl font-hell text-red-600 text-center mb-6 tracking-widest bloody-text">WYBIERZ TORTURĘ</h2>
      
      <div class="absolute top-3 right-3">
        <label class="flex items-center cursor-pointer group p-2" title="Klawiatura">
            <input type="checkbox" id="keyboardToggle" class="sr-only peer" ${isKeyboardMode ? "checked" : ""}>
            <div class="relative w-8 h-4 bg-gray-800 rounded peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-500 after:border-gray-600 after:border after:rounded after:h-3 after:w-3 after:transition-all peer-checked:bg-red-800 peer-checked:after:bg-white"></div>
            <span class="ml-2 text-xs font-bold text-gray-500 group-hover:text-red-500 transition-colors">⌨️</span>
        </label>
      </div>

      <div class="flex flex-col gap-4 mb-6">
        <button onclick="startLearnMode()" class="bg-red-950 hover:bg-red-900 border border-red-800 text-white font-bold py-5 px-6 rounded-lg shadow-lg transition transform hover:-translate-y-1 w-full uppercase tracking-widest font-hell text-2xl group relative overflow-hidden">
            <div class="absolute inset-0 bg-red-900/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            <span class="group-hover:text-red-400 transition-colors relative z-10">🕯️ Nauka</span>
        </button>
        <button onclick="renderTestOptions()" class="bg-neutral-800 hover:bg-neutral-700 border border-gray-600 text-gray-300 font-bold py-5 px-6 rounded-lg shadow-lg transition transform hover:-translate-y-1 w-full uppercase tracking-widest font-hell text-2xl group relative overflow-hidden">
             <div class="absolute inset-0 bg-gray-700/50 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
             <span class="group-hover:text-white transition-colors relative z-10">⚰️ Test</span>
        </button>
      </div>
      
      ${renderProgressBar("learn", true)}
      ${renderProgressBar("test", true)}
      
      <div class="text-center mt-6 pt-4 border-t border-red-900/30">
         <button onclick="resetAllProgress()" class="text-xs text-gray-600 hover:text-red-500 underline cursor-pointer uppercase font-bold tracking-widest transition-colors">
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
  const keyEnter = isKeyboardMode
    ? '<span class="text-[9px] opacity-50 ml-1 block text-center text-red-500 font-mono">(Enter)</span>'
    : "";

  app.innerHTML = `
    <div class="bg-neutral-900 p-6 rounded-xl border border-red-900/60 shadow-[0_0_30px_rgba(220,38,38,0.1)] fade-in w-full max-w-2xl mx-auto flex flex-col h-full max-h-[85vh]">
      <div class="flex justify-between text-[10px] text-red-800 mb-1 uppercase font-bold tracking-widest font-mono shrink-0">
        <span>🕯️ Nauka</span>
        <span>Ofiara ${currentIndex + 1} / ${questions.length}</span>
      </div>

      <div class="mb-4 shrink-0">
         ${renderProgressBar("learn", false)}
      </div>
      
      <div class="mb-4 shrink-0">
          <p class="font-hell text-2xl md:text-3xl text-gray-100 tracking-wide border-l-4 border-red-800 pl-4 py-1 bloody-text leading-tight">
            ${parseLatex(q.question)}
          </p>
      </div>
      
      <div class="flex flex-col gap-2 overflow-y-auto pr-2 scrollbar-thin grow min-h-0">
        ${q.answers
          .filter((a) => a.correct)
          .map(
            (a) => `
          <div class="bg-green-950/20 text-green-400 p-4 rounded border border-green-900/50 font-medium flex items-center shadow-sm text-sm md:text-base shrink-0">
             <span class="mr-3 text-2xl shrink-0">👁️</span> <span class="leading-snug">${parseLatex(a.text)}</span>
          </div>
        `,
          )
          .join("")}
         ${
           q.explanation
             ? `
            <div class="bg-neutral-950 p-4 rounded border-l-4 border-blue-900 text-blue-300 text-xs italic flex items-center shrink-0">
                <div><span class="font-bold text-blue-500 not-italic uppercase text-[10px] block mb-1">💡 Wyjaśnienie:</span> ${parseLatex(q.explanation)}</div>
            </div>
          `
             : ""
         }
      </div>
      
      <div class="shrink-0 mt-4 border-t border-neutral-800 pt-3">
          <div class="sweet-message text-red-600 font-hell text-xl md:text-2xl text-center mb-3 bloody-text tracking-wide min-h-[2rem] flex items-center justify-center">
            ${getRandomHellMessage("success")}
          </div>

          <div class="flex justify-between items-center gap-2">
            <button onclick="renderHome()" class="bg-black hover:bg-neutral-800 text-gray-500 py-2 px-4 rounded text-xs border border-neutral-800 font-bold uppercase tracking-wider">Menu</button>
            
            <div class="flex gap-2 items-center">
                <button onclick="prevQuestion()" class="bg-neutral-800 hover:bg-neutral-700 text-gray-300 py-2 px-4 rounded disabled:opacity-30 border border-gray-700 text-sm" ${currentIndex === 0 ? "disabled" : ""}>⬅️</button>
                
                <button onclick="markAsLearned()" class="bg-red-900 hover:bg-red-800 text-white font-bold py-2 px-8 rounded shadow-[0_0_10px_rgba(220,38,38,0.3)] border border-red-700 transition flex flex-col items-center justify-center leading-tight uppercase tracking-widest font-hell text-base">
                    <span>Umiem</span>
                    ${keyEnter}
                </button>
                
                <button onclick="nextQuestion()" class="bg-neutral-800 hover:bg-neutral-700 text-gray-200 py-2 px-4 rounded border border-gray-700 text-sm">➡️</button>
            </div>
          </div>
      </div>
    </div>
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

function renderProgressBar(mode, isHome = false) {
  let learnedList = mode === "learn" ? learnedLearnMode : learnedTestMode;
  if (questions.length === 0) return "";

  const percent = Math.round((learnedList.length / questions.length) * 100);
  const color = mode === "learn" ? "bg-red-700" : "bg-orange-700";
  const label = mode === "learn" ? "CIERPIENIE" : "SĄD";

  if (isHome) {
    return `
        <div class="mt-3 w-full px-1">
          <div class="flex justify-between text-[10px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
            <span>${label}</span>
            <span class="${mode === "learn" ? "text-red-500" : "text-orange-500"}">${percent}%</span>
          </div>
          <div class="w-full bg-black rounded h-1.5 overflow-hidden border border-neutral-800">
            <div class="${color} h-1.5 rounded transition-all duration-500 ease-out flex items-center justify-center shadow-[0_0_5px_rgba(220,38,38,0.5)]" style="width: ${percent}%;">
            </div>
          </div>
        </div>
      `;
  } else {
    return `
        <div class="w-full bg-black h-2 rounded-full border border-neutral-800 relative overflow-hidden">
            <div class="${color} h-full transition-all duration-300 shadow-[0_0_8px_rgba(220,38,38,0.8)]" style="width: ${percent}%"></div>
        </div>
      `;
  }
}

// --- FUNKCJE TESTOWE ---

function renderTestOptions() {
  if (questions.length === 0) {
    alert("Wgraj plik! 💀");
    return;
  }

  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="bg-neutral-900 p-8 rounded-xl border border-red-900 shadow-xl fade-in max-w-lg mx-auto text-center flex flex-col justify-center">
      <h2 class="text-3xl font-hell text-red-600 mb-4 tracking-wide bloody-text">Sąd Ostateczny</h2>
      
      <p class="text-gray-400 mb-8 font-mono text-sm">
        Brak litości. Każdy błąd kosztuje.
      </p>

      <div class="flex justify-center gap-4">
        <button onclick="renderHome()" class="text-gray-500 hover:text-gray-300 underline text-xs uppercase tracking-widest">Wróć</button>
        <button onclick="startTest()" class="bg-red-950 hover:bg-red-900 text-white font-bold py-3 px-10 rounded border border-red-800 shadow-[0_0_15px_rgba(220,38,38,0.3)] transition font-hell text-xl tracking-wider">
            ZACZNIJ 🩸
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

  // EKRAN KOŃCOWY TESTU
  if (currentIndex >= questions.length) {
    const score = questions.length - wrongQuestions.length;
    const percentage = Math.round((score / questions.length) * 100);

    if (percentage >= 50) triggerHellConfetti();

    let title =
      percentage < 50
        ? "JESTEŚ GÓWNEM"
        : percentage === 100
          ? "PIEKIELNY WŁADCA"
          : "JAKOŚ POSZŁO";
    let message =
      percentage < 50
        ? "Wracaj do nauki albo giń."
        : "Ujdzie. Nie spodziewałem się.";
    let titleColor = percentage < 50 ? "text-gray-500" : "text-red-600";
    if (percentage === 100) titleColor = "text-red-500 animate-pulse";

    app.innerHTML = `
      <div class="bg-black p-8 rounded-xl border-2 border-red-900 shadow-[0_0_50px_rgba(220,38,38,0.2)] text-center fade-in max-w-xl mx-auto">
        <h2 class="text-3xl font-hell ${titleColor} mb-2 tracking-wide bloody-text">${title}</h2>
        <p class="text-gray-400 mb-6 font-mono text-sm">${message}</p>
        <div class="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-red-600 to-black mb-6 font-hell" style="filter: drop-shadow(0 0 5px red);">${score} / ${questions.length}</div>
        
        <div class="bg-neutral-900 p-4 rounded border border-red-900/50 mb-6">
            <div class="flex flex-col gap-3">
                <button onclick="startTest()" class="bg-red-900 hover:bg-red-800 text-white font-bold py-2 px-4 rounded border border-red-600 shadow-lg uppercase tracking-wider font-hell text-lg">🔄 Jeszcze raz</button>
                ${wrongQuestions.length > 0 ? `<button onclick="repeatWrongQuestions()" class="bg-orange-900 hover:bg-orange-800 text-orange-100 font-bold py-2 px-4 rounded border border-orange-700 shadow transition uppercase tracking-wider font-hell text-lg">⚠️ Powtórz błędy (${wrongQuestions.length})</button>` : ""}
            </div>
        </div>
        <button onclick="renderHome()" class="text-gray-600 hover:text-red-500 underline text-xs uppercase tracking-widest">Menu Główne</button>
      </div>
    `;
    saveProgress();
    return;
  }

  // PYTANIE TESTOWE
  const q = questions[currentIndex];
  const inputType = q.type === "multi" ? "checkbox" : "radio";
  const typeLabel =
    q.type === "multi"
      ? "<span class='bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded text-[9px] ml-2 border border-purple-800 font-mono align-middle'>MULTI</span>"
      : "";

  const keyboardHint = isKeyboardMode
    ? `<div class="text-[10px] text-red-600 mt-2 italic text-center animate-pulse font-mono">⌨️ Wybierz [1-${q.answers.length}], Enter</div>`
    : "";

  app.innerHTML = `
    <div class="bg-neutral-900 p-6 rounded-xl border border-red-900 shadow-xl fade-in w-full max-w-2xl mx-auto flex flex-col h-full max-h-[85vh]">
      <div class="flex justify-between text-[10px] text-red-800 mb-1 uppercase font-bold tracking-widest items-center font-mono shrink-0">
        <span>Sąd Ostateczny</span>
        <span>${currentIndex + 1} / ${questions.length}</span>
      </div>

      <div class="mb-4 shrink-0">
         ${renderProgressBar("test", false)}
      </div>

      <div class="mb-4 shrink-0">
          <h3 class="font-hell text-2xl md:text-3xl text-gray-100 inline align-middle bloody-text tracking-wide leading-tight">
            ${parseLatex(q.question)}
          </h3>
          ${typeLabel}
      </div>
      
      <div class="flex flex-col gap-3 overflow-y-auto pr-2 scrollbar-thin grow min-h-0">
        ${q.answers
          .map((a, i) => {
            const keyBadge = isKeyboardMode
              ? `<span class="bg-black text-red-600 text-[9px] font-mono px-1.5 py-0.5 rounded mr-2 border border-red-900 font-bold">${i + 1}</span>`
              : "";

            return `
              <label class="flex items-center bg-neutral-950 p-4 rounded cursor-pointer hover:bg-red-950/30 border border-neutral-800 hover:border-red-800 transition group shrink-0">
                <input type="${inputType}" name="answer" value="${i}" class="mr-3 w-4 h-4 accent-red-700 bg-gray-800 border-gray-700 shrink-0"> 
                ${keyBadge}
                <span class="group-hover:text-red-400 text-gray-300 transition-colors text-sm md:text-base leading-snug">${parseLatex(a.text)}</span>
              </label>
            `;
          })
          .join("")}
      </div>

      <div class="mt-4 shrink-0 border-t border-neutral-800 pt-3">
          ${keyboardHint}
          <div class="flex justify-between items-center mt-1">
            <button onclick="renderHome()" class="text-gray-600 hover:text-red-500 text-xs uppercase font-bold tracking-widest">Poddaję się</button>
            <button id="checkBtn" onclick="checkAnswer()" class="bg-red-900 hover:bg-red-800 text-white font-bold py-2.5 px-8 rounded shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:-translate-y-1 transition uppercase tracking-widest font-hell text-xl border border-red-700">SPRAWDZAM 🔥</button>
          </div>
      </div>
    </div>
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

  // Lista dla wyników
  let resultHTML = q.answers
    .map((a, i) => {
      let cls = "bg-neutral-950 border-neutral-800 text-gray-500 opacity-70";
      if (a.correct)
        cls =
          "bg-green-950/40 border-green-800 text-green-400 font-bold opacity-100";
      else if (selected.includes(i) && !a.correct)
        cls =
          "bg-red-950/40 border-red-800 text-red-500 line-through opacity-100";

      return `<div class="p-3 rounded border ${cls} flex items-center text-sm md:text-base shrink-0">
                <span class="mr-2 text-base shrink-0">${a.correct ? "✔️" : selected.includes(i) ? "❌" : "⚫"}</span> <span class="leading-snug">${parseLatex(a.text)}</span>
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
    ? `<div class="text-[10px] text-gray-500 mt-2 italic text-center animate-pulse font-mono">⌨️ Wciśnij Enter</div>`
    : "";

  const messageColor = isCorrect ? "text-green-600" : "text-red-600";
  const headerText = isCorrect ? "UDAŁO SIĘ." : "KURWA, ŹLE!";

  app.innerHTML = `
    <div class="bg-black p-6 rounded-xl border-2 ${isCorrect ? "border-green-900" : "border-red-900"} shadow-[0_0_30px_rgba(0,0,0,0.7)] fade-in w-full max-w-2xl mx-auto relative overflow-hidden h-full max-h-[85vh] flex flex-col">
      ${!isCorrect ? '<div class="absolute inset-0 bg-red-900/10 pointer-events-none"></div>' : ""}
      
      <p class="font-hell text-2xl text-gray-200 mb-3 tracking-wide relative z-10 bloody-text shrink-0 leading-tight">
        ${parseLatex(q.question)}
      </p>
      
      <div class="flex flex-col gap-3 relative z-10 overflow-y-auto pr-2 scrollbar-thin grow min-h-0">
        ${resultHTML}
        ${
          q.explanation
            ? `
            <div class="bg-blue-950/30 p-3 rounded border border-blue-900 text-blue-300 text-xs relative z-10 mt-2 shrink-0">
                <span class="font-bold text-blue-500 block mb-1">💡 WYJAŚNIENIE:</span> ${parseLatex(q.explanation)}
            </div>`
            : ""
        }
      </div>
      
      <div class="shrink-0 mt-4 border-t border-neutral-900 pt-2">
          <div class="text-center font-hell tracking-widest text-3xl mb-1 ${messageColor} relative z-10 bloody-text">
            ${headerText}
          </div>
          
          <div class="sweet-message text-gray-400 font-hell text-xl text-center mb-3 bloody-text tracking-wide relative z-10 min-h-[2rem] flex items-center justify-center">
             ${getRandomHellMessage(isCorrect ? "success" : "fail")}
          </div>
          
          ${keyboardHint}

          <div class="flex justify-end relative z-10">
            <button id="nextBtn" onclick="nextTestQuestion()" class="bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2 px-8 rounded border border-gray-600 shadow-lg uppercase tracking-widest font-hell text-lg">Dalej 💀</button>
          </div>
      </div>
    </div>
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
  const duration = 2000;
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
    <div class="bg-black p-8 rounded border-2 border-red-900 shadow-[0_0_50px_rgba(220,38,38,0.4)] text-center fade-in max-w-lg mx-auto flex flex-col justify-center">
      <h2 class="text-4xl font-hell text-red-600 mb-6 tracking-wide bloody-text">KONIEC MĘKI</h2>
      <p class="text-gray-400 mb-8 font-mono text-sm">Przebrnąłeś przez wszystkie fiszki.</p>
      <button onclick="renderHome()" class="bg-red-900 hover:bg-red-800 text-white font-bold py-3 px-8 rounded border border-red-600 shadow-lg uppercase tracking-widest font-hell text-xl">Wróć do piekła</button>
    </div>
  `;
}
