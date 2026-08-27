"use strict";

const music = new Audio("./sounds/loop.mp3");

music.loop = true;
music.volume = 0.8;

function startMusic() {
  if (music.paused) {
    music.play().catch(error => {
      console.log("Musik wartet auf Benutzerinteraktion:", error);
    });
  }
}

window.addEventListener("load", () => {
  startMusic();
});

// Sobald der Spieler irgendwo klickt oder auf dem Bildschirm tippt
document.addEventListener("pointerdown", startMusic, {
  once: true
});

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const defaultSave = {
  money: 0,
  unlockedCars: ["starter"],
  selectedCar: "starter",
  unlockedRoads: ["city"],
  selectedRoad: "city",
  highscore: 0,
  trafficDensity: "normal"
};

let save;

try {
  save = JSON.parse(
    localStorage.getItem("policeEscapeSave") || "null"
  ) || { ...defaultSave };
} catch (error) {
  save = { ...defaultSave };
}

save.money = Number(save.money) || 0;
save.unlockedCars = Array.isArray(save.unlockedCars)
  ? save.unlockedCars
  : ["starter"];
save.unlockedRoads = Array.isArray(save.unlockedRoads)
  ? save.unlockedRoads
  : ["city"];
save.selectedCar = save.selectedCar || "starter";
save.selectedRoad = save.selectedRoad || "city";
save.trafficDensity = save.trafficDensity || "normal";

function persist() {
  localStorage.setItem(
    "policeEscapeSave",
    JSON.stringify(save)
  );
}

const sounds = {
  click: new Audio("sounds/click.mp3"),
  over: new Audio("sounds/over.mp3"),
  loop: new Audio("sounds/loop.mp3")
};

const siren = new Audio("./sounds/siren.mp3");
siren.volume = 0.6;

let sirenTimer = null;

function startRandomSiren() {

  clearTimeout(sirenTimer);

  const delay = 5000 + Math.random() * 10000;

  sirenTimer = setTimeout(() => {

    // Nur wenn das Spiel läuft
    if (state === "game" && !paused) {

      siren.currentTime = 0;
      siren.play().catch(() => {});

    }

    // Nur weitermachen, wenn das Spiel noch läuft
    if (state === "game") {
      startRandomSiren();
    }

  }, delay);
}

document.querySelectorAll("button").forEach(button => {
  button.addEventListener("click", () => {
    sounds.click.currentTime = 0;
    sounds.click.play();
  });
});

const cars = {
  starter: {
    name: "Standard Car",
    file: "standart_car.png",
    price: 0,
    steer: 1
  },

  retro: {
    name: "Retro Car",
    file: "retro_car.png",
    price: 350,
    steer: 1.05
  },

  sport: {
    name: "Sportwagen",
    file: "sport_car.png",
    price: 700,
    steer: 1.2
  },

  muscle: {
    name: "Muscle Car",
    file: "muscle_car.png",
    price: 1000,
    steer: .95
  },

  f1: {
    name: "F1 Car",
    file: "f1_car.png",
    price: 1600,
    steer: 1.35
  }
};

const trafficFiles = [
  "car_01.png",
  "car_02.png",
  "car_03.png",
  "car_04.png",
  "car_05.png",
  "car_06.png",
  "car_07.png"
];



const imageCache = {};

function loadImage(path) {
  if (!imageCache[path]) {
    const image = new Image();
    image.src = path;
    imageCache[path] = image;
  }

  return imageCache[path];
}

function driverImage(file) {
  return loadImage("objects/cars/driver/" + file);
}

function trafficImage(file) {
  return loadImage("objects/cars/trafic/" + file);
}

const policeImages = [
  loadImage("objects/cars/police/police_1.png"),
  loadImage("objects/cars/police/police_2.png")
];

let policeAnimationTime = 0;

