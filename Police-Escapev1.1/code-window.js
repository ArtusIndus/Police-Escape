
/* =========================================================
   POLICE ESCAPE – CODE-FENSTER + SERVER-REDEEM
   Diesen Block an das ENDE deines bestehenden game.js setzen.
   ========================================================= */

(() => {
  "use strict";

  const codeOverlay = document.getElementById("codeOverlay");
  const codeInput = document.getElementById("codeInput");
  const codeMessage = document.getElementById("codeMessage");
  const redeemCodeBtn = document.getElementById("redeemCodeBtn");
  const closeCodeBtn = document.getElementById("closeCodeBtn");

  if (
    !codeOverlay ||
    !codeInput ||
    !codeMessage ||
    !redeemCodeBtn ||
    !closeCodeBtn
  ) {
    console.warn("Code-Fenster: HTML-Elemente fehlen.");
    return;
  }

  let secretInput = "";
  let secretTimer = null;

  function setCodeMessage(text, type = "") {
    codeMessage.textContent = text;
    codeMessage.className = type;
  }

  function openCodeWindow() {
    codeOverlay.classList.add("open");
    codeOverlay.setAttribute("aria-hidden", "false");

    codeInput.value = "";
    setCodeMessage("Gib deinen Code ein.");
    secretInput = "";

    requestAnimationFrame(() => codeInput.focus());
  }

  function closeCodeWindow() {
    codeOverlay.classList.remove("open");
    codeOverlay.setAttribute("aria-hidden", "true");

    codeInput.value = "";
    setCodeMessage("Gib deinen Code ein.");
    secretInput = "";
  }

  async function redeemCode() {
    const code = codeInput.value.trim().toUpperCase();

    if (!code) {
      setCodeMessage("Bitte gib einen Code ein.", "error");
      return;
    }

    redeemCodeBtn.disabled = true;
    closeCodeBtn.disabled = true;
    setCodeMessage("Code wird geprüft.");

    try {
      const response = await fetch("/api/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code })
      });

      let result;

      try {
        result = await response.json();
      } catch {
        result = {
          success: false,
          message: "Ungültige Serverantwort."
        };
      }

      if (!response.ok || !result.success) {
        setCodeMessage(
          result.message || "Code konnte nicht eingelöst werden.",
          "error"
        );
        return;
      }

      /*
       * Diese Variablen/Funktionen existieren bereits in deinem game.js:
       * save, cars, roads, persist, renderAll
       */

      if (result.type === "money") {
        save.money += Number(result.amount) || 0;
      }

      if (
        result.type === "allCars" ||
        result.type === "everything"
      ) {
        save.unlockedCars = Object.keys(cars);
      }

      if (
        result.type === "allRoads" ||
        result.type === "everything"
      ) {
        save.unlockedRoads = Object.keys(roads);
      }

      persist();
      renderAll();

      setCodeMessage(
        result.message || "Code erfolgreich eingelöst!",
        "success"
      );

      codeInput.value = "";
    } catch (error) {
      console.error("Code redemption error:", error);

      setCodeMessage(
        "Server nicht erreichbar. Starte server.js und öffne das Spiel über http://localhost:3000.",
        "error"
      );
    } finally {
      redeemCodeBtn.disabled = false;
      closeCodeBtn.disabled = false;
    }
  }

  redeemCodeBtn.addEventListener("click", redeemCode);

  closeCodeBtn.addEventListener("click", closeCodeWindow);

  codeInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      redeemCode();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeCodeWindow();
    }
  });

  codeOverlay.addEventListener("click", event => {
    if (event.target === codeOverlay) {
      closeCodeWindow();
    }
  });

  /*
   * Geheimen Befehl erkennen:
   * Im Hauptmenü "code" tippen -> Code-Fenster öffnet sich.
   */
  document.addEventListener("keydown", event => {
    if (
      event.key === "Escape" &&
      codeOverlay.classList.contains("open")
    ) {
      closeCodeWindow();
      return;
    }

    // Während der eigentlichen Code-Eingabe nichts überwachen.
    if (document.activeElement === codeInput) {
      return;
    }

    // Nur im Hauptmenü.
    if (typeof state !== "undefined" && state !== "menu") {
      return;
    }

    if (codeOverlay.classList.contains("open")) {
      return;
    }

    if (event.key.length !== 1) {
      return;
    }

    secretInput += event.key.toLowerCase();

    if (secretInput.length > 4) {
      secretInput = secretInput.slice(-4);
    }

    clearTimeout(secretTimer);

    secretTimer = setTimeout(() => {
      secretInput = "";
    }, 1500);

    if (secretInput === "code") {
      openCodeWindow();
      secretInput = "";
      clearTimeout(secretTimer);
    }
  });

  window.openCodeWindow = openCodeWindow;
  window.closeCodeWindow = closeCodeWindow;
})();
