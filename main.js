// Pure Vanilla JavaScript Engine for ShopPilot Kirana Tech Suite - GTX PRO Edition

// Seed default inventory matches the system seed
const DEFAULT_INVENTORY = [
  { id: "inv-1", itemNameEnglish: "Amul Milk", itemNameHindi: "अमूल दूध", pricePerUnit: 32, unit: "Litre", inStock: true, category: "Dairy" },
  { id: "inv-2", itemNameEnglish: "Wheat Flour (Aata)", itemNameHindi: "आशीर्वाद आटा", pricePerUnit: 45, unit: "Kg", inStock: true, category: "Groceries" },
  { id: "inv-3", itemNameEnglish: "Sugar", itemNameHindi: "चीनी", pricePerUnit: 40, unit: "Kg", inStock: true, category: "Groceries" },
  { id: "inv-4", itemNameEnglish: "Imperial Basmati Rice", itemNameHindi: "बासमती चावल", pricePerUnit: 95, unit: "Kg", inStock: true, category: "Groceries" },
  { id: "inv-5", itemNameEnglish: "Fortune Refined Oil", itemNameHindi: "फॉर्च्यून तेल", pricePerUnit: 135, unit: "Litre", inStock: true, category: "Oils" },
  { id: "inv-6", itemNameEnglish: "Maggi Noodles 2-Min", itemNameHindi: "मैगी नूडल्स", pricePerUnit: 14, unit: "Packet", inStock: true, category: "Snacks" },
  { id: "inv-7", itemNameEnglish: "Tata Salt", itemNameHindi: "टाटा नमक", pricePerUnit: 24, unit: "Packet", inStock: true, category: "Spices" },
  { id: "inv-8", itemNameEnglish: "Potato", itemNameHindi: "ताजा आलू", pricePerUnit: 22, unit: "Kg", inStock: true, category: "Vegetables" },
  { id: "inv-9", itemNameEnglish: "Onion", itemNameHindi: "लाल प्याज", pricePerUnit: 35, unit: "Kg", inStock: true, category: "Vegetables" },
  { id: "inv-10", itemNameEnglish: "Dettol Liquid Soap", itemNameHindi: "डेटॉल साबुन", pricePerUnit: 35, unit: "Piece", inStock: true, category: "Hygiene" }
];

const DEFAULT_ORDERS = [
  {
    id: "ord-101",
    timestamp: "10:15 AM | today",
    customerName: "Aarav Sharma",
    customerPhone: "9876543210",
    items: [
      { itemNameEnglish: "Wheat Flour (Aata)", itemNameHindi: "आशीर्वाद आटा", quantity: "5 Kg", pricePerUnit: 45, totalPrice: 225 },
      { itemNameEnglish: "Amul Milk", itemNameHindi: "अमूल दूध", quantity: "2 Litre", pricePerUnit: 32, totalPrice: 64 },
      { itemNameEnglish: "Sugar", itemNameHindi: "चीनी", quantity: "1 Kg", pricePerUnit: 40, totalPrice: 40 }
    ],
    total: 329,
    status: "Pending",
    transcript: "५ किलो आटा लिखो, २ लीटर अमूल दूध, और १ किलो चीनी।",
    spokenResponseHindi: "हाँ जी आरव जी, आपका आर्डर दर्ज हो चूका है। कुल राशि ३२९ रुपये है।",
    whatsappTemplate: "*🧾 ShopPilot रसीद*\n\n*आर्डर आईडी:* ord-101\n*ग्राहक:* Aarav Sharma\n----------------------------\n• Wheat Flour: 5 Kg - ₹225\n• Amul Milk: 2 Litre - ₹64\n• Sugar: 1 Kg - ₹40\n----------------------------\n*कुल राशि:* ₹329"
  },
  {
    id: "ord-102",
    timestamp: "09:40 AM | today",
    customerName: "Sumit Verma",
    customerPhone: "9123456789",
    items: [
      { itemNameEnglish: "Maggi Noodles 2-Min", itemNameHindi: "मैगी नूडल्स", quantity: "5 Packets", pricePerUnit: 14, totalPrice: 70 },
      { itemNameEnglish: "Tata Salt", itemNameHindi: "टाटा नमक", quantity: "1 Packet", pricePerUnit: 24, totalPrice: 24 }
    ],
    total: 94,
    status: "Completed",
    transcript: "Sumit here, please prepare 1 packet of salt and 5 packets of maggi noodles.",
    spokenResponseHindi: "हाँ जी सुमित जी, मैंने ५ पैकेट मैगी और १ पैकेट नमक दर्ज कर लिया है। कुल राशि ९४ रुपये हुई है।",
    whatsappTemplate: "*🧾 ShopPilot रसीद*\n\n*आर्डर आईडी:* ord-102\n*ग्राहक:* Sumit Verma\n----------------------------\n• Maggi Noodles: 5 Packets - ₹70\n• Tata Salt: 1 Packet - ₹24\n----------------------------\n*कुल राशि:* ₹94"
  }
];

const DEFAULT_KHATA = [
  { id: "khata-1", customerName: "Rajesh Kumar (Mishra ji)", customerPhone: "9812345670", debtAmount: 450, timestamp: "Today | 11:30 AM" },
  { id: "khata-2", customerName: "Aunty flat 304", customerPhone: "9922334455", debtAmount: 120, timestamp: "Yesterday | 08:15 PM" }
];

// --- APP STATE CONTROLS ---
let currentRole = "customer";
let ownerAuthenticated = false;
let inventory = [];
let orders = [];
let khataBook = [];
let voiceResult = null;
let currentCategoryFilter = "All";
let catalogSearchQuery = "";
let isListening = false;
let recognition = null;

// Numpad input buffer
let numpadBuffer = "1";

// Debate variables
let selectedRestockProduct = null;
let isDebating = false;
let debateLogs = [];
let debateProgress = 0;
let agreedDeal = null;

// Initialize Storage values
function initStorage() {
  const localInv = localStorage.getItem("shoppilot_inventory_v1");
  if (localInv) {
    inventory = JSON.parse(localInv);
  } else {
    inventory = [...DEFAULT_INVENTORY];
    localStorage.setItem("shoppilot_inventory_v1", JSON.stringify(inventory));
  }

  const localOrders = localStorage.getItem("shoppilot_orders_v1");
  if (localOrders) {
    orders = JSON.parse(localOrders);
  } else {
    // dynamically substitute today label
    const todayStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    orders = DEFAULT_ORDERS.map(o => ({
      ...o,
      timestamp: o.timestamp.replace("today", todayStr)
    }));
    localStorage.setItem("shoppilot_orders_v1", JSON.stringify(orders));
  }

  const localKhata = localStorage.getItem("shoppilot_khata_v1");
  if (localKhata) {
    khataBook = JSON.parse(localKhata);
  } else {
    khataBook = [...DEFAULT_KHATA];
    localStorage.setItem("shoppilot_khata_v1", JSON.stringify(khataBook));
  }
}

