"use strict";

/* =========================================================
   POLICE ESCAPE
   UPDATE
   - Nitro
   - Coins
   - Near Miss
   - bessere Effekte
   - Highscore
   - Mobile Boost
   ========================================================= */


/* =========================================================
   AUDIO
   ========================================================= */

const music = new Audio("./sounds/loop.mp3");

music.loop = true;
music.volume = 0.8;

const sounds = {
  click: new Audio("./sounds/click.mp3"),
  over: new Audio("./sounds/over.mp3"),
  nitro: new Audio("./sounds/nitro.mp3"),
  coin: new Audio("./sounds/coin.mp3"),
  crash: new Audio("./sounds/crash.mp3")
};

const siren = new Audio("./sounds/siren.mp3");

siren.volume = 0.6;

function playSound(sound) {
  if (!sound) {
    return;
  }

  sound.currentTime = 0;

  sound.play().catch(() => {});
}

function startMusic() {
  if (music.paused) {
    music.play().catch(() => {});
  }
}

window.addEventListener(
  "load",
  () => {
    startMusic();
  }
);

document.addEventListener(
  "pointerdown",
  startMusic,
  {
    once: true
  }
);


/* =========================================================
   CANVAS
   ========================================================= */

const canvas =
  document.getElementById("canvas");

const ctx =
  canvas.getContext("2d");


/* =========================================================
   SAVEGAME
   ========================================================= */

const defaultSave = {

  money: 0,

  unlockedCars: [
    "starter"
  ],

  selectedCar: "starter",

  unlockedRoads: [
    "city"
  ],

  selectedRoad: "city",

  highscore: 0,

  trafficDensity: "normal"

};

let save;

try {

  save =
    JSON.parse(
      localStorage.getItem(
        "policeEscapeSave"
      ) || "null"
    ) ||
    {
      ...defaultSave
    };

} catch (error) {

  save = {
    ...defaultSave
  };

}


save.money =
  Number(save.money) || 0;

save.unlockedCars =
  Array.isArray(
    save.unlockedCars
  )
    ? save.unlockedCars
    : ["starter"];

save.unlockedRoads =
  Array.isArray(
    save.unlockedRoads
  )
    ? save.unlockedRoads
    : ["city"];

save.selectedCar =
  save.selectedCar || "starter";

save.selectedRoad =
  save.selectedRoad || "city";

save.highscore =
  Number(save.highscore) || 0;

save.trafficDensity =
  save.trafficDensity || "normal";


function persist() {

  localStorage.setItem(
    "policeEscapeSave",
    JSON.stringify(save)
  );

}


/* =========================================================
   CAR DATA
   ========================================================= */

const cars = {

  starter: {
    name: "Standard Car",
    file: "standart_car.png",
    price: 0,
    steer: 1,
    nitro: 1
  },

  retro: {
    name: "Retro Car",
    file: "retro_car.png",
    price: 350,
    steer: 1.05,
    nitro: 1.05
  },

  sport: {
    name: "Sportwagen",
    file: "sport_car.png",
    price: 700,
    steer: 1.2,
    nitro: 1.2
  },

  muscle: {
    name: "Muscle Car",
    file: "muscle_car.png",
    price: 1000,
    steer: .95,
    nitro: 1.3
  },

  f1: {
    name: "F1 Car",
    file: "f1_car.png",
    price: 1600,
    steer: 1.35,
    nitro: 1.4
  }

};


/* =========================================================
   TRAFFIC
   ========================================================= */

const trafficFiles = [

  "car_01.png",
  "car_02.png",
  "car_03.png",
  "car_04.png",
  "car_05.png",
  "car_06.png",
  "car_07.png"

];


/* =========================================================
   IMAGES
   ========================================================= */

const imageCache = {};

function loadImage(path) {

  if (!imageCache[path]) {

    const image =
      new Image();

    image.src = path;

    imageCache[path] =
      image;

  }

  return imageCache[path];
}


function driverImage(file) {

  return loadImage(
    "objects/cars/driver/" +
    file
  );

}


function trafficImage(file) {

  return loadImage(
    "objects/cars/trafic/" +
    file
  );

}


const policeImages = [

  loadImage(
    "objects/cars/police/police_1.png"
  ),

  loadImage(
    "objects/cars/police/police_2.png"
  )

];


const coinImage =
  loadImage(
    "objects/coin.png"
  );


let policeAnimationTime = 0;


/* =========================================================
   ROADS
   ========================================================= */

const roads = {

  city: {
    name: "City",
    file: "city.png",
    price: 0,
    sky: "#162536",
    grass: "#173b31",
    road: "#303944",
    line: "#f4f1de"
  },

  highway: {
    name: "Highway",
    file: "highway.png",
    price: 500,
    sky: "#477ca2",
    grass: "#28613d",
    road: "#34383e",
    line: "#f8f2bd"
  },

  desert: {
    name: "Desert",
    file: "desert.png",
    price: 800,
    sky: "#d58d50",
    grass: "#b87542",
    road: "#4b4544",
    line: "#ffe6a7"
  },

  night: {
    name: "Night",
    file: "night.png",
    price: 1000,
    sky: "#080d25",
    grass: "#101b25",
    road: "#202732",
    line: "#b5d7ff"
  },

  snow: {
    name: "Snow",
    file: "snow.png",
    price: 1400,
    sky: "#b7d2e0",
    grass: "#d8edf0",
    road: "#626b76",
    line: "#ffffff"
  }

};


/* =========================================================
   SETTINGS
   ========================================================= */

const densitySelect =
  document.getElementById(
    "densitySelect"
  );

if (densitySelect) {

  densitySelect.value =
    save.trafficDensity;

  densitySelect.addEventListener(
    "change",
    () => {

      save.trafficDensity =
        densitySelect.value;

      persist();

    }
  );

}


/* =========================================================
   GAME STATE
   ========================================================= */

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

let coins = [];

let particles = [];

let nearMissCooldown = 0;

let nitro = 40;

let nitroActive = false;

let nitroTime = 0;

let shake = 0;


const keys = {

  left: false,

  right: false,

  boost: false

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


/* =========================================================
   NITRO
   ========================================================= */

const MAX_NITRO = 100;

const NITRO_DRAIN =
  32;

const NITRO_RECHARGE =
  0;

const NITRO_SPEED =
  220;

const COIN_NITRO_REWARD =
  20;


/* =========================================================
   SIREN
   ========================================================= */

let sirenTimer = null;

function startRandomSiren() {

  clearTimeout(
    sirenTimer
  );

  const delay =
    5000 +
    Math.random() *
    10000;

  sirenTimer =
    setTimeout(
      () => {

        if (
          state === "game" &&
          !paused
        ) {

          siren.currentTime = 0;

          siren.play()
            .catch(
              () => {}
            );

        }

        if (
          state === "game"
        ) {

          startRandomSiren();

        }

      },
      delay
    );

}


/* =========================================================
   BUTTON SOUNDS
   ========================================================= */

document
  .querySelectorAll(
    "button"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          playSound(
            sounds.click
          );

        }
      );

    }
  );