const roads = {
  city: {
    name: "City",
    price: 0,
    sky: "#162536",
    grass: "#173b31",
    road: "#303944",
    line: "#f4f1de"
  },

  highway: {
    name: "Highway",
    price: 500,
    sky: "#477ca2",
    grass: "#28613d",
    road: "#34383e",
    line: "#f8f2bd"
  },

  desert: {
    name: "Desert",
    price: 800,
    sky: "#d58d50",
    grass: "#b87542",
    road: "#4b4544",
    line: "#ffe6a7"
  },

  night: {
    name: "Night",
    price: 1000,
    sky: "#080d25",
    grass: "#101b25",
    road: "#202732",
    line: "#b5d7ff"
  },

  snow: {
    name: "Snow",
    price: 1400,
    sky: "#b7d2e0",
    grass: "#d8edf0",
    road: "#626b76",
    line: "#ffffff"
  }
};

const densitySelect = document.getElementById("densitySelect");

if (densitySelect) {
  densitySelect.value = save.trafficDensity || "normal";

  densitySelect.addEventListener("change", () => {
    save.trafficDensity = densitySelect.value;
    persist();
  });
}


let W = 0;
let H = 0;
let state = "menu";
let paused = false;
let animationId;
let lastTime = 0;
let roadScroll = 0;
let score = 0;
let distance = 0;
let lives = 3;
let earned = 0;
let invulnerable = 0;
let spawnTimer = 0;
let policeRespawn = 0;
let policeSpawnProtection = 0;
let traffic = [];
let keys = {
  left: false,
  right: false
};

const player = {
  x: .5,
  y: 0,
  width: 38,
  height: 70
};

const police = {
  x: .5,
  y: 0,
  width: 39,
  height: 70,
  active: true
};

function showScreen(name) {
  document
    .querySelectorAll(".screen")
    .forEach(s => s.classList.remove("active"));

  document.getElementById(name).classList.add("active");

  state = name;
  updateMoney();
}

function densitySettings() {
  return {
    low: {
      maxTraffic: 4,
      spawnMultiplier: 1.45
    },

    normal: {
      maxTraffic: 7,
      spawnMultiplier: 1
    },

    high: {
      maxTraffic: 10,
      spawnMultiplier: .68
    }
  }[save.trafficDensity] || {
    maxTraffic: 7,
    spawnMultiplier: 1
  };
}

function updateMoney() {
  document
    .querySelectorAll(".moneyValue")
    .forEach(e => {
      e.textContent = Math.floor(save.money);
    });
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  W = window.innerWidth;
  H = window.innerHeight;

  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  player.y = H * 0.76;

  // Polizei befindet sich beim normalen Spiel immer unterhalb
  // des Spielers bzw. wird dort neu gespawnt.
  police.y = H + police.height / 2;
}

window.addEventListener("resize", resize);

function roadBounds() {
  const roadWidth = Math.min(W * .72, 520);

  return {
    left: (W - roadWidth) / 2,
    right: (W + roadWidth) / 2,
    width: roadWidth
  };
}

function laneX(normalized) {
  const r = roadBounds();

  return r.left + r.width * normalized;
}

function difficulty() {
  return Math.min(
    2.5,
    1 + distance / 5000
  );
}

function startGame() {
  score = 0;
  distance = 0;
  earned = 0;
  lives = 3;

  traffic = [];
  roadScroll = 0;
  spawnTimer = .5;
  invulnerable = 0;

  startRandomSiren();

  policeRespawn = 0;
  policeSpawnProtection = 0;

  player.x = .5;

  police.x = .5;

  // POLIZEI IMMER UNTEN STARTEN
  police.y = H + police.height / 2;

  policeAnimationTime = 0;
  police.active = true;

  paused = false;

  document
    .getElementById("pauseOverlay")
    .classList.remove("visible");

  showScreen("game");

  resize();

  // Nach resize nochmals ganz unten setzen,
  // damit die Position garantiert stimmt.
  police.y = H + police.height / 2;

  lastTime = performance.now();

  cancelAnimationFrame(animationId);

  animationId = requestAnimationFrame(loop);
}

function endGame() {
  state = "gameover";

  clearTimeout(sirenTimer);
  sirenTimer = null;

  siren.pause();
  siren.currentTime = 0;
  sounds.over.currentTime = 0;
  sounds.over.play();

  earned = Math.floor(distance / 100);

  save.money += earned;

  save.highscore = Math.max(
    save.highscore,
    Math.floor(score)
  );

  persist();

  document.getElementById("finalScore").textContent =
    Math.floor(score);

  document.getElementById("finalDistance").textContent =
    (distance / 1000).toFixed(1) + " km";

  document.getElementById("earnedMoney").textContent =
    "$" + earned;

  showScreen("gameover");
}