function saveInventory() {
  localStorage.setItem("shoppilot_inventory_v1", JSON.stringify(inventory));
  renderCatalogTags();
  renderOwnerInventory();
  populateBarcodeProductSelector();
}

function saveOrders() {
  localStorage.setItem("shoppilot_orders_v1", JSON.stringify(orders));
  renderOwnerOrders();
  recalculateStats();
  recalculateAnalyticsDashboard();
}

function saveKhata() {
  localStorage.setItem("shoppilot_khata_v1", JSON.stringify(khataBook));
  renderKhataBook();
  recalculateStats();
}

// Global DOM Selectors lookup helper
const getEl = (id) => document.getElementById(id);

// Initialize events when DOM ready
document.addEventListener("DOMContentLoaded", () => {
  initStorage();
  initRecognition();
  bindEventHandlers();
  startTickingClock();
  
  // First time layout render
  renderCatalogTags();
  renderOwnerInventory();
  renderOwnerOrders();
  renderKhataBook();
  populateBarcodeProductSelector();
  recalculateStats();
  recalculateAnalyticsDashboard();
});

// Configure standard Web Speech API integration
function initRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      isListening = true;
      getEl("mic-status-text").innerText = "Listening... Speak Now! (सुन रहा हूँ...)";
      getEl("mic-status-text").classList.remove("text-indigo-400");
      getEl("mic-status-text").classList.add("text-emerald-400");
      getEl("mic-ring-pulse").classList.remove("opacity-0");
      getEl("mic-ring-pulse").classList.add("active-mic-pulse", "opacity-100");
      getEl("visualizer-wave").classList.remove("opacity-35");
      getEl("visualizer-wave").classList.add("opacity-100");
      
      const bars = document.querySelectorAll("#visualizer-wave span");
      bars.forEach(bar => bar.classList.add("voice-wave-bar"));
    };

    recognition.onerror = (e) => {
      console.error("Speech recognition error:", e);
      stopListening();
    };

    recognition.onend = () => {
      stopListening();
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        const txtArea = getEl("transcript-input");
        txtArea.value = (txtArea.value + " " + finalTranscript).trim();
      }
    };
  } else {
    console.warn("Speech Recognition API is not supported in this browser environment.");
  }
}

function startListening() {
  if (!recognition) {
    alert("Audio speech recognition not supported in this browser. Please type directly inside the panel editor box.");
    return;
  }
  const langSel = getEl("mic-language").value;
  recognition.lang = langSel;
  try {
    recognition.start();
  } catch (err) {
    console.warn(err);
  }
}

function stopListening() {
  isListening = false;
  getEl("mic-status-text").innerText = "Click to Start Speaking";
  getEl("mic-status-text").classList.remove("text-emerald-400");
  getEl("mic-status-text").classList.add("text-indigo-400");
  getEl("mic-ring-pulse").classList.remove("active-mic-pulse", "opacity-100");
  getEl("mic-ring-pulse").classList.add("opacity-0");
  getEl("visualizer-wave").classList.remove("opacity-100");
  getEl("visualizer-wave").classList.add("opacity-35");
  
  const bars = document.querySelectorAll("#visualizer-wave span");
  bars.forEach(bar => bar.classList.remove("voice-wave-bar"));

  if (recognition) {
    try {
      recognition.stop();
    } catch (e) {}
  }
}

// Play TTS synthesis audio file output
function playTTS(phrase) {
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = "hi-IN";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error("TTS voice synthesizer sound failure:", err);
  }
}

// Live Ticking Clock System
function startTickingClock() {
  const clockEl = getEl("systime-clock");
  const updateTime = () => {
    const d = new Date();
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + " UTC";
    if (clockEl) {
      clockEl.innerText = timeStr;
    }
  };
  setInterval(updateTime, 1000);
  updateTime();
}

// Generate simple physical audio beep tone on successful simulated barcode scans
function generatePhysicalBeep() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = "sine";
    oscillator.frequency.value = 1150; // crisp retail scan frequency
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime); // low volume safe for headphones
    
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      audioCtx.close();
    }, 110);
  } catch (err) {
    console.warn("Could not fire synthetic scanner beep:", err);
  }
}

// Populate virtual barcode scanner dropdown list
function populateBarcodeProductSelector() {
  const selectEl = getEl("select-barcode-product");
  if (!selectEl) return;
  selectEl.innerHTML = "";
  
  inventory.forEach(item => {
    if (item.inStock) {
      const opt = document.createElement("option");
      opt.value = item.id;
      opt.innerText = `${item.itemNameEnglish} (₹${item.pricePerUnit}/${item.unit})`;
      selectEl.appendChild(opt);
    }
  });
}