/* =========================================================
   SCREEN MANAGEMENT
   ========================================================= */

function showScreen(name) {

  document
    .querySelectorAll(
      ".screen"
    )
    .forEach(
      screen => {

        screen.classList.remove(
          "active"
        );

      }
    );

  const target =
    document.getElementById(
      name
    );

  if (target) {

    target.classList.add(
      "active"
    );

  }

  state = name;

  updateMoney();

}


/* =========================================================
   MONEY
   ========================================================= */

function updateMoney() {

  document
    .querySelectorAll(
      ".moneyValue"
    )
    .forEach(
      element => {

        element.textContent =
          Math.floor(
            save.money
          );

      }
    );

  const menuHighscore =
    document.getElementById(
      "menuHighscore"
    );

  if (menuHighscore) {

    menuHighscore.textContent =
      Math.floor(
        save.highscore
      );

  }

}


/* =========================================================
   DENSITY
   ========================================================= */

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

  }[
    save.trafficDensity
  ] || {

    maxTraffic: 7,

    spawnMultiplier: 1

  };

}


/* =========================================================
   RESIZE
   ========================================================= */

function resize() {

  const dpr =
    Math.min(
      window.devicePixelRatio || 1,
      2
    );

  W =
    window.innerWidth;

  H =
    window.innerHeight;

  canvas.width =
    Math.floor(
      W * dpr
    );

  canvas.height =
    Math.floor(
      H * dpr
    );

  canvas.style.width =
    W + "px";

  canvas.style.height =
    H + "px";

  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );

  player.y =
    H * .76;

  if (
    !police.active ||
    police.y > H
  ) {

    police.y =
      H +
      police.height / 2;

  }

}

window.addEventListener(
  "resize",
  resize
);


/* =========================================================
   ROAD
   ========================================================= */

function roadBounds() {

  const roadWidth =
    Math.min(
      W * .72,
      520
    );

  return {

    left:
      (W - roadWidth) / 2,

    right:
      (W + roadWidth) / 2,

    width:
      roadWidth

  };

}


function laneX(normalized) {

  const r =
    roadBounds();

  return (
    r.left +
    r.width *
    normalized
  );

}


/* =========================================================
   DIFFICULTY
   ========================================================= */

function difficulty() {

  return Math.min(
    2.5,
    1 +
    distance / 5000
  );

}


/* =========================================================
   START GAME
   ========================================================= */

function startGame() {

  score = 0;

  distance = 0;

  earned = 0;

  lives = 3;

  nitro = MAX_NITRO;

  nitroActive = false;

  nitroTime = 0;

  traffic = [];

  coins = [];

  particles = [];

  roadScroll = 0;

  spawnTimer = .5;

  invulnerable = 0;

  nearMissCooldown = 0;

  shake = 0;

  startRandomSiren();

  policeRespawn = 0;

  policeSpawnProtection = 0;

  player.x = .5;

  police.x = .5;

  police.y =
    H +
    police.height / 2;

  policeAnimationTime = 0;

  police.active = true;

  paused = false;

  document
    .getElementById(
      "pauseOverlay"
    )
    .classList.remove(
      "visible"
    );

  showScreen("game");

  resize();

  police.y =
    H +
    police.height / 2;

  lastTime =
    performance.now();

  cancelAnimationFrame(
    animationId
  );

  animationId =
    requestAnimationFrame(
      loop
    );

}


/* =========================================================
   END GAME
   ========================================================= */

function endGame() {

  if (
    state === "gameover"
  ) {
    return;
  }

  state = "gameover";

  clearTimeout(
    sirenTimer
  );

  sirenTimer = null;

  siren.pause();

  siren.currentTime = 0;

  playSound(
    sounds.over
  );

  earned =
    Math.floor(
      distance / 100
    );

  save.money +=
    earned;

  const finalScore =
    Math.floor(
      score
    );

  const oldHighscore =
    save.highscore;

  save.highscore =
    Math.max(
      save.highscore,
      finalScore
    );

  persist();

  document.getElementById(
    "finalScore"
  ).textContent =
    finalScore;

  document.getElementById(
    "finalDistance"
  ).textContent =
    (
      distance / 1000
    ).toFixed(1) +
    " km";

  document.getElementById(
    "earnedMoney"
  ).textContent =
    "$" +
    earned;

  document.getElementById(
    "finalHighscore"
  ).textContent =
    Math.floor(
      save.highscore
    );

  showScreen(
    "gameover"
  );

  if (
    finalScore >
    oldHighscore
  ) {

    createBurst(
      W / 2,
      H / 2,
      25
    );

  }

}


/* =========================================================
   SPAWN TRAFFIC
   ========================================================= */

function spawnTraffic() {

  const d =
    difficulty();

  const density =
    densitySettings();

  if (
    traffic.length >=
    Math.floor(
      density.maxTraffic +
      d * 1.5
    )
  ) {

    return;

  }

  const x =
    .12 +
    Math.random() *
    .76;

  const tooClose =
    traffic.some(
      v =>
        Math.abs(
          v.x - x
        ) < .13 &&
        v.y < 180
    );

  if (tooClose) {

    return;

  }

  const file =
    trafficFiles[
      Math.floor(
        Math.random() *
        trafficFiles.length
      )
    ];

  traffic.push({

    x,

    y:
      -100 -
      Math.random() *
      220,

    width: 42,

    height: 76,

    speed:
      140 +
      Math.random() *
      50,

    image:
      trafficImage(
        file
      ),

    passed: false

  });

}


/* =========================================================
   SPAWN COINS
   ========================================================= */

function spawnCoin() {

  if (
    coins.length >= 2
  ) {
    return;
  }

  const x =
    .15 +
    Math.random() *
    .70;

  coins.push({

    x,

    y:
      -50 -
      Math.random() *
      300,

    width: 30,

    height: 30,

    rotation:
      Math.random() *
      Math.PI * 2

  });

}


/* =========================================================
   RECT COLLISION
   ========================================================= */

function rectsOverlap(
  a,
  b
) {

  return (

    Math.abs(
      a.x - b.x
    ) <
      (
        a.width +
        b.width
      ) / 2

    &&

    Math.abs(
      a.y - b.y
    ) <
      (
        a.height +
        b.height
      ) / 2

  );

}