function spawnTraffic() {
  const d = difficulty();
  const density = densitySettings();

  if (
    traffic.length >=
    Math.floor(density.maxTraffic + d * 1.5)
  ) {
    return;
  }

  const x = .12 + Math.random() * .76;

  const tooClose = traffic.some(v =>
    Math.abs(v.x - x) < .13 &&
    v.y < 180
  );

  if (tooClose) return;

  const file =
    trafficFiles[
      Math.floor(
        Math.random() * trafficFiles.length
      )
    ];

  traffic.push({
    x,
    y: -100 - Math.random() * 220,
    width: 42,
    height: 76,
    speed: 140,
    image: trafficImage(file)
  });
}

function rectsOverlap(a, b) {
  return (
    Math.abs(a.x - b.x) <
      (a.width + b.width) / 2 &&
    Math.abs(a.y - b.y) <
      (a.height + b.height) / 2
  );
}

function objectRect(o) {
  return {
    x: laneX(o.x),
    y: o.y,
    width: o.width,
    height: o.height
  };
}

function handlePlayerCollision() {
  if (invulnerable > 0) return;

  lives--;

  invulnerable = 1.5;

  traffic = traffic.filter(
    v => Math.abs(v.y - player.y) > 100
  );

  if (lives <= 0) {
    endGame();
  }
}

function update(dt) {
  const d = difficulty();

  const selected =
    cars[save.selectedCar];

  const steer =
    (selected.steer || 1) *
    dt *
    .58;

  if (keys.left) {
    player.x -= steer;
  }

  if (keys.right) {
    player.x += steer;
  }

  player.x =
    Math.max(
      .09,
      Math.min(.91, player.x)
    );

  const scrollSpeed =
    390 + d * 55;

  roadScroll =
    (roadScroll + scrollSpeed * dt) % 80;

  distance +=
    scrollSpeed * dt * .20;

  score +=
    dt * (90 + d * 20);

  invulnerable =
    Math.max(
      0,
      invulnerable - dt
    );

  const density =
    densitySettings();

  spawnTimer -= dt;

  if (spawnTimer <= 0) {
    spawnTraffic();

    spawnTimer =
      (
        Math.max(
          .35,
          1.05 - distance / 10000
        ) +
        Math.random() * .35
      ) *
      density.spawnMultiplier;
  }

  for (const v of traffic) {
    v.y += (scrollSpeed - v.speed) * dt;
  }

  traffic = traffic.filter(
    v => v.y < H + 120
  );

  const pRect =
    objectRect({
      ...player,
      x: player.x
    });

  for (const v of traffic) {
    if (
      rectsOverlap(
        pRect,
        objectRect(v)
      )
    ) {
      v.y = H + 300;

      handlePlayerCollision();

      break;
    }
  }

    if (police.active) {

      // Polizei wurde gerade neu gespawnt.
      // Sie bleibt für kurze Zeit tatsächlich unten.
      if (policeSpawnProtection > 0) {

        policeSpawnProtection -= dt;

        // Während des Spawnens NICHT bewegen.
        police.y = H + police.height / 2;
        police.x = Math.max(.1, Math.min(.9, police.x));

      } 
      else {

        policeAnimationTime += dt;

        police.y -= 10 * dt;

        police.x +=
          (player.x - police.x) *
          dt *
          (1.15 + d * .22);

        police.x =
          Math.max(
            .1,
            Math.min(.9, police.x)
          );

        const policeRect = objectRect(police);

        for (const v of traffic) {

          if (rectsOverlap(policeRect, objectRect(v))) {

            v.y = H + 300;

            // POLIZEI KOMPLETT ZURÜCKSETZEN
            police.active = false;

            policeRespawn = 3;

            policeSpawnProtection = 0;

            police.x = .5;
            police.y = H + police.height / 2;

            policeAnimationTime = 0;

            break;
          }
        }

        if (police.active && rectsOverlap(objectRect(police), objectRect(player))) {
          endGame();
        }
      }

    } 
    else {

      policeRespawn -= dt;

      if (policeRespawn <= 0) {

        // =================================
        // KOMPLETTER POLIZEI-RESPAWN
        // =================================

        police.active = true;

        // ALLE POSITIONSDATEN RESETTEN
        police.x = player.x;
        police.y = H + police.height / 2;

        // Animation zurücksetzen
        policeAnimationTime = 0;

        // 1 Sekunde lang wirklich unten bleiben
        policeSpawnProtection = 1.0;

        // X sicher innerhalb der Straße halten
        police.x = Math.max(.1, Math.min(.9, police.x));
      }
    }

  updateHud();
}