// Bind interactive click handlers and triggers
function bindEventHandlers() {
  
  // Tab selector Switch Customer Board vs Merchant Dashboard
  getEl("btn-role-customer").addEventListener("click", () => {
    currentRole = "customer";
    getEl("btn-role-customer").className = "role-tab px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer bg-indigo-600 text-white shadow";
    getEl("btn-role-owner").className = "role-tab px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 cursor-pointer";
    getEl("btn-role-owner").style.color = "#94a3b8";
    getEl("customer-view").classList.remove("hidden");
    getEl("customer-view").classList.add("block");
    getEl("owner-view").classList.remove("block");
    getEl("owner-view").classList.add("hidden");
  });

  getEl("btn-role-owner").addEventListener("click", () => {
    if (ownerAuthenticated) {
      switchToOwnerDashboard();
    } else {
      getEl("passcode-error-msg").classList.add("hidden");
      getEl("passcode-input").value = "";
      getEl("passcode-modal").classList.remove("hidden");
    }
  });

  // Verification code pass checking
  getEl("passcode-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const inputPass = getEl("passcode-input").value;
    if (inputPass === "asdfghjkl" || inputPass === "1234") {
      ownerAuthenticated = true;
      getEl("passcode-modal").classList.add("hidden");
      switchToOwnerDashboard();
    } else {
      const errEl = getEl("passcode-error-msg");
      errEl.innerText = "अमान्य पासकोड! सुरक्षा के लिए 'asdfghjkl' दर्ज करें। (Invalid. Use: asdfghjkl)";
      errEl.classList.remove("hidden");
    }
  });

  getEl("btn-cancel-passcode").addEventListener("click", () => {
    getEl("passcode-modal").classList.add("hidden");
  });

  getEl("btn-mic").addEventListener("click", () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  });

  getEl("btn-clear-transcript").addEventListener("click", () => {
    getEl("transcript-input").value = "";
    getEl("orchestrator-agent-panel-container").classList.add("hidden");
    getEl("cart-empty-state").classList.remove("hidden");
    getEl("cart-empty-state").classList.add("flex");
    getEl("cart-details").classList.remove("flex");
    getEl("cart-details").classList.add("hidden");
    voiceResult = null;
  });

  getEl("catalog-search").addEventListener("input", (e) => {
    catalogSearchQuery = e.target.value;
    renderCatalogTags();
  });

  getEl("btn-process-order").addEventListener("click", () => {
    processLiveVoiceTranscript();
  });

  getEl("btn-play-tts").addEventListener("click", () => {
    if (voiceResult && voiceResult.spokenResponseHindi) {
      playTTS(voiceResult.spokenResponseHindi);
    }
  });

  getEl("btn-print").addEventListener("click", () => {
    window.print();
  });

  getEl("btn-save-order").addEventListener("click", () => {
    commitInvoiceToOrders();
  });

  getEl("btn-whatsapp-share").addEventListener("click", () => {
    if (!voiceResult) return;
    const phone = getEl("input-customer-phone").value.trim();
    const encodedBill = encodeURIComponent(voiceResult.whatsappTemplate);
    const link = `https://wa.me/${phone}?text=${encodedBill}`;
    window.open(link, "_blank");
  });

  getEl("category-filter-container").addEventListener("click", (e) => {
    const target = e.target;
    if (target.classList.contains("cat-filter-btn")) {
      document.querySelectorAll(".cat-filter-btn").forEach(btn => {
        btn.className = "cat-filter-btn px-2.5 py-1 text-[9px] font-bold rounded-lg transition-all cursor-pointer text-slate-400 hover:text-white";
      });
      target.className = "cat-filter-btn px-2.5 py-1 text-[9px] font-bold rounded-lg transition-all cursor-pointer bg-indigo-500/10 text-indigo-400 border-indigo-400/10";
      
      currentCategoryFilter = target.getAttribute("data-cat") || "All";
      renderOwnerInventory();
    }
  });

  getEl("btn-show-add-product").addEventListener("click", () => {
    getEl("add-product-english").value = "";
    getEl("add-product-hindi").value = "";
    getEl("add-product-price").value = "";
    getEl("add-product-modal").classList.remove("hidden");
  });

  getEl("btn-close-add-product").addEventListener("click", () => {
    getEl("add-product-modal").classList.add("hidden");
  });

  getEl("add-product-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const engName = getEl("add-product-english").value.trim();
    const hinName = getEl("add-product-hindi").value.trim() || engName;
    const priceStr = getEl("add-product-price").value;
    const unitTag = getEl("add-product-unit").value;
    const catGroup = getEl("add-product-category").value;
    const inStockChecked = getEl("add-product-instock").checked;

    if (!engName || !priceStr) return;

    const newItem = {
      id: "inv-" + Date.now(),
      itemNameEnglish: engName,
      itemNameHindi: hinName,
      pricePerUnit: parseFloat(priceStr),
      unit: unitTag,
      inStock: inStockChecked,
      category: catGroup
    };

    inventory = [newItem, ...inventory];
    saveInventory();
    getEl("add-product-modal").classList.add("hidden");
    showRestockBanner(`सफलतापूर्वक जोड़ा गया! (Added ${engName} successfully to Live Catalog!)`);
  });

  getEl("btn-close-restock-arena").addEventListener("click", () => {
    getEl("b2b-restock-arena-container").classList.add("hidden");
    selectedRestockProduct = null;
    agreedDeal = null;
  });

  getEl("btn-execute-restock").addEventListener("click", () => {
    if (!agreedDeal || !selectedRestockProduct) return;
    
    inventory = inventory.map(item => {
      if (item.id === selectedRestockProduct.id) {
        return {
          ...item,
          inStock: true
        };
      }
      return item;
    });
    
    saveInventory();
    showRestockBanner(`सफलतापूर्वक आर्डर किया गया! (Successfully RESTOCKED 60 ${selectedRestockProduct.unit} of ${selectedRestockProduct.itemNameEnglish}!)`);
    getEl("b2b-restock-arena-container").classList.add("hidden");
    selectedRestockProduct = null;
    agreedDeal = null;
  });

  getEl("btn-refuse-deal").addEventListener("click", () => {
    getEl("b2b-restock-arena-container").classList.add("hidden");
    selectedRestockProduct = null;
    agreedDeal = null;
  });

  // --- BARCODE SKU EMULATOR EVENT HANDLERS ---
  getEl("btn-mock-generate-barcode").addEventListener("click", () => {
    const pId = getEl("select-barcode-product").value;
    const matched = inventory.find(it => it.id === pId);
    if (!matched) return;

    getEl("barcode-placeholder-graphics").classList.add("hidden");
    getEl("barcode-render-strips").classList.remove("hidden");
    getEl("barcode-render-strips").classList.add("flex");
    getEl("barcode-raw-sku").innerText = `SKU-${matched.id.toUpperCase()}`;
    getEl("btn-trigger-hardware-scan").removeAttribute("disabled");
  });

  getEl("btn-trigger-hardware-scan").addEventListener("click", () => {
    const laserLine = getEl("barcode-laser-sweep");
    laserLine.classList.remove("hidden");
    laserLine.classList.add("laser-glow");

    // Audio scanning beep synthesize
    generatePhysicalBeep();

    setTimeout(() => {
      laserLine.classList.add("hidden");
      laserLine.classList.remove("laser-glow");

      const pId = getEl("select-barcode-product").value;
      const matched = inventory.find(it => it.id === pId);
      if (matched) {
        const txtArea = getEl("transcript-input");
        const currentText = txtArea.value.trim();
        // Append SKU item to current input buffer nicely
        txtArea.value = currentText 
          ? `${currentText}, 1 packet of ${matched.itemNameEnglish}` 
          : `1 packet of ${matched.itemNameEnglish}`;
          
        showSnackBar(`Scanned & Appended ${matched.itemNameEnglish}!`);
      }
    }, 450);
  });

  // --- QUICK POS KEYPAD EVENT HANDLERS ---
  document.querySelectorAll(".numpad-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const val = btn.getAttribute("data-val");
      if (numpadBuffer === "1" || numpadBuffer === "0") {
        numpadBuffer = val;
      } else {
        numpadBuffer += val;
      }
      getEl("numpad-buffer-text").innerText = numpadBuffer;
    });
  });

  getEl("numpad-clear").addEventListener("click", () => {
    numpadBuffer = "1";
    getEl("numpad-buffer-text").innerText = "1";
  });

  document.querySelectorAll(".unit-multiplier-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      numpadBuffer = btn.getAttribute("data-mult");
      getEl("numpad-buffer-text").innerText = numpadBuffer;
    });
  });

  getEl("btn-numpad-apply").addEventListener("click", () => {
    const txtArea = getEl("transcript-input");
    const currentText = txtArea.value.trim();
    txtArea.value = currentText 
      ? `${currentText}, ${numpadBuffer}`
      : `${numpadBuffer}`;
    numpadBuffer = "1";
    getEl("numpad-buffer-text").innerText = "1";
    showSnackBar("Buffering input loaded!");
  });

  // --- KHATA DEBT LEDGER FORM SAVING ---
  getEl("khata-record-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const customer = getEl("khata-customer").value.trim();
    const amount = parseFloat(getEl("khata-amount").value) || 0;
    
    if (!customer || amount <= 0) return;

    const newRecord = {
      id: "khata-" + Date.now(),
      customerName: customer,
      customerPhone: "9876543210", // standard default
      debtAmount: amount,
      timestamp: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + " | " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    khataBook = [newRecord, ...khataBook];
    saveKhata();
    
    // clear input spaces
    getEl("khata-customer").value = "";
    getEl("khata-amount").value = "";
    showSnackBar(`Debt for ${customer} logged securely!`);
  });
}