function objectRect(o) {

  return {

    x:
      laneX(o.x),

    y:
      o.y,

    width:
      o.width,

    height:
      o.height

  };

}


/* =========================================================
   PARTICLES
   ========================================================= */

function createParticle(
  x,
  y,
  options = {}
) {

  particles.push({

    x,

    y,

    vx:
      options.vx ??
      (
        Math.random() -
        .5
      ) * 80,

    vy:
      options.vy ??
      (
        Math.random() -
        .5
      ) * 80,

    life:
      options.life ??
      .5,

    maxLife:
      options.life ??
      .5,

    size:
      options.size ??
      4,

    type:
      options.type ??
      "normal"

  });

}


function createBurst(
  x,
  y,
  amount = 12
) {

  for (
    let i = 0;
    i < amount;
    i++
  ) {

    createParticle(
      x,
      y,
      {
        vx:
          (
            Math.random() -
            .5
          ) * 250,

        vy:
          (
            Math.random() -
            .5
          ) * 250,

        life:
          .4 +
          Math.random() * .6,

        size:
          2 +
          Math.random() * 4,

        type:
          "burst"

      }
    );

  }

}


function updateParticles(dt) {

  for (
    const particle
    of particles
  ) {

    particle.x +=
      particle.vx *
      dt;

    particle.y +=
      particle.vy *
      dt;

    particle.life -=
      dt;

    particle.vy +=
      100 * dt;

  }

  particles =
    particles.filter(
      p =>
        p.life > 0
    );

}


/* =========================================================
   PLAYER COLLISION
   ========================================================= */

function handlePlayerCollision() {

  if (
    invulnerable > 0
  ) {

    return;

  }

  lives--;

  invulnerable =
    1.5;

  shake = .35;

  playSound(
    sounds.crash
  );

  createBurst(
    laneX(player.x),
    player.y,
    20
  );

  traffic =
    traffic.filter(
      v =>
        Math.abs(
          v.y -
          player.y
        ) > 100
    );

  if (
    lives <= 0
  ) {

    endGame();

  }

}


/* =========================================================
   NEAR MISS
   ========================================================= */

function checkNearMiss(
  vehicle
) {

  if (
    nearMissCooldown > 0
  ) {

    return;

  }

  const dx =
    Math.abs(
      laneX(vehicle.x) -
      laneX(player.x)
    );

  const dy =
    Math.abs(
      vehicle.y -
      player.y
    );

  if (
    dy < 75 &&
    dy > 30 &&
    dx < 65 &&
    dx > 25 &&
    !vehicle.nearMiss
  ) {

    vehicle.nearMiss =
      true;

    score += 75;

    nearMissCooldown =
      .15;

    createBurst(
      laneX(player.x),
      player.y,
      8
    );

  }

}


/* =========================================================
   BOOST
   ========================================================= */

function updateNitro(
  dt
) {

  const selected =
    cars[
      save.selectedCar
    ] || cars.starter;

  if (
    keys.boost &&
    nitro > 0 &&
    !paused
  ) {

    if (
      !nitroActive
    ) {

      nitroActive =
        true;

      nitroTime = 0;

      playSound(
        sounds.nitro
      );

    }

    nitro -=
      NITRO_DRAIN *
      dt *
      (1 /
        (
          selected.nitro ||
          1
        ));

    nitro =
      Math.max(
        0,
        nitro
      );

  } else {

    nitroActive =
      false;

    nitro +=
      NITRO_RECHARGE *
      dt;

    nitro =
      Math.min(
        MAX_NITRO,
        nitro
      );

  }

  if (
    nitro <= 0
  ) {

    nitroActive =
      false;

  }

  nitroTime +=
    dt;

}


/* =========================================================
   MAIN UPDATE
   ========================================================= */