function updateHud() {
  const t = translations[currentLanguage];

  document.getElementById("score").textContent =
    Math.floor(score);

  document.getElementById("distance").textContent =
    (distance / 1000).toFixed(1) + " km";

  document.getElementById("lives").textContent =
    "♥ ".repeat(lives).trim() +
    (
      lives < 3
        ? " ♡ ".repeat(3 - lives).trim()
        : ""
    );

  const gap =
    police.active
      ? Math.max(
          0,
          police.y - player.y
        )
      : 999;

  document.getElementById(
    "policeDistance"
  ).textContent =
    !police.active
      ? t.destroyed
      : gap > 105
        ? t.farAway
        : gap > 70
          ? t.comingCloser
          : t.dangerous;
}

function drawRoad() {
  const theme =
    roads[save.selectedRoad];

  const r = roadBounds();

  ctx.fillStyle = theme.sky;

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  ctx.fillStyle =
    theme.grass;

  ctx.fillRect(
    0,
    0,
    r.left,
    H
  );

  ctx.fillRect(
    r.right,
    0,
    W - r.right,
    H
  );

  for (
    let y = -80 + roadScroll;
    y < H + 80;
    y += 105
  ) {
    ctx.fillStyle =
      save.selectedRoad === "desert"
        ? "#d99a55"
        : "#254f3a";

    if (
      save.selectedRoad === "night"
    ) {
      ctx.fillStyle =
        "#f7c948";
    }

    ctx.fillRect(
      r.left - 45,
      y,
      8,
      24
    );

    ctx.fillRect(
      r.right + 37,
      y + 35,
      8,
      24
    );
  }

  ctx.fillStyle =
    theme.road;

  ctx.fillRect(
    r.left,
    0,
    r.width,
    H
  );

  ctx.fillStyle =
    "#d8d8d8";

  ctx.fillRect(
    r.left,
    0,
    6,
    H
  );

  ctx.fillRect(
    r.right - 6,
    0,
    6,
    H
  );

  ctx.fillStyle =
    theme.line;

  const laneWidth =
    r.width / 3;

  for (
    let lane = 1;
    lane < 3;
    lane++
  ) {
    const x =
      r.left +
      laneWidth * lane -
      3;

    for (
      let y = -80 + roadScroll;
      y < H;
      y += 80
    ) {
      ctx.fillRect(
        x,
        y,
        6,
        42
      );
    }
  }

  if (
    save.selectedRoad === "night"
  ) {
    ctx.fillStyle =
      "#ffe28a";

    for (
      let y = -40 + roadScroll;
      y < H;
      y += 130
    ) {
      ctx.beginPath();

      ctx.arc(
        r.left - 20,
        y,
        5,
        0,
        Math.PI * 2
      );

      ctx.arc(
        r.right + 20,
        y + 60,
        5,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }
  }
}

function drawCar(
  o,
  image,
  flashing = false
) {
  const x = laneX(o.x);
  const y = o.y;

  const w = o.width;
  const h = o.height;

  if (
    !image ||
    !image.complete ||
    image.naturalWidth === 0
  ) {
    ctx.fillStyle =
      "#e63946";

    ctx.fillRect(
      x - w / 2,
      y - h / 2,
      w,
      h
    );

    return;
  }

  ctx.save();

  if (
    flashing &&
    Math.floor(
      performance.now() / 100
    ) % 2 === 0
  ) {
    ctx.globalAlpha = .35;
  }

  ctx.imageSmoothingEnabled =
    false;

  ctx.drawImage(
    image,
    Math.round(x - w / 2),
    Math.round(y - h / 2),
    Math.round(w),
    Math.round(h)
  );

  ctx.restore();
}

function roundRect(
  x,
  y,
  w,
  h,
  r
) {
  ctx.beginPath();

  ctx.moveTo(
    x + r,
    y
  );

  ctx.arcTo(
    x + w,
    y,
    x + w,
    y + h,
    r
  );

  ctx.arcTo(
    x + w,
    y + h,
    x,
    y + h,
    r
  );

  ctx.arcTo(
    x,
    y + h,
    x,
    y,
    r
  );

  ctx.arcTo(
    x,
    y,
    x + w,
    y,
    r
  );

  ctx.closePath();
}

function draw() {
  drawRoad();

  for (const v of traffic) {
    drawCar(
      v,
      v.image
    );
  }

  if (police.active) {

    const policeFrame =
      Math.floor(
        policeAnimationTime * 8
      ) %
      policeImages.length;

    drawCar(
      police,
      policeImages[policeFrame]
    );
  }

  const selectedCar =
    cars[save.selectedCar];

  const playerImage =
    driverImage(
      selectedCar.file
    );

  drawCar(
    player,
    playerImage,
    invulnerable > 0
  );

  if (invulnerable > 0) {

    ctx.strokeStyle =
      "#ffffff";

    ctx.lineWidth = 3;

    ctx.globalAlpha = .8;

    ctx.beginPath();

    ctx.arc(
      laneX(player.x),
      player.y,
      43,
      0,
      Math.PI * 2
    );

    ctx.stroke();

    ctx.globalAlpha = 1;
  }
}

function loop(time) {
  if (state !== "game") {
    return;
  }

  const dt =
    Math.min(
      .035,
      (time - lastTime) / 1000
    );

  lastTime = time;

  if (!paused) {
    update(dt);
    draw();
  }

  animationId =
    requestAnimationFrame(loop);
}

function renderCars() {
  const container = document.getElementById("carItems");
  const t = translations[currentLanguage];

  container.innerHTML = "";

  Object.entries(cars).forEach(([id, car]) => {

    const unlocked = save.unlockedCars.includes(id);
    const selected = save.selectedCar === id;

    let text;
    let buttonClass = "";

    if (selected) {
      text = t.selected;
      buttonClass = "secondary";
    } 
    else if (unlocked) {
      text = t.select;
      buttonClass = "secondary";
    } 
    else {
      text = "$" + car.price + " " + t.buy;
    }

    const carName =
      t.carsList[id] || car.name;

    container.innerHTML += `
      <article class="card">

        <div class="preview">
          <img
            class="pixelPreview"
            src="objects/cars/driver/${car.file}"
            alt="${carName}">
        </div>

        <h2>${carName}</h2>

        <p>
          ${
            unlocked
              ? t.unlocked
              : t.price + " $" + car.price
          }
        </p>

        <button
          data-buy-car="${id}"
          class="${buttonClass}">

          ${text}

        </button>

      </article>
    `;
  });
}

function renderRoads() {
  const container = document.getElementById("roadItems");
  const t = translations[currentLanguage];

  container.innerHTML = "";

  Object.entries(roads).forEach(([id, road]) => {

    const unlocked =
      save.unlockedRoads.includes(id);

    const selected =
      save.selectedRoad === id;

    let text;
    let buttonClass = "";

    if (selected) {
      text = t.selected;
      buttonClass = "secondary";
    } 
    else if (unlocked) {
      text = t.select;
      buttonClass = "secondary";
    } 
    else {
      text = "$" + road.price + " " + t.buy;
    }

    const roadName =
      t.roadsList[id] || road.name;

    container.innerHTML += `
      <article class="card">

        <div class="preview">
          🛣️
        </div>

        <h2>${roadName}</h2>

        <p>
          ${
            unlocked
              ? t.unlocked
              : t.price + " $" + road.price
          }
        </p>

        <button
          data-select-road="${id}"
          class="${buttonClass}">

          ${text}

        </button>

      </article>
    `;
  });
}

function renderAll() {
  updateMoney();
  renderCars();
  renderRoads();
}

function buyOrSelectCar(id) {
  const item = cars[id];

  // Bereits gekauft → einfach auswählen
  if (save.unlockedCars.includes(id)) {

    save.selectedCar = id;

    persist();
    renderCars();

    return;
  }

  // Noch nicht gekauft
  if (save.money < item.price) {

    alert(
      translations[currentLanguage].notEnoughMoney
    );

    return;
  }

  // Auto kaufen
  save.money -= item.price;

  save.unlockedCars.push(id);

  // Direkt auswählen
  save.selectedCar = id;

  persist();
  renderAll();
}

function buyOrSelectRoad(id) {
  const item = roads[id];

  if (
    !save.unlockedRoads
      .includes(id)
  ) {

    if (
      save.money <
      item.price
    ) {
      alert(
        translations[currentLanguage].notEnoughMoney
      );

      return;
    }

    save.money -=
      item.price;

    save.unlockedRoads
      .push(id);
  }

  save.selectedRoad =
    id;

  persist();
  renderAll();
}

document.addEventListener(
  "click",
  e => {

    const action =
      e.target.dataset.action;

    if (action === "play") {
      startGame();
    }

    if (action === "menu") {
      showScreen("menu");
    }

    if (action === "cars") {
      renderCars();
      showScreen("cars");
    }

    if (action === "roads") {
      renderRoads();
      showScreen("roads");
    }

    if (action === "resume") {
      paused = false;

      document
        .getElementById(
          "pauseOverlay"
        )
        .classList.remove(
          "visible"
        );
    }

    if (action === "quit") {
      paused = false;
      showScreen("menu");
    }

    if (
      e.target.dataset.buyCar
    ) {
      buyOrSelectCar(
        e.target.dataset.buyCar
      );
    }

    if (
      e.target.dataset.selectCar
    ) {
      const id =
        e.target.dataset.selectCar;

      if (
        save.unlockedCars
          .includes(id)
      ) {
        save.selectedCar =
          id;

        persist();
        renderCars();
      }
    }

    if (
      e.target.dataset.selectRoad
    ) {
      buyOrSelectRoad(
        e.target.dataset.selectRoad
      );
    }
  }
);

document
  .getElementById("pauseBtn")
  .addEventListener(
    "click",
    () => {

      if (state !== "game") {
        return;
      }

      paused = true;

      document
        .getElementById(
          "pauseOverlay"
        )
        .classList.add(
          "visible"
        );
    }
  );

function setControl(
  name,
  value
) {
  keys[name] = value;
}

document
  .querySelectorAll("#touchControls button")
  .forEach(button => {

    const key = button.dataset.key;

    // Verhindert Click-/Touch-Folgereaktionen
    button.addEventListener("pointerdown", e => {

      e.preventDefault();
      e.stopPropagation();

      setControl(key, true);

      button.setPointerCapture?.(e.pointerId);
    });

    button.addEventListener("pointerup", e => {

      e.preventDefault();
      e.stopPropagation();

      setControl(key, false);
    });

    button.addEventListener("pointercancel", e => {

      e.preventDefault();
      e.stopPropagation();

      setControl(key, false);
    });

    button.addEventListener("pointerleave", e => {

      e.preventDefault();
      e.stopPropagation();

      setControl(key, false);
    });

    // Den vom Browser erzeugten Click komplett blockieren
    button.addEventListener("click", e => {

      e.preventDefault();
      e.stopImmediatePropagation();

      return false;
    });
  });


// Falls irgendwo ein globaler Click-Handler existiert,
// werden Touch-Control-Buttons auch dort ignoriert.
document.addEventListener(
  "click",
  e => {

    if (
      e.target.closest("#touchControls")
    ) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }

  },
  true
);