function switchToOwnerDashboard() {
  currentRole = "owner";
  getEl("btn-role-owner").className = "role-tab px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer bg-indigo-600 text-white shadow";
  getEl("btn-role-customer").className = "role-tab px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200 hover:bg-slate-850/50";
  getEl("customer-view").classList.remove("block");
  getEl("customer-view").classList.add("hidden");
  getEl("owner-view").classList.remove("hidden");
  getEl("owner-view").classList.add("block");
  recalculateAnalyticsDashboard();
}

function renderCatalogTags() {
  const container = getEl("catalog-tags-grid");
  if (!container) return;
  container.innerHTML = "";

  const filtered = inventory.filter(item => {
    const textMatch = item.itemNameEnglish.toLowerCase().includes(catalogSearchQuery.toLowerCase()) || 
                      item.itemNameHindi.includes(catalogSearchQuery);
    return textMatch;
  });

  filtered.forEach(item => {
    const btn = document.createElement("button");
    btn.className = `px-2.5 py-1.5 rounded-lg border text-[11px] flex items-center justify-between gap-1.5 text-left transition-all cursor-pointer ${
      item.inStock 
        ? "bg-slate-950/60 border-slate-850 hover:border-indigo-400" 
        : "bg-slate-950/20 border-slate-900/60 opacity-40 cursor-not-allowed"
    }`;
    btn.setAttribute("type", "button");
    btn.innerHTML = `
      <span class="text-slate-250 font-medium truncate">
        ${item.itemNameEnglish} <span class="text-slate-500 text-[10px]/none inline-block">(${item.itemNameHindi})</span>
      </span>
      <span class="font-mono text-indigo-400 font-bold shrink-0">₹${item.pricePerUnit}/${item.unit}</span>
      ${!item.inStock ? '<span class="text-[8px] bg-red-950 text-red-400 border border-red-500/10 px-1 rounded shrink-0 font-bold">Out</span>' : ''}
    `;

    if (item.inStock) {
      btn.addEventListener("click", () => {
        const txtArea = getEl("transcript-input");
        const currentText = txtArea.value.trim();
        txtArea.value = currentText ? `${currentText}, ${item.itemNameEnglish}` : item.itemNameEnglish;
      });
    }

    container.appendChild(btn);
  });
}

// Processes transcript with Gemini integrating selected speak styles
async function processLiveVoiceTranscript() {
  const transValue = getEl("transcript-input").value.trim();
  if (!transValue) {
    alert("Please provide some spoken speech or type order details in the transcript editor.");
    return;
  }

  // Inject tone setting helper directions directly to the prompt payload so Gemini conforms flawlessly
  const selectedTone = getEl("select-voice-persona").value;
  let toneGuideline = "";
  if (selectedTone === "aunty") {
    toneGuideline = "\n[AI Tone Setting: You must respond styled like a loud, warm suburban Kirana Aunty ji (काकी / चाची). Start spokenResponseHindi with 'अरे सुनो बेटा...' or 'हाँ बच्चे...' keeping deep colloquial affectionate Hindi accents]";
  } else if (selectedTone === "traditional") {
    toneGuideline = "\n[AI Tone Setting: Respond in highly traditional polite Indian shopkeeper (दुकानदार) format. Start spokenResponseHindi with respectful greetings like 'राम राम भाई साहब!' or 'हाँ जी भाई साहब...' with absolute professional humility and gratitude]";
  } else if (selectedTone === "english") {
    toneGuideline = "\n[AI Tone Setting: Respond in standard conversational global English format. Translate Hindi queries back, greeting with 'Welcome back!' or 'Your order has been compiled successfully...']";
  } else if (selectedTone === "bhaiya") {
    toneGuideline = "\n[AI Tone Setting: Respond styled like a local helpful Bhaiya/Dada (किराना भैया). Start spokenResponseHindi with 'हाँ भाई बोलो, सब सामान लिख लिया है।' or 'हाँ भैया, कुल राशि ये है...' using standard Romanized-English blending]";
  }

  const payloadTranscript = `${transValue} ${toneGuideline}`;

  const procBtn = getEl("btn-process-order");
  procBtn.innerHTML = '<span class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span> Processing with Gemini Orchestrator...';
  procBtn.setAttribute("disabled", "true");

  try {
    const response = await fetch("/api/process-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: payloadTranscript,
        inventory: inventory
      })
    });

    const parsedData = await response.json();
    if (parsedData.success) {
      voiceResult = parsedData;
      renderInvoiceDraft(parsedData);
      
      // Hear voice verification
      playTTS(parsedData.spokenResponseHindi);
      populateOrchestratorIntent(transValue, parsedData);
    } else {
      alert(`API returning error: ${parsedData.error || 'Failed to process voice transcript'}`);
    }

  } catch (err) {
    console.error("Order processing post failure:", err);
    alert("API network request failed. Ensure keys are configured properly.");
  } finally {
    procBtn.innerHTML = "Analyze Voice Pattern & Draft Invoice 🚀";
    procBtn.removeAttribute("disabled");
  }
}