function update(dt) {

  const d =
    difficulty();

  const selected =
    cars[
      save.selectedCar
    ] || cars.starter;


  /* -------------------------
     STEERING
     ------------------------- */

  const steer =
    (
      selected.steer ||
      1
    ) *
    dt *
    .58;

  if (
    keys.left
  ) {

    player.x -=
      steer;

  }

  if (
    keys.right
  ) {

    player.x +=
      steer;

  }

  player.x =
    Math.max(
      .09,
      Math.min(
        .91,
        player.x
      )
    );


  /* -------------------------
     SPEED
     ------------------------- */

  let scrollSpeed =
    390 +
    d * 55;

  if (
    nitroActive
  ) {

    scrollSpeed +=
      NITRO_SPEED;

  }


  /* -------------------------
     ROAD
     ------------------------- */

  roadScroll =
    (
      roadScroll +
      scrollSpeed *
      dt
    ) % 80;


  /* -------------------------
     DISTANCE
     ------------------------- */

  distance +=
    scrollSpeed *
    dt *
    .20;


  /* -------------------------
     SCORE
     ------------------------- */

  score +=
    dt *
    (
      90 +
      d * 20 +
      (
        nitroActive
          ? 60
          : 0
      )
    );


  /* -------------------------
     DAMAGE
     ------------------------- */

  invulnerable =
    Math.max(
      0,
      invulnerable -
      dt
    );


  /* -------------------------
     NEAR MISS
     ------------------------- */

  nearMissCooldown =
    Math.max(
      0,
      nearMissCooldown -
      dt
    );


  /* -------------------------
     SHAKE
     ------------------------- */

  shake =
    Math.max(
      0,
      shake -
      dt
    );


  /* -------------------------
     NITRO
     ------------------------- */

  updateNitro(
    dt
  );


  /* -------------------------
     TRAFFIC SPAWN
     ------------------------- */

  const density =
    densitySettings();

  spawnTimer -=
    dt;

  if (
    spawnTimer <= 0
  ) {

    spawnTraffic();

    spawnTimer =
      (
        Math.max(
          .35,
          1.05 -
          distance /
          10000
        ) +
        Math.random() *
        .35
      ) *
      density.spawnMultiplier;

  }


  /* -------------------------
     COIN SPAWN
     ------------------------- */

  if (
    Math.random() <
    dt *
    .12
  ) {

    spawnCoin();

  }


  /* -------------------------
     TRAFFIC UPDATE
     ------------------------- */

  for (
    const vehicle
    of traffic
  ) {

    vehicle.y +=
      (
        scrollSpeed -
        vehicle.speed
      ) *
      dt;

    if (
      vehicle.y >
      player.y + 100 &&
      !vehicle.passed
    ) {

      vehicle.passed =
        true;

      score += 10;

    }

    if (
      vehicle.y >
      player.y - 100 &&
      vehicle.y <
      player.y + 100
    ) {

      checkNearMiss(
        vehicle
      );

    }

  }


  traffic =
    traffic.filter(
      vehicle =>
        vehicle.y <
        H + 120
    );


  /* -------------------------
     COINS UPDATE
     ------------------------- */

  for (
    const coin
    of coins
  ) {

    coin.y +=
      scrollSpeed *
      dt;

    coin.rotation +=
      dt * 6;

  }


  /* -------------------------
     COIN COLLISION
     ------------------------- */

  const playerRect =
    objectRect(
      player
    );

  for (
    const coin
    of coins
  ) {

    if (
      rectsOverlap(
        playerRect,
        objectRect(
          coin
        )
      )
    ) {

      coin.collected =
        true;

      save.money += 5;

      earned += 5;

      score += 100;

      /*
      * Jede eingesammelte Münze füllt 20 Nitro auf.
      * Niemals über 100.
      */
      nitro = Math.min(
        MAX_NITRO,
        nitro + COIN_NITRO_REWARD
      );

      playSound(
        sounds.coin
      );

      createBurst(
        laneX(coin.x),
        coin.y,
        10
      );

    }

  }

  coins =
    coins.filter(
      coin =>
        !coin.collected &&
        coin.y <
        H + 80
    );


  /* -------------------------
     TRAFFIC COLLISION
     ------------------------- */

  for (
    const vehicle
    of traffic
  ) {

    if (
      rectsOverlap(
        playerRect,
        objectRect(
          vehicle
        )
      )
    ) {

      vehicle.y =
        H + 300;

      handlePlayerCollision();

      break;

    }

  }


  /* =====================================================
     POLICE
     ===================================================== */

  if (
    police.active
  ) {

    if (
      policeSpawnProtection >
      0
    ) {

      policeSpawnProtection -=
        dt;

      police.y =
        H +
        police.height / 2;

      police.x =
        Math.max(
          .1,
          Math.min(
            .9,
            police.x
          )
        );

    } else {

      policeAnimationTime +=
        dt;

      police.y -=
        10 *
        dt;

      police.x +=
        (
          player.x -
          police.x
        ) *
        dt *
        (
          1.15 +
          d * .22
        );

      police.x =
        Math.max(
          .1,
          Math.min(
            .9,
            police.x
          )
        );


      const policeRect =
        objectRect(
          police
        );


      /* -------------------------
         POLICE VS TRAFFIC
         ------------------------- */

      for (
        const vehicle
        of traffic
      ) {

        if (
          rectsOverlap(
            policeRect,
            objectRect(
              vehicle
            )
          )
        ) {

          vehicle.y =
            H + 300;

          police.active =
            false;

          policeRespawn =
            3;

          policeSpawnProtection =
            0;

          police.x = .5;

          police.y =
            H +
            police.height / 2;

          policeAnimationTime =
            0;

          score += 150;

          createBurst(
            laneX(
              police.x
            ),
            police.y,
            15
          );

          break;

        }

      }


      /* -------------------------
         POLICE VS PLAYER
         ------------------------- */

      if (
        police.active &&
        rectsOverlap(
          objectRect(
            police
          ),
          objectRect(
            player
          )
        )
      ) {

        endGame();

      }

    }

  } else {

    policeRespawn -=
      dt;

    if (
      policeRespawn <= 0
    ) {

      police.active =
        true;

      police.x =
        player.x;

      police.y =
        H +
        police.height / 2;

      policeAnimationTime =
        0;

      policeSpawnProtection =
        1.0;

      police.x =
        Math.max(
          .1,
          Math.min(
            .9,
            police.x
          )
        );

    }

  }


  updateParticles(
    dt
  );

  updateHud();

}


/* =========================================================
   HUD
   ========================================================= */