document
  .querySelectorAll("#touchControls button")
  .forEach(button => {

    button.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
    });

  });

window.addEventListener(
  "keydown",
  e => {

    if (
      [
        "ArrowLeft",
        "a",
        "A"
      ].includes(e.key)
    ) {
      keys.left = true;
      e.preventDefault();
    }

    if (
      [
        "ArrowRight",
        "d",
        "D"
      ].includes(e.key)
    ) {
      keys.right = true;
      e.preventDefault();
    }

    if (
      e.key === "Escape" &&
      state === "game"
    ) {
      paused = !paused;

      document
        .getElementById(
          "pauseOverlay"
        )
        .classList.toggle(
          "visible",
          paused
        );
    }
  }
);

window.addEventListener(
  "keyup",
  e => {

    if (
      [
        "ArrowLeft",
        "a",
        "A"
      ].includes(e.key)
    ) {
      keys.left = false;
    }

    if (
      [
        "ArrowRight",
        "d",
        "D"
      ].includes(e.key)
    ) {
      keys.right = false;
    }
  }
);

document.addEventListener(
  "visibilitychange",
  () => {

    if (
      document.hidden &&
      state === "game"
    ) {
      paused = true;

      document
        .getElementById(
          "pauseOverlay"
        )
        .classList.add(
          "visible"
        );
    }
  }
);