// Generate Invoice drafting rows and edit capability
function renderInvoiceDraft(result) {
  getEl("cart-empty-state").classList.add("hidden");
  getEl("cart-details").classList.remove("hidden");
  getEl("cart-details").classList.add("flex");

  const rowContainer = getEl("draft-item-rows");
  rowContainer.innerHTML = "";

  result.items.forEach((item, idx) => {
    const row = document.createElement("div");
    row.className = "bg-slate-950/60 border border-slate-850 p-2.5 rounded-xl flex items-center justify-between hover:border-slate-800 transition duration-150";
    row.innerHTML = `
      <div class="flex-grow pr-3">
        <p class="text-xs font-bold text-slate-100 flex items-center gap-1.5">
          ${item.itemNameEnglish} <span class="text-[10px] text-slate-400 font-normal">(${item.itemNameHindi})</span>
        </p>
        <p class="text-[10px] text-slate-450 font-mono mt-1 select-none flex items-center gap-1.5">
          Qty: <input class="qty-edit-input w-24 bg-slate-900 border border-slate-800 text-white rounded text-[10px] px-1 text-center py-0.5 inline-block font-mono focus:border-indigo-400 focus:outline-none" type="text" value="${item.quantity}" data-idx="${idx}" />
          | Rs <input class="rate-edit-input w-14 bg-slate-900 border border-slate-800 text-white rounded text-[10px] px-1 text-center py-0.5 inline-block font-mono focus:border-indigo-400 focus:outline-none" type="number" value="${item.pricePerUnit}" data-idx="${idx}" />
        </p>
      </div>
      <div class="text-right flex items-center gap-2">
        <span class="text-xs font-black font-mono text-emerald-400 line-total-span shrink-0" id="line-total-${idx}">₹${item.totalPrice}</span>
        <button class="btn-delete-row text-slate-500 hover:text-red-400 text-sm shrink-0 cursor-pointer p-1" data-idx="${idx}">✕</button>
      </div>
    `;

    row.querySelector(".qty-edit-input").addEventListener("input", (e) => {
      const targetVal = e.target.value;
      voiceResult.items[idx].quantity = targetVal;
      recalculateLineInvoice();
    });

    row.querySelector(".rate-edit-input").addEventListener("input", (e) => {
      const targetVal = parseFloat(e.target.value) || 0;
      voiceResult.items[idx].pricePerUnit = targetVal;
      recalculateLineInvoice();
    });

    row.querySelector(".btn-delete-row").addEventListener("click", () => {
      voiceResult.items.splice(idx, 1);
      renderInvoiceDraft(voiceResult);
    });

    rowContainer.appendChild(row);
  });

  getEl("invoice-grand-total").innerText = `₹${result.calculatedTotal}`;
}

function recalculateLineInvoice() {
  if (!voiceResult) return;
  let total = 0;
  voiceResult.items.forEach((item, idx) => {
    const parsedQty = parseFloat(item.quantity) || 1;
    const computedLine = Math.round(parsedQty * item.pricePerUnit);
    item.totalPrice = computedLine;
    total += computedLine;

    const lineTotalSpan = document.getElementById(`line-total-${idx}`);
    if (lineTotalSpan) {
      lineTotalSpan.innerText = `₹${computedLine}`;
    }
  });

  voiceResult.calculatedTotal = total;
  getEl("invoice-grand-total").innerText = `₹${total}`;
}

function commitInvoiceToOrders() {
  if (!voiceResult) return;

  const clientName = getEl("input-customer-name").value.trim() || "Regular Customer";
  const clientPhone = getEl("input-customer-phone").value.trim() || "9876543210";
  const orderId = "ord-" + Math.floor(100 + Math.random() * 900);
  const timeFormatted = new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }) + " | " + new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  const listStr = voiceResult.items.map(it => `• *${it.itemNameEnglish}* (${it.itemNameHindi}): ${it.quantity} - ₹${it.totalPrice}`).join("\n");
  const newTemplate = `*🧾 ShopPilot रसीद*\n\n*आर्डर आईडी:* ${orderId}\n*ग्राहक:* ${clientName}\n*स्थिति:* Pending 🕒\n*तारीख:* ${timeFormatted}\n----------------------------\n${listStr}\n----------------------------\n*Grand Total (कुल राशि):* ₹${voiceResult.calculatedTotal}\n\n*ShopPilot - Smart Kirana Billing System*`;

  const newOrder = {
    id: orderId,
    timestamp: timeFormatted,
    customerName: clientName,
    customerPhone: clientPhone,
    items: [...voiceResult.items],
    total: voiceResult.calculatedTotal,
    status: "Pending",
    transcript: getEl("transcript-input").value,
    spokenResponseHindi: voiceResult.spokenResponseHindi,
    whatsappTemplate: newTemplate
  };

  orders = [newOrder, ...orders];
  saveOrders();
  
  getEl("transcript-input").value = "";
  getEl("cart-empty-state").classList.remove("hidden");
  getEl("cart-empty-state").classList.add("flex");
  getEl("cart-details").classList.remove("flex");
  getEl("cart-details").classList.add("hidden");
  getEl("orchestrator-agent-panel-container").classList.add("hidden");
  voiceResult = null;

  showSnackBar(`Order logged successfully: ${orderId}!`);
}