function updateHud() {

  const t =
    translations[
      currentLanguage
    ];


  document.getElementById(
    "score"
  ).textContent =
    Math.floor(
      score
    );


  document.getElementById(
    "distance"
  ).textContent =
    (
      distance / 1000
    ).toFixed(1) +
    " km";


  document.getElementById(
    "lives"
  ).textContent =
    "♥ ".repeat(
      lives
    ).trim() +
    (
      lives < 3
        ? " ♡ ".repeat(
            3 - lives
          ).trim()
        : ""
    );


  const gap =
    police.active
      ? Math.max(
          0,
          police.y -
          player.y
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


  /* -------------------------
     NITRO HUD
     ------------------------- */

  const nitroPercent =
    Math.floor(
      nitro
    );

  document.getElementById(
    "nitroPercent"
  ).textContent =
    nitroPercent +
    "%";


  document.getElementById(
    "nitroFill"
  ).style.width =
    nitroPercent +
    "%";


  const nitroHud =
    document.getElementById(
      "nitroHud"
    );

  if (
    nitroActive
  ) {

    nitroHud.classList.add(
      "nitroActive"
    );

  } else {

    nitroHud.classList.remove(
      "nitroActive"
    );

  }

}


/* =========================================================
   DRAW ROAD
   ========================================================= */

function drawRoad() {

  const theme =
    roads[
      save.selectedRoad
    ];

  const r =
    roadBounds();


  ctx.fillStyle =
    theme.sky;

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
    let y =
      -80 +
      roadScroll;

    y <
      H + 80;

    y += 105
  ) {

    ctx.fillStyle =
      save.selectedRoad ===
      "desert"

        ? "#d99a55"

        : "#254f3a";


    if (
      save.selectedRoad ===
      "night"
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
      laneWidth *
      lane -
      3;


    for (
      let y =
        -80 +
        roadScroll;

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
    save.selectedRoad ===
    "night"
  ) {

    ctx.fillStyle =
      "#ffe28a";


    for (
      let y =
        -40 +
        roadScroll;

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


/* =========================================================
   DRAW CAR
   ========================================================= */

function drawCar(
  o,
  image,
  flashing = false
) {

  const x =
    laneX(
      o.x
    );

  const y =
    o.y;

  const w =
    o.width;

  const h =
    o.height;


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
      performance.now() /
      100
    ) % 2 === 0
  ) {

    ctx.globalAlpha =
      .35;

  }


  ctx.imageSmoothingEnabled =
    false;


  ctx.drawImage(
    image,
    Math.round(
      x - w / 2
    ),
    Math.round(
      y - h / 2
    ),
    Math.round(w),
    Math.round(h)
  );


  ctx.restore();

}


/* =========================================================
   DRAW COIN
   ========================================================= */

function drawCoin(
  coin
) {

  const x =
    laneX(
      coin.x
    );

  const y =
    coin.y;


  /*
   * Blaue Münze.
   *
   * Sie wird direkt mit Canvas gezeichnet,
   * damit sie garantiert blau ist – unabhängig
   * davon, welche Farbe objects/coin.png hat.
   */

  ctx.save();

  ctx.translate(
    x,
    y
  );

  ctx.rotate(
    Math.sin(
      coin.rotation
    ) * .3
  );


  /*
   * Blauer Glow
   */

  ctx.shadowColor =
    "#2196ff";

  ctx.shadowBlur =
    12;


  /*
   * Münzkörper
   */

  ctx.fillStyle =
    "#1687ff";

  ctx.beginPath();

  ctx.arc(
    0,
    0,
    14,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /*
   * Heller Rand
   */

  ctx.shadowBlur =
    0;

  ctx.strokeStyle =
    "#8fd0ff";

  ctx.lineWidth =
    3;

  ctx.stroke();


  /*
   * Innerer Rand
   */

  ctx.strokeStyle =
    "#075bb5";

  ctx.lineWidth =
    2;

  ctx.beginPath();

  ctx.arc(
    0,
    0,
    9,
    0,
    Math.PI * 2
  );

  ctx.stroke();


  /*
   * Dollar-Zeichen
   */

  ctx.fillStyle =
    "#ffffff";

  ctx.font =
    "bold 14px monospace";

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  ctx.fillText(
    "$",
    0,
    1
  );


  ctx.restore();

}


/* =========================================================
   DRAW PARTICLES
   ========================================================= */

function drawParticles() {

  for (
    const particle
    of particles
  ) {

    const alpha =
      Math.max(
        0,
        particle.life /
        particle.maxLife
      );

    ctx.save();

    ctx.globalAlpha =
      alpha;

    ctx.fillStyle =
      particle.type ===
      "burst"

        ? "#ffd166"

        : "#ffffff";

    ctx.fillRect(
      particle.x,
      particle.y,
      particle.size,
      particle.size
    );

    ctx.restore();

  }

}


/* =========================================================
   NITRO FLAMES
   ========================================================= */

function drawNitroEffect() {

  if (
    !nitroActive
  ) {

    return;

  }


  const x =
    laneX(
      player.x
    );

  const y =
    player.y +
    player.height / 2 +
    5;


  ctx.save();

  ctx.globalAlpha =
    .8;


  for (
    let i = 0;
    i < 3;
    i++
  ) {

    const width =
      8 +
      Math.random() *
      7;

    const height =
      20 +
      Math.random() *
      25;


    ctx.fillStyle =
      i === 0
        ? "#fff"
        : i === 1
          ? "#67e8f9"
          : "#38bdf8";


    ctx.beginPath();

    ctx.moveTo(
      x - width / 2,
      y
    );

    ctx.lineTo(
      x,
      y + height
    );

    ctx.lineTo(
      x + width / 2,
      y
    );

    ctx.closePath();

    ctx.fill();

  }

  ctx.restore();

}


/* =========================================================
   DRAW
   ========================================================= */

function draw() {

  ctx.save();


  if (
    shake > 0
  ) {

    ctx.translate(
      (
        Math.random() -
        .5
      ) *
      10,

      (
        Math.random() -
        .5
      ) *
      10
    );

  }


  drawRoad();


  /* Coins */

  for (
    const coin
    of coins
  ) {

    drawCoin(
      coin
    );

  }


  /* Traffic */

  for (
    const vehicle
    of traffic
  ) {

    drawCar(
      vehicle,
      vehicle.image
    );

  }


  /* Police */

  if (
    police.active
  ) {

    const policeFrame =
      Math.floor(
        policeAnimationTime *
        8
      ) %
      policeImages.length;


    drawCar(
      police,
      policeImages[
        policeFrame
      ]
    );

  }


  /* Player */

  const selectedCar =
    cars[
      save.selectedCar
    ];


  const playerImage =
    driverImage(
      selectedCar.file
    );


  drawNitroEffect();


  drawCar(
    player,
    playerImage,
    invulnerable > 0
  );


  /* Invulnerability */

  if (
    invulnerable > 0
  ) {

    ctx.strokeStyle =
      "#ffffff";

    ctx.lineWidth = 3;

    ctx.globalAlpha =
      .8;

    ctx.beginPath();

    ctx.arc(
      laneX(
        player.x
      ),
      player.y,
      43,
      0,
      Math.PI * 2
    );

    ctx.stroke();

    ctx.globalAlpha =
      1;

  }


  drawParticles();


  ctx.restore();

}


/* =========================================================
   LOOP
   ========================================================= */

function loop(
  time
) {

  if (
    state !== "game"
  ) {

    return;

  }


  const dt =
    Math.min(
      .035,
      (
        time -
        lastTime
      ) / 1000
    );


  lastTime =
    time;


  if (
    !paused
  ) {

    update(
      dt
    );

    draw();

  }


  animationId =
    requestAnimationFrame(
      loop
    );

}


/* =========================================================
   CAR SHOP
   ========================================================= */

function renderCars() {

  const container =
    document.getElementById(
      "carItems"
    );

  const t =
    translations[
      currentLanguage
    ];


  container.innerHTML =
    "";


  Object.entries(
    cars
  ).forEach(
    (
      [id, car]
    ) => {

      const unlocked =
        save.unlockedCars
          .includes(id);

      const selected =
        save.selectedCar ===
        id;


      let text;

      let buttonClass =
        "";


      if (
        selected
      ) {

        text =
          t.selected;

        buttonClass =
          "secondary";

      } else if (
        unlocked
      ) {

        text =
          t.select;

        buttonClass =
          "secondary";

      } else {

        text =
          "$" +
          car.price +
          " " +
          t.buy;

      }


      const carName =
        t.carsList[id] ||
        car.name;


      container.innerHTML += `

        <article class="card">

          <div class="preview">

            <img
              class="pixelPreview"
              src="objects/cars/driver/${car.file}"
              alt="${carName}"
            >

          </div>

          <h2>
            ${carName}
          </h2>

          <p>

            ${
              unlocked
                ? t.unlocked
                : t.price +
                  " $" +
                  car.price
            }

          </p>

          <button
            data-buy-car="${id}"
            class="${buttonClass}"
          >

            ${text}

          </button>

        </article>

      `;

    }
  );

}


/* =========================================================
   ROAD SHOP
   ========================================================= */

function renderRoads() {

  const container =
    document.getElementById(
      "roadItems"
    );

  const t =
    translations[
      currentLanguage
    ];


  container.innerHTML =
    "";


  Object.entries(
    roads
  ).forEach(
    (
      [id, road]
    ) => {

      const unlocked =
        save.unlockedRoads
          .includes(id);

      const selected =
        save.selectedRoad ===
        id;


      let text;

      let buttonClass =
        "";


      if (
        selected
      ) {

        text =
          t.selected;

        buttonClass =
          "secondary";

      } else if (
        unlocked
      ) {

        text =
          t.select;

        buttonClass =
          "secondary";

      } else {

        text =
          "$" +
          road.price +
          " " +
          t.buy;

      }


      const roadName =
        t.roadsList[id] ||
        road.name;


      container.innerHTML += `

        <article class="card">

          <div class="preview">

            <img
              class="roadPreview"
              src="objects/roads/${road.file}"
              alt="${roadName}"
            >

          </div>

          <h2>
            ${roadName}
          </h2>

          <p>

            ${
              unlocked
                ? t.unlocked
                : t.price +
                  " $" +
                  road.price
            }

          </p>

          <button
            data-select-road="${id}"
            class="${buttonClass}"
          >

            ${text}

          </button>

        </article>

      `;

    }
  );

}


/* =========================================================
   RENDER
   ========================================================= */

function renderAll() {

  updateMoney();

  renderCars();

  renderRoads();

}


/* =========================================================
   BUY CAR
   ========================================================= */

function buyOrSelectCar(
  id
) {

  const item =
    cars[id];

  if (!item) {
    return;
  }


  if (
    save.unlockedCars
      .includes(id)
  ) {

    save.selectedCar =
      id;

    persist();

    renderCars();

    return;

  }


  if (
    save.money <
    item.price
  ) {

    alert(
      translations[
        currentLanguage
      ].notEnoughMoney
    );

    return;

  }


  save.money -=
    item.price;

  save.unlockedCars
    .push(id);

  save.selectedCar =
    id;

  persist();

  renderAll();

}


/* =========================================================
   BUY ROAD
   ========================================================= */

function buyOrSelectRoad(
  id
) {

  const item =
    roads[id];

  if (!item) {
    return;
  }


  if (
    !save.unlockedRoads
      .includes(id)
  ) {

    if (
      save.money <
      item.price
    ) {

      alert(
        translations[
          currentLanguage
        ].notEnoughMoney
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


/* =========================================================
   ACTION BUTTONS
   ========================================================= */

document.addEventListener(
  "click",
  event => {

    const target =
      event.target.closest(
        "[data-action]"
      );

    if (target) {

      const action =
        target.dataset.action;


      if (
        action ===
        "play"
      ) {

        startGame();

      }


      if (
        action ===
        "menu"
      ) {

        paused = false;

        showScreen(
          "menu"
        );

      }


      if (
        action ===
        "cars"
      ) {

        renderCars();

        showScreen(
          "cars"
        );

      }


      if (
        action ===
        "roads"
      ) {

        renderRoads();

        showScreen(
          "roads"
        );

      }


      if (
        action ===
        "resume"
      ) {

        paused = false;

        document
          .getElementById(
            "pauseOverlay"
          )
          .classList.remove(
            "visible"
          );

      }


      if (
        action ===
        "quit"
      ) {

        paused = false;

        showScreen(
          "menu"
        );

      }

    }


    const carButton =
      event.target.closest(
        "[data-buy-car]"
      );

    if (
      carButton
    ) {

      buyOrSelectCar(
        carButton.dataset.buyCar
      );

    }


    const roadButton =
      event.target.closest(
        "[data-select-road]"
      );

    if (
      roadButton
    ) {

      buyOrSelectRoad(
        roadButton.dataset.selectRoad
      );

    }

  }
);


/* =========================================================
   PAUSE
   ========================================================= */

document
  .getElementById(
    "pauseBtn"
  )
  .addEventListener(
    "click",
    () => {

      if (
        state !== "game"
      ) {

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


/* =========================================================
   TOUCH CONTROLS
   ========================================================= */

function setControl(
  name,
  value
) {

  keys[name] =
    value;

}


document
  .querySelectorAll(
    "#touchControls button"
  )
  .forEach(
    button => {

      const key =
        button.dataset.key;


      button.addEventListener(
        "pointerdown",
        event => {

          event.preventDefault();

          event.stopPropagation();

          setControl(
            key,
            true
          );

          button
            .setPointerCapture?.(
              event.pointerId
            );

        }
      );


      button.addEventListener(
        "pointerup",
        event => {

          event.preventDefault();

          event.stopPropagation();

          setControl(
            key,
            false
          );

        }
      );


      button.addEventListener(
        "pointercancel",
        event => {

          event.preventDefault();

          event.stopPropagation();

          setControl(
            key,
            false
          );

        }
      );


      button.addEventListener(
        "pointerleave",
        event => {

          if (
            key !==
            "boost"
          ) {

            setControl(
              key,
              false
            );

          }

        }
      );


      button.addEventListener(
        "contextmenu",
        event => {

          event.preventDefault();

        }
      );

    }
  );


/* =========================================================
   KEYBOARD
   ========================================================= */

window.addEventListener(
  "keydown",
  event => {

    if (
      [
        "ArrowLeft",
        "a",
        "A"
      ].includes(
        event.key
      )
    ) {

      keys.left = true;

      event.preventDefault();

    }


    if (
      [
        "ArrowRight",
        "d",
        "D"
      ].includes(
        event.key
      )
    ) {

      keys.right = true;

      event.preventDefault();

    }


    if (
      event.code ===
      "Space"
    ) {

      keys.boost = true;

      event.preventDefault();

    }


    if (
      event.key ===
      "Escape" &&
      state ===
      "game"
    ) {

      paused =
        !paused;

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
  event => {

    if (
      [
        "ArrowLeft",
        "a",
        "A"
      ].includes(
        event.key
      )
    ) {

      keys.left = false;

    }


    if (
      [
        "ArrowRight",
        "d",
        "D"
      ].includes(
        event.key
      )
    ) {

      keys.right = false;

    }


    if (
      event.code ===
      "Space"
    ) {

      keys.boost = false;

    }

  }
);


/* =========================================================
   VISIBILITY
   ========================================================= */

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


/* =========================================================
   TRANSLATIONS
   ========================================================= */

const translations = {

  de: {

    subtitle:
      "Endless Arcade Chase",

    money:
      "Geld: $",

    traffic:
      "Verkehrsdichte",

    low:
      "Wenig Verkehr",

    normal:
      "Normaler Verkehr",

    high:
      "Dichter Verkehr",

    language:
      "Sprache",

    play:
      "SPIELEN",

    shop:
      "SHOP",

    cars:
      "AUTOS",

    roads:
      "STRASSEN",

    back:
      "ZURÜCK",

    pause:
      "PAUSE",

    resume:
      "WEITER",

    quit:
      "BEENDEN",

    gameover:
      "GAME OVER",

    again:
      "NOCHMAL SPIELEN",

    menu:
      "HAUPTMENÜ",

    score:
      "Score:",

    distance:
      "Distanz:",

    lives:
      "Leben:",

    police:
      "POLIZEI:",

    farAway:
      "weit entfernt",

    comingCloser:
      "kommt näher",

    dangerous:
      "GEFÄHRLICH NAH",

    destroyed:
      "zerstört",

    driven:
      "Gefahrene Strecke:",

    earned:
      "Verdient:",

    highscore:
      "Highscore:",

    nitro:
      "NITRO",

    unlocked:
      "Freigeschaltet",

    select:
      "AUSWÄHLEN",

    selected:
      "AUSGEWÄHLT",

    buy:
      "KAUFEN",

    notEnoughMoney:
      "Du hast nicht genug Geld.",

    carsList: {

      starter:
        "Standardauto",

      retro:
        "Retroauto",

      sport:
        "Sportwagen",

      muscle:
        "Muscle Car",

      f1:
        "F1-Auto"

    },

    roadsList: {

      city:
        "Stadt",

      highway:
        "Autobahn",

      desert:
        "Wüste",

      night:
        "Nacht",

      snow:
        "Schnee"

    },

    price:
      "Preis:",

    codeTitle: "CODE",
    codePrompt: "Gib deinen Code ein.",
    codePlaceholder: "CODE EINGEBEN",
    codeRedeem: "EINLÖSEN",
    codeClose: "SCHLIESSEN",
    codeEmpty: "Bitte gib einen Code ein.",
    codeInvalid: "Ungültiger Code.",
    codeUsed: "Dieser Code wurde bereits benutzt.",
    codeMoneyDouble: "Dein Geld wurde verdoppelt!"

    },


  en: {

    subtitle:
      "Endless Arcade Chase",

    money:
      "Money: $",

    traffic:
      "Traffic Density",

    low:
      "Low Traffic",

    normal:
      "Normal Traffic",

    high:
      "Heavy Traffic",

    language:
      "Language",

    play:
      "PLAY",

    shop:
      "SHOP",

    cars:
      "CARS",

    roads:
      "ROADS",

    back:
      "BACK",

    pause:
      "PAUSE",

    resume:
      "RESUME",

    quit:
      "QUIT",

    gameover:
      "GAME OVER",

    again:
      "PLAY AGAIN",

    menu:
      "MAIN MENU",

    score:
      "Score:",

    distance:
      "Distance:",

    lives:
      "Lives:",

    police:
      "POLICE:",

    farAway:
      "far away",

    comingCloser:
      "coming closer",

    dangerous:
      "DANGEROUSLY CLOSE",

    destroyed:
      "destroyed",

    driven:
      "Distance driven:",

    earned:
      "Earned:",

    highscore:
      "Highscore:",

    nitro:
      "NITRO",

    unlocked:
      "Unlocked",

    select:
      "SELECT",

    selected:
      "SELECTED",

    buy:
      "BUY",

    notEnoughMoney:
      "You don't have enough money.",

    carsList: {

      starter:
        "Standard Car",

      retro:
        "Retro Car",

      sport:
        "Sports Car",

      muscle:
        "Muscle Car",

      f1:
        "F1 Car"

    },

    roadsList: {

      city:
        "City",

      highway:
        "Highway",

      desert:
        "Desert",

      night:
        "Night",

      snow:
        "Snow"

    },

    price:
      "Price:",

    codeTitle: "CODE",
    codePrompt: "Enter your code.",
    codePlaceholder: "ENTER CODE",
    codeRedeem: "REDEEM",
    codeClose: "CLOSE",
    codeEmpty: "Please enter a code.",
    codeInvalid: "Invalid code.",
    codeUsed: "This code has already been used.",
    codeMoneyDouble: "Your money has been doubled!"

    },


  es: {

    subtitle:
      "Persecución Arcade Infinita",

    money:
      "Dinero: $",

    traffic:
      "Densidad del tráfico",

    low:
      "Poco tráfico",

    normal:
      "Tráfico normal",

    high:
      "Mucho tráfico",

    language:
      "Idioma",

    play:
      "JUGAR",

    shop:
      "TIENDA",

    cars:
      "COCHES",

    roads:
      "CARRETERAS",

    back:
      "VOLVER",

    pause:
      "PAUSA",

    resume:
      "CONTINUAR",

    quit:
      "SALIR",

    gameover:
      "GAME OVER",

    again:
      "JUGAR DE NUEVO",

    menu:
      "MENÚ PRINCIPAL",

    score:
      "Puntuación:",

    distance:
      "Distancia:",

    lives:
      "Vidas:",

    police:
      "POLICÍA:",

    farAway:
      "lejos",

    comingCloser:
      "se acerca",

    dangerous:
      "MUY CERCA",

    destroyed:
      "destruido",

    driven:
      "Distancia recorrida:",

    earned:
      "Ganado:",

    highscore:
      "Récord:",

    nitro:
      "NITRO",

    unlocked:
      "Desbloqueado",

    select:
      "SELECCIONAR",

    selected:
      "SELECCIONADO",

    buy:
      "COMPRAR",

    notEnoughMoney:
      "No tienes suficiente dinero.",

    carsList: {

      starter:
        "Coche estándar",

      retro:
        "Coche retro",

      sport:
        "Coche deportivo",

      muscle:
        "Muscle Car",

      f1:
        "Coche de F1"

    },

    roadsList: {

      city:
        "Ciudad",

      highway:
        "Autopista",

      desert:
        "Desierto",

      night:
        "Noche",

      snow:
        "Nieve"

    },

    price:
      "Precio:",

    codeTitle: "CÓDIGO",
    codePrompt: "Introduce tu código.",
    codePlaceholder: "INTRODUCIR CÓDIGO",
    codeRedeem: "CANJEAR",
    codeClose: "CERRAR",
    codeEmpty: "Introduce un código.",
    codeInvalid: "Código no válido.",
    codeUsed: "Este código ya ha sido utilizado.",
    codeMoneyDouble: "¡Tu dinero se ha duplicado!"

      }

};


/* =========================================================
   LANGUAGE
   ========================================================= */

let currentLanguage =
  localStorage.getItem(
    "policeEscapeLanguage"
  ) || "de";


function applyLanguage() {

  const t =
    translations[
      currentLanguage
    ];


  document.querySelector(
    ".subtitle"
  ).textContent =
    t.subtitle;


  document
    .querySelectorAll(
      ".money"
    )
    .forEach(
      element => {

        element.innerHTML =
          `${t.money}<span class="moneyValue">0</span>`;

      }
    );


  document.querySelector(
    'label[for="densitySelect"]'
  ).textContent =
    t.traffic;


  document.querySelector(
    'label[for="languageSelect"]'
  ).textContent =
    t.language;


  document.querySelector(
    '#densitySelect option[value="low"]'
  ).textContent =
    t.low;


  document.querySelector(
    '#densitySelect option[value="normal"]'
  ).textContent =
    t.normal;


  document.querySelector(
    '#densitySelect option[value="high"]'
  ).textContent =
    t.high;


  document
    .querySelectorAll(
      "[data-action]"
    )
    .forEach(
      button => {

        const action =
          button.dataset.action;


        if (
          action ===
          "play"
        ) {

          button.textContent =
            t.play;

        }


        if (
          action ===
          "shop"
        ) {

          button.textContent =
            t.shop;

        }


        if (
          action ===
          "cars"
        ) {

          button.textContent =
            t.cars;

        }


        if (
          action ===
          "roads"
        ) {

          button.textContent =
            t.roads;

        }


        if (
          action ===
          "menu"
        ) {

          button.textContent =
            t.menu;

        }


        if (
          action ===
          "resume"
        ) {

          button.textContent =
            t.resume;

        }


        if (
          action ===
          "quit"
        ) {

          button.textContent =
            t.quit;

        }

      }
    );


  document.getElementById(
    "scoreLabel"
  ).textContent =
    t.score;


  document.getElementById(
    "distanceLabel"
  ).textContent =
    t.distance;


  document.getElementById(
    "livesLabel"
  ).textContent =
    t.lives;


  document.getElementById(
    "policeLabel"
  ).textContent =
    t.police;


  document.getElementById(
    "nitroLabel"
  ).textContent =
    t.nitro;


  document.getElementById(
    "gameoverTitle"
  ).textContent =
    t.gameover;


  document.getElementById(
    "finalScoreLabel"
  ).textContent =
    t.score;


  document.getElementById(
    "drivenLabel"
  ).textContent =
    t.driven;


  document.getElementById(
    "earnedLabel"
  ).textContent =
    t.earned;


  document.getElementById(
    "highscoreResultLabel"
  ).textContent =
    t.highscore;


  document.getElementById(
    "languageSelect"
  ).value =
    currentLanguage;


  renderCars();

  renderRoads();

  updateMoney();

  updateHud();

}


document
  .getElementById(
    "languageSelect"
  )
  .addEventListener(
    "change",
    function () {

      currentLanguage =
        this.value;

      localStorage.setItem(
        "policeEscapeLanguage",
        currentLanguage
      );

      applyLanguage();

    }
  );



// ==========================================
// CODEFENSTER
// ==========================================

const codeOverlay = document.getElementById("codeOverlay");
const codeInput = document.getElementById("codeInput");
const codeMessage = document.getElementById("codeMessage");
const redeemCodeBtn = document.getElementById("redeemCodeBtn");
const closeCodeBtn = document.getElementById("closeCodeBtn");

let secretCodeBuffer = "";
let secretCodeTimer = null;

function openCodeWindow() {
  if (!codeOverlay || !codeInput || !codeMessage) return;

  codeOverlay.classList.add("visible");
  codeOverlay.setAttribute("aria-hidden", "false");

  codeInput.value = "";
  codeMessage.textContent = t.codePrompt;
  codeMessage.className = "";

  setTimeout(() => {
    codeInput.focus();
  }, 50);
}

function closeCodeWindow() {
  if (!codeOverlay || !codeInput) return;

  codeOverlay.classList.remove("visible");
  codeOverlay.setAttribute("aria-hidden", "true");

  codeInput.value = "";
  secretCodeBuffer = "";
}

if (redeemCodeBtn) {
  redeemCodeBtn.addEventListener("click", redeemCode);
}

if (closeCodeBtn) {
  closeCodeBtn.addEventListener("click", closeCodeWindow);
}

if (codeInput) {
  codeInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      redeemCode();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeCodeWindow();
    }
  });
}

document.addEventListener("keydown", (event) => {
  // Nicht auslösen, während man einen Code eintippt
  if (document.activeElement === codeInput) return;

  const menu = document.getElementById("menu");

  // Nur im Hauptmenü
  if (!menu || !menu.classList.contains("active")) {
    return;
  }

  // Escape schließt das Fenster
  if (
    event.key === "Escape" &&
    codeOverlay &&
    codeOverlay.classList.contains("visible")
  ) {
    closeCodeWindow();
    return;
  }

  // Nur Buchstaben
  if (event.key.length !== 1 || !/[a-zA-Z]/.test(event.key)) {
    return;
  }

  secretCodeBuffer += event.key.toLowerCase();

  // Nur die letzten 4 Zeichen behalten
  if (secretCodeBuffer.length > 4) {
    secretCodeBuffer = secretCodeBuffer.slice(-4);
  }

  // "code" eingegeben
  if (secretCodeBuffer === "code") {
    openCodeWindow();
    secretCodeBuffer = "";
  }

  clearTimeout(secretCodeTimer);

  secretCodeTimer = setTimeout(() => {
    secretCodeBuffer = "";
  }, 1500);
});


// ==========================================
// CODES EINLÖSEN
// ==========================================

function redeemCode() {
  if (!codeInput || !codeMessage) {
    console.error("Codefenster-Elemente fehlen.");
    return;
  }

  const code = codeInput.value.trim().toUpperCase();

  console.log("Eingegebener Code:", code);

  if (!code) {
    codeMessage.textContent = t.codeEmpty;
    codeMessage.className = "error";
    return;
  }

  // ==========================================
  // RESET
  // ==========================================

  if (code === "RESET") {
    localStorage.removeItem("policeEscapeSave");
    localStorage.removeItem("policeEscapeCode_POLICEX2");

    location.reload();
    return;
  }

  // ==========================================
  // POLICEX2
  // ==========================================

  if (code === "POLICEX2") {

    // Bereits benutzt?
    if (
      localStorage.getItem("policeEscapeCode_POLICEX2") === "true"
    ) {
      codeMessage.textContent = t.codeUsed;
      codeMessage.className = "error";
      return;
    }

    // Geld verdoppeln
    save.money *= 2;

    // Code als benutzt speichern
    localStorage.setItem(
      "policeEscapeCode_POLICEX2",
      "true"
    );

    // Spielstand speichern
    persist();

    // Anzeige aktualisieren
    renderAll();

    // Erfolgsmeldung
    codeMessage.textContent = t.codeMoneyDouble;
    codeMessage.className = "success";

    codeInput.value = "";

    return;
  }

  // ==========================================
  // UNGÜLTIG
  // ==========================================

  codeMessage.textContent = t.codeInvalid;
  codeMessage.className = "error";
}



/* =========================================================
   INITIALIZE
   ========================================================= */

resize();

renderAll();

applyLanguage();

showScreen(
  "menu"
);