const translations = {
  de: {
    subtitle: "Endless Arcade Chase",

    money: "Geld: $",
    traffic: "Verkehrsdichte",
    low: "Wenig Verkehr",
    normal: "Normaler Verkehr",
    high: "Dichter Verkehr",
    language: "Sprache",

    play: "SPIELEN",
    shop: "SHOP",
    cars: "AUTOS",
    roads: "STRASSEN",
    back: "ZURÜCK",

    pause: "PAUSE",
    resume: "WEITER",
    quit: "BEENDEN",

    gameover: "GAME OVER",
    again: "NOCHMAL SPIELEN",
    menu: "HAUPTMENÜ",

    score: "Score:",
    distance: "Distanz:",
    lives: "Leben:",
    police: "POLIZEI:",
    farAway: "weit entfernt",
    comingCloser: "kommt näher",
    dangerous: "GEFÄHRLICH NAH",
    destroyed: "zerstört",
    driven: "Gefahrene Strecke:",
    earned: "Verdient:",

    unlocked: "Freigeschaltet",
    select: "AUSWÄHLEN",
    selected: "AUSGEWÄHLT",
    buy: "KAUFEN",

    notEnoughMoney: "Du hast nicht genug Geld.",

    carsList: {
      starter: "Standardauto",
      retro: "Retroauto",
      sport: "Sportwagen",
      muscle: "Muscle Car",
      f1: "F1-Auto"
    },

    roadsList: {
      city: "Stadt",
      highway: "Autobahn",
      desert: "Wüste",
      night: "Nacht",
      snow: "Schnee"
    },

    price: "Preis:",
    livesLabel: "Leben:",
    policeLabel: "POLIZEI:",
    driven: "Gefahrene Strecke:",
    earned: "Verdient:",

  },

  en: {
    price: "Price:",
    livesLabel: "Lives:",
    policeLabel: "POLICE:",
    driven: "Distance driven:",
    earned: "Earned:",
    subtitle: "Endless Arcade Chase",

    money: "Money: $",
    traffic: "Traffic Density",
    low: "Low Traffic",
    normal: "Normal Traffic",
    high: "Heavy Traffic",
    language: "Language",

    play: "PLAY",
    shop: "SHOP",
    cars: "CARS",
    roads: "ROADS",
    back: "BACK",

    pause: "PAUSE",
    resume: "RESUME",
    quit: "QUIT",

    gameover: "GAME OVER",
    again: "PLAY AGAIN",
    menu: "MAIN MENU",

    score: "Score:",
    distance: "Distance:",
    lives: "Lives:",
    police: "POLICE:",
    farAway: "far away",
    comingCloser: "coming closer",
    dangerous: "DANGEROUSLY CLOSE",
    destroyed: "destroyed",
    driven: "Distance driven:",
    earned: "Earned:",

    unlocked: "Unlocked",
    select: "SELECT",
    selected: "SELECTED",
    buy: "BUY",

    notEnoughMoney: "You don't have enough money.",

    carsList: {
      starter: "Standard Car",
      retro: "Retro Car",
      sport: "Sports Car",
      muscle: "Muscle Car",
      f1: "F1 Car"
    },

    roadsList: {
      city: "City",
      highway: "Highway",
      desert: "Desert",
      night: "Night",
      snow: "Snow"
    }
  },

  es: {
    price: "Precio:",
    livesLabel: "Vidas:",
    policeLabel: "POLICÍA:",
    driven: "Distancia recorrida:",
    earned: "Ganado:",

    subtitle: "Persecución Arcade Infinita",

    money: "Dinero: $",
    traffic: "Densidad del tráfico",
    low: "Poco tráfico",
    normal: "Tráfico normal",
    high: "Mucho tráfico",
    language: "Idioma",

    play: "JUGAR",
    shop: "TIENDA",
    cars: "COCHES",
    roads: "CARRETERAS",
    back: "VOLVER",

    pause: "PAUSA",
    resume: "CONTINUAR",
    quit: "SALIR",

    gameover: "GAME OVER",
    again: "JUGAR DE NUEVO",
    menu: "MENÚ PRINCIPAL",

    score: "Puntuación:",
    distance: "Distancia:",
    lives: "Vidas:",
    police: "POLICÍA:",
    farAway: "lejos",
    comingCloser: "se acerca",
    dangerous: "MUY CERCA",
    destroyed: "destruido",
    driven: "Distancia recorrida:",
    earned: "Ganado:",

    unlocked: "Desbloqueado",
    select: "SELECCIONAR",
    selected: "SELECCIONADO",
    buy: "COMPRAR",

    notEnoughMoney: "No tienes suficiente dinero.",

    carsList: {
      starter: "Coche estándar",
      retro: "Coche retro",
      sport: "Coche deportivo",
      muscle: "Muscle Car",
      f1: "Coche de F1"
    },

    roadsList: {
      city: "Ciudad",
      highway: "Autopista",
      desert: "Desierto",
      night: "Noche",
      snow: "Nieve"
    }
  }
};