function populateOrchestratorIntent(transcript, result) {
  const panel = getEl("orchestrator-agent-panel-container");
  panel.classList.remove("hidden");

  const normalized = transcript.toLowerCase();
  const isQuery = normalized.includes("?") || normalized.includes("क्या") || normalized.includes("कितने") || normalized.includes("price") || normalized.includes("भाव") || normalized.includes("स्टॉक") || normalized.includes("stock") || normalized.includes("rate") || normalized.includes("कितना");
  
  const classified = isQuery ? "INVENTORY_CATALOG_QUERY" : "CUSTOMER_ORDER_DRAFTING";
  const confidence = isQuery ? 94.8 : 99.1;
  const reasoning = isQuery 
    ? `User input detected query interrogatives. Autonomous Action: Dispatching Inventory Agent, routing to Query matching stream.`
    : `User input contains imperative structural patterns specifying brand items and raw quantities. Autonomous Decision: Route payload to customer basket compilation engines.`;

  const payloadObj = {
    raw_transcript: transcript,
    identified_language: getEl("mic-language").value,
    parsed_entities: result.items.map(it => ({ name: it.itemNameEnglish, quantity: it.quantity })),
    source_platform: "Web-Mic-Desk",
    dispatch_time_utc: new Date().toISOString()
  };

  const agentsDispatched = isQuery 
    ? ["Orchestrator Agent", "Stock Lookup Specialist"]
    : ["Orchestrator Agent", "Inventory Agent", "Reorder Agent (Low stock guard)"];

  getEl("orchestrator-classified-intent").innerText = classified;
  getEl("orchestrator-confidence-val").innerText = `${confidence}%`;
  getEl("orchestrator-confidence-bar").style.width = `${confidence}%`;
  getEl("orchestrator-decision-reasoning").innerText = reasoning;
  getEl("orchestrator-json-payload").innerText = JSON.stringify(payloadObj, null, 2);

  const tagsContainer = getEl("orchestrator-agents-tags");
  tagsContainer.innerHTML = "";
  agentsDispatched.forEach(agent => {
    const span = document.createElement("span");
    span.className = "text-[10px] bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-350 flex items-center gap-1.5 font-semibold";
    span.innerHTML = `
      <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
      ${agent}
    `;
    tagsContainer.appendChild(span);
  });
}

function recalculateStats() {
  const pendingCount = orders.filter(o => o.status === "Pending").length;
  const completedCount = orders.filter(o => o.status === "Completed").length;
  const grossRev = orders
    .filter(o => o.status === "Completed")
    .reduce((sum, order) => sum + order.total, 0);

  const creditTotal = khataBook.reduce((sum, item) => sum + item.debtAmount, 0);

  getEl("stat-pending-orders").innerText = String(pendingCount);
  getEl("stat-completed-orders").innerText = String(completedCount);
  getEl("stat-gross-revenue").innerText = `₹${grossRev}`;
  getEl("stat-udhaar-total").innerText = `₹${creditTotal}`;
}

function renderOwnerOrders() {
  const container = getEl("owner-orders-list");
  if (!container) return;
  container.innerHTML = "";

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-slate-500 text-xs font-mono">
        No transaction invoices recorded.
      </div>
    `;
    return;
  }

  orders.forEach((ord) => {
    const card = document.createElement("div");
    card.className = "bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3 relative hover:border-slate-800 transition duration-150";
    
    let badgeClass = "bg-yellow-950 text-yellow-400 border-yellow-500/10";
    if (ord.status === "Completed") badgeClass = "bg-emerald-950 text-emerald-400 border-emerald-500/10";
    if (ord.status === "Cancelled") badgeClass = "bg-red-950 text-red-100 border-red-500/10";

    const itemsListed = ord.items.map(it => `
      <div class="flex justify-between items-center text-[11px]">
        <span class="text-slate-300 font-medium">
          • ${it.itemNameEnglish} <span class="text-[10px] text-slate-500">(${it.itemNameHindi})</span>
        </span>
        <span class="text-slate-450 font-mono">
          ${it.quantity} x ₹${it.pricePerUnit} = <strong class="text-slate-200">₹${it.totalPrice}</strong>
        </span>
      </div>
    `).join("");

    card.innerHTML = `
      <div class="flex items-start justify-between">
        <div>
          <span class="text-[10px] font-mono font-black text-slate-550 block uppercase">${ord.id}</span>
          <h4 class="text-xs font-bold text-slate-200 mt-0.5">
            ${ord.customerName} <span class="text-[10px] text-slate-450 font-normal font-mono">(${ord.customerPhone})</span>
          </h4>
        </div>
        <select class="order-status-selector bg-slate-900 border border-slate-800 text-[10px] rounded-lg px-2.5 py-1 font-bold text-slate-350 focus:outline-none cursor-pointer" data-ord-id="${ord.id}">
          <option value="Pending" ${ord.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Completed" ${ord.status === 'Completed' ? 'selected' : ''}>Completed</option>
          <option value="Cancelled" ${ord.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </div>

      <div class="bg-[#0b0d18] p-3 rounded-lg border border-slate-900 space-y-1.5">
        ${itemsListed}
      </div>

      <div class="flex items-center justify-between pt-1 text-[11px]">
        <span class="text-[10px] text-slate-500 font-mono font-medium">${ord.timestamp}</span>
        <div class="flex items-center gap-2">
          <span class="text-[10px] px-2 py-0.5 border rounded-md font-mono font-bold uppercase tracking-wider ${badgeClass}">
            ${ord.status}
          </span>
          <span class="text-xs font-bold font-mono text-emerald-400">Total: ₹${ord.total}</span>
        </div>
      </div>
    `;

    card.querySelector(".order-status-selector").addEventListener("change", (e) => {
      const selected = e.target.value;
      orders = orders.map(o => {
        if (o.id === ord.id) {
          return { ...o, status: selected };
        }
        return o;
      });
      saveOrders();
    });

    container.appendChild(card);
  });
}

function renderOwnerInventory() {
  const container = getEl("owner-inventory-list");
  if (!container) return;
  container.innerHTML = "";

  const filtered = inventory.filter(item => {
    return currentCategoryFilter === "All" || item.category === currentCategoryFilter;
  });

  filtered.forEach(p => {
    const row = document.createElement("div");
    row.className = "bg-slate-950 border border-slate-850 p-4 rounded-xl hover:border-slate-800 transition relative group";
    
    row.innerHTML = `
      <div class="flex items-start justify-between">
        <div>
          <span class="text-[9px] font-mono text-indigo-400 uppercase tracking-widest block font-bold">${p.category}</span>
          <h4 class="text-xs font-bold text-slate-200 flex items-center gap-1.5 mt-1">
            ${p.itemNameEnglish} <span class="text-[10px] text-slate-500 font-normal">(${p.itemNameHindi})</span>
          </h4>
        </div>

        <div class="flex items-center gap-1.5">
          <button class="btn-owner-b2b-restock p-1 px-2.5 text-[9px] font-mono font-bold rounded-lg border bg-indigo-505/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-450/20 transition-all cursor-pointer uppercase flex items-center gap-1" data-p-id="${p.id}" title="Initiate B2B restock">
            <span>🤖 B2B Restock</span>
          </button>
          
          <button class="btn-owner-toggle-stock p-1 px-2.5 text-[9px] font-mono font-bold rounded-lg border transition-all cursor-pointer uppercase ${
            p.inStock 
              ? "bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/15" 
              : "bg-red-500/10 hover:bg-red-500/20 text-red-550 border-red-500/15"
          }" data-p-id="${p.id}">
            ${p.inStock ? "● In Stock" : "○ Out of stock"}
          </button>
        </div>
      </div>

      <div class="mt-3.5 pt-3 border-t border-slate-900 border-dashed flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px]">
        <span class="font-bold text-slate-350 font-mono">
          Rs ${p.pricePerUnit} <span class="text-[10px] text-slate-500">per ${p.unit}</span>
        </span>
        
        <div class="flex items-center gap-2">
          <input type="number" class="owner-edit-price w-14 bg-slate-900 border border-slate-800 rounded font-mono text-[10px] p-1 text-center font-bold text-slate-200 focus:border-indigo-400 focus:outline-none" value="${p.pricePerUnit}" data-p-id="${p.id}" />
          <span class="text-[9px] text-slate-500 font-mono uppercase font-bold">Rs / unit</span>
          <button class="btn-delete-product p-1.5 text-slate-600 hover:text-red-400 transition cursor-pointer" data-p-id="${p.id}">🗑️</button>
        </div>
      </div>
    `;

    row.querySelector(".btn-owner-toggle-stock").addEventListener("click", () => {
      inventory = inventory.map(item => {
        if (item.id === p.id) {
          return { ...item, inStock: !item.inStock };
        }
        return item;
      });
      saveInventory();
    });

    row.querySelector(".btn-delete-product").addEventListener("click", () => {
      if (confirm(`Are you sure you want to delete ${p.itemNameEnglish}?`)) {
        inventory = inventory.filter(item => item.id !== p.id);
        saveInventory();
      }
    });

    row.querySelector(".owner-edit-price").addEventListener("input", (e) => {
      const priceVal = parseFloat(e.target.value) || 0;
      inventory = inventory.map(item => {
        if (item.id === p.id) {
          return { ...item, pricePerUnit: priceVal };
        }
        return item;
      });
      localStorage.setItem("shoppilot_inventory_v1", JSON.stringify(inventory));
      renderCatalogTags();
    });

    row.querySelector(".btn-owner-b2b-restock").addEventListener("click", () => {
      initiateB2BAgentRestockArena(p);
    });

    container.appendChild(row);
  });
}

function initiateB2BAgentRestockArena(product) {
  selectedRestockProduct = product;
  isDebating = true;
  debateProgress = 5;
  agreedDeal = null;
  debateLogs = [];

  const arenaContainer = getEl("b2b-restock-arena-container");
  arenaContainer.classList.remove("hidden");

  getEl("debate-progress-val").innerText = "5%";
  getEl("debate-progress-bar").style.width = "5%";
  getEl("agreed-deal-card").classList.add("hidden");
  getEl("debate-status-spinner").classList.remove("hidden");
  getEl("debate-logs-container").innerHTML = "";

  const formatTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  pushDebateLog("Inventory Agent", `Stock level critical for ${product.itemNameEnglish} (${product.itemNameHindi}). Checking active records: current level requires immediate replenishment. Dispatching high-priority RFQ ticket.`, formatTime());

  setTimeout(() => {
    pushDebateLog("Reorder Agent", `Replenishment ticket certified. Running economic order calculator for ${product.itemNameEnglish}. Optimal volume order: 60 units. Sending RFQ broadcast to wholesale distributors at standard rate ₹${product.pricePerUnit}/${product.unit}. Target margin: >15%.`, formatTime());
    updateDebateProgress(30);

    setTimeout(() => {
      const bulkDiscount = Math.round(product.pricePerUnit * 0.9);
      pushDebateLog("Supplier Agent", `Distributor network response. We can supply 60 units of ${product.itemNameEnglish}. Wholesale base pricing offered: ₹${bulkDiscount}/${product.unit} (10% bulk discount applied). Standard dispatch lead time is 48 hours.`, formatTime());
      updateDebateProgress(55);

      setTimeout(() => {
        const counterOff = Math.round(product.pricePerUnit * 0.8);
        pushDebateLog("Reorder Agent", `Counter-proposal submitted. We require instant clearance and swift shipment under 12 hours to prevent store stock-out. Standard wholesale ₹${bulkDiscount} is too high. Offer: ₹${counterOff}/${product.unit} with complementary fast-shipping, or we must source from alternate wholesale brokers.`, formatTime());
        updateDebateProgress(80);

        setTimeout(() => {
          const finalContractPrice = Math.round(product.pricePerUnit * 0.85);
          pushDebateLog("Supplier Agent", `Compromise approved. Final contract price settled at ₹${finalContractPrice}/${product.unit} (15% net discount) with free premium expedited delivery within 8 hours. Releasing logistics block now.`, formatTime());
          pushDebateLog("Inventory Agent", `B2B Contract generated and signed autonomously. Total deal valuation: ₹${60 * finalContractPrice}. Handing off to the merchant for execution and stock increment clearance.`, formatTime());
          
          updateDebateProgress(100);
          isDebating = false;
          getEl("debate-status-spinner").classList.add("hidden");

          agreedDeal = {
            productName: product.itemNameEnglish,
            quantity: 60,
            pricePerUnit: finalContractPrice,
            totalAmount: 60 * finalContractPrice,
            supplierName: "Metro Shrinath Wholesale Brokers Ltd.",
            deliveryTime: "Express Delivery (Guaranteed within 8 hours)",
            calculatedDiscount: 15
          };

          getEl("deal-qty").innerText = `60 ${product.unit}`;
          getEl("deal-discount").innerText = `-15% Bulk`;
          getEl("deal-rate").innerText = `₹${finalContractPrice} / unit`;
          getEl("deal-total").innerText = `₹${60 * finalContractPrice}`;
          getEl("deal-supplier").innerText = agreedDeal.supplierName;
          getEl("deal-delivery").innerText = agreedDeal.deliveryTime;
          getEl("agreed-deal-card").classList.remove("hidden");

        }, 1500);
      }, 1500);
    }, 1500);
  }, 1500);
}

function pushDebateLog(sender, message, timestamp) {
  const container = getEl("debate-logs-container");
  if (!container) return;
  const logDiv = document.createElement("div");
  logDiv.className = "flex flex-col gap-1 text-[11px] font-semibold";
  
  let senderBg = "bg-purple-500/5 text-purple-400 border-purple-500/10";
  if (sender === "Inventory Agent") {
    senderBg = "bg-emerald-500/5 text-emerald-400 border-emerald-500/10";
  } else if (sender === "Reorder Agent") {
    senderBg = "bg-indigo-500/5 text-indigo-400 border-indigo-500/10";
  }

  logDiv.innerHTML = `
    <div class="flex items-center gap-2">
      <span class="text-[9px] px-1.5 py-0.5 border rounded-md font-bold uppercase tracking-widest ${senderBg}">${sender}</span>
      <span class="text-[8px] text-slate-500 font-medium">${timestamp}</span>
    </div>
    <p class="text-slate-300 leading-relaxed pl-1 font-medium">${message}</p>
  `;

  container.appendChild(logDiv);
  container.scrollTop = container.scrollHeight;
}

function updateDebateProgress(val) {
  debateProgress = val;
  getEl("debate-progress-val").innerText = `${val}%`;
  getEl("debate-progress-bar").style.width = `${val}%`;
}

function showRestockBanner(msg) {
  const block = getEl("restock-notification-block");
  if (!block) return;
  block.innerHTML = `
    <div class="bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-xs font-mono font-bold flex items-center justify-between shadow-lg">
      <div class="flex items-center gap-2">
        <span class="text-emerald-400 animate-bounce">🟢</span>
        <span>${msg}</span>
      </div>
      <button class="p-1.5 hover:bg-slate-900 rounded select-none cursor-pointer text-slate-400" id="btn-close-notice-banner">✕</button>
    </div>
  `;
  block.classList.remove("hidden");

  getEl("btn-close-notice-banner")?.addEventListener("click", () => {
    block.classList.add("hidden");
  });

  setTimeout(() => {
    block.classList.add("hidden");
  }, 6000);
}

// --- KHATA DEBT LEDGER RENDERING OR SQUEEZING ---
function renderKhataBook() {
  const listEl = getEl("khata-entries-list");
  if (!listEl) return;
  listEl.innerHTML = "";

  if (khataBook.length === 0) {
    listEl.innerHTML = `
      <div class="text-center py-6 text-slate-550 text-xs font-mono">
        No active outstanding customer credit (Udhaar) found. Nice job!
      </div>
    `;
    return;
  }

  khataBook.forEach(entry => {
    const row = document.createElement("div");
    row.className = "bg-slate-950 border border-slate-850 p-3.5 rounded-xl flex items-center justify-between hover:border-slate-800 transition duration-150";
    
    row.innerHTML = `
      <div class="flex-grow pr-3">
        <h4 class="text-xs font-bold text-slate-250">${entry.customerName}</h4>
        <p class="text-[9px] text-slate-500 font-semibold font-mono mt-0.5">Owed since ${entry.timestamp}</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="font-mono font-bold text-red-400 text-xs shrink-0">₹${entry.debtAmount}</span>
        <button class="btn-khata-reminder p-1.5 bg-slate-900 border border-slate-800 text-[10px]/none font-bold rounded-lg text-emerald-400 hover:text-emerald-350 transition cursor-pointer" title="Send polite WhatsApp alert notification">
          ⏰ Alert
        </button>
        <button class="btn-khata-settle p-1.5 bg-red-950/20 border border-red-900/10 text-[10px]/none font-black rounded-lg text-red-400 hover:text-red-300 transition cursor-pointer" title="Settle balance amount done">
          Clear
        </button>
      </div>
    `;

    // WhatsApp polite credit notification trigger
    row.querySelector(".btn-khata-reminder").addEventListener("click", () => {
      const template = `*खाता बुक: उधार स्मरण पत्र* ⏰\n\nनमस्ते जी, आपके विवेक अनुसार आपका कुल बकाया *₹${entry.debtAmount}* है। कृपया भुगतान अतिशीघ्र करें। \n\n*ShopPilot Pro - Smart Business Ledger Book*`;
      const encoded = encodeURIComponent(template);
      const link = `https://wa.me/${entry.customerPhone}?text=${encoded}`;
      window.open(link, "_blank");
    });

    row.querySelector(".btn-khata-settle").addEventListener("click", () => {
      khataBook = khataBook.filter(item => item.id !== entry.id);
      saveKhata();
      showSnackBar(`Outstanding debt of ₹${entry.debtAmount} for ${entry.customerName} marked SETTLED.`);
    });

    listEl.appendChild(row);
  });
}

// --- RECALCULATE DYNAMIC GRAPHICS AND LEADERBOARD INSIGHTS ---
function recalculateAnalyticsDashboard() {
  const leaderRows = getEl("analytics-leaderboard-rows");
  if (!leaderRows) return;

  // Aggregate item sales rankings from completed orders
  const salesMap = {};
  orders.forEach(order => {
    if (order.status === "Completed") {
      order.items.forEach(item => {
        const engName = item.itemNameEnglish;
        const totalCost = item.totalPrice || 0;
        salesMap[engName] = (salesMap[engName] || 0) + totalCost;
      });
    }
  });

  const sortedLeaderboard = Object.entries(salesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3); // top 3 sellers

  leaderRows.innerHTML = "";

  if (sortedLeaderboard.length === 0) {
    leaderRows.innerHTML = `
      <div class="text-[10px] text-slate-500 font-mono">
        Perform completed orders to populate rankings
      </div>
    `;
    return;
  }

  sortedLeaderboard.forEach(([name, grossAmt], index) => {
    const row = document.createElement("div");
    row.className = "flex items-center justify-between text-xs";
    row.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-[10px] font-mono font-extrabold text-indigo-400">#${index + 1}</span>
        <span class="text-slate-350 font-medium">${name}</span>
      </div>
      <strong class="font-mono text-emerald-400">₹${grossAmt}</strong>
    `;
    leaderRows.appendChild(row);
  });

  // Center aggregate amount check
  const grossRevTotal = orders
    .filter(o => o.status === "Completed")
    .reduce((sum, order) => sum + order.total, 0);
  
  getEl("analytics-total-text").innerText = `₹${grossRevTotal}`;
}

// Global visual micro-toaster snackbar
function showSnackBar(msg) {
  let toast = document.getElementById("shoppilot-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "shoppilot-toast";
    toast.className = "fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-slate-950 border border-slate-800/80 p-3 px-5 rounded-xl text-[11px] font-mono font-bold text-indigo-400 shadow-2xl z-[9999] transition-all opacity-0 pointer-events-none";
    document.body.appendChild(toast);
  }

  toast.innerHTML = `⚡ ${msg}`;
  toast.classList.remove("opacity-0", "pointer-events-none");
  toast.classList.add("opacity-100");

  setTimeout(() => {
    toast.classList.remove("opacity-100");
    toast.classList.add("opacity-0", "pointer-events-none");
  }, 2300);
}