let currentLanguage = localStorage.getItem("policeEscapeLanguage") || "en";

function applyLanguage() {
  const t = translations[currentLanguage];

  // =========================
  // HAUPTMENÜ
  // =========================

  document.querySelector(".subtitle").textContent =
    t.subtitle;

  document.querySelector("#menu .money").innerHTML =
    `${t.money}<span class="moneyValue">0</span>`;

  document.querySelector(
    'label[for="densitySelect"]'
  ).textContent = t.traffic;

  document.querySelector(
    'label[for="languageSelect"]'
  ).textContent = t.language;

  document.querySelector(
    '#densitySelect option[value="low"]'
  ).textContent = t.low;

  document.querySelector(
    '#densitySelect option[value="normal"]'
  ).textContent = t.normal;

  document.querySelector(
    '#densitySelect option[value="high"]'
  ).textContent = t.high;


  // =========================
  // SHOP / AUTOS / STRASSEN
  // =========================

  document.querySelectorAll("[data-action]")
    .forEach(button => {

      const action = button.dataset.action;

      if (action === "play") {
        button.textContent = t.play;
      }

      if (action === "shop") {
        button.textContent = t.shop;
      }

      if (action === "cars") {
        button.textContent = t.cars;
      }

      if (action === "roads") {
        button.textContent = t.roads;
      }

      if (action === "menu") {
        button.textContent = t.menu;
      }

      if (action === "resume") {
        button.textContent = t.resume;
      }

      if (action === "quit") {
        button.textContent = t.quit;
      }
    });


  // =========================
  // HUD
  // =========================

  document.getElementById("scoreLabel").textContent =
    t.score;

  document.getElementById("distanceLabel").textContent =
    t.distance;

  document.getElementById("livesLabel").textContent =
    t.lives;

  document.getElementById("policeLabel").textContent =
    t.police;


  // =========================
  // GAME OVER
  // =========================

  document.getElementById("gameoverTitle").textContent =
    t.gameover;

  document.getElementById("finalScoreLabel").textContent =
    t.score;

  document.getElementById("drivenLabel").textContent =
    t.driven;

  document.getElementById("earnedLabel").textContent =
    t.earned;


  // =========================
  // SPRACHE
  // =========================

  document.getElementById("languageSelect").value =
    currentLanguage;


  // =========================
  // SHOP AKTUALISIEREN
  // =========================

  renderCars();
  renderRoads();

  updateMoney();
  updateHud();
}

document
  .getElementById("languageSelect")
  .addEventListener("change", function () {

    currentLanguage = this.value;

    localStorage.setItem(
      "policeEscapeLanguage",
      currentLanguage
    );

    applyLanguage();
  });

applyLanguage();





renderAll();
showScreen("menu");