(function () {
  // Find ChetBot script tag to read configuration
  const scriptTag = document.querySelector("script[data-bot-id]") || document.querySelector("script[src*='widget.js']");
  if (!scriptTag) {
    console.warn("ChetBot script tag not found. Please verify the embed code.");
    return;
  }

  const botId = scriptTag.getAttribute("data-bot-id") || "active";

  // Get hosting server URL (including subdirectory if present)
  const scriptUrl = new URL(scriptTag.src);
  const serverUrl = scriptUrl.href.replace(/\/widget\.js(\?.*)?$/, "");

  // Configuration settings (will be updated via API fetch)
  let settings = {
    botName: "ChetBot",
    widgetColor: "#4f46e5",
    headerColor: "#4f46e5",
    position: "bottom-right",
    bubbleStyle: "round",
    font: "Inter",
    borderRadius: 16,
    avatarUrl: "",
    launcherIcon: "",
    launcherBgTransparent: false,
    launcherIconSize: 28
  };

  // Fetch settings from the API
  fetch(`${serverUrl}/api/widget/${botId}/settings`)
    .then((res) => res.json())
    .then((data) => {
      if (data.error) throw new Error(data.error);
      settings = { ...settings, ...data };
      initWidget();
    })
    .catch((err) => {
      console.warn("Failed to load ChetBot settings, loading with default style:", err);
      initWidget();
    });

  function initWidget() {
    // Create CSS Styles
    const style = document.createElement("style");
    const isRight = settings.position !== "bottom-left";
    const primaryColor = settings.widgetColor || "#4f46e5";
    const isBgTransparent = !!settings.launcherBgTransparent;
    const launcherBg = isBgTransparent ? "transparent" : primaryColor;
    const launcherShadow = isBgTransparent ? "none" : "0 4px 12px rgba(0, 0, 0, 0.15)";
    const launcherHoverShadow = isBgTransparent ? "none" : "0 6px 16px rgba(0, 0, 0, 0.2)";
    const iconSize = `${settings.launcherIconSize || 28}px`;

    const animationName = settings.launcherAnimation || "bounce";
    let animationClass = "";
    if (animationName === "bounce") animationClass = "chetbot-animate-bounce";
    else if (animationName === "wiggle") animationClass = "chetbot-animate-wiggle";
    else if (animationName === "pulse") animationClass = "chetbot-animate-pulse";

    style.innerHTML = `
      @keyframes chetbot-bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      @keyframes chetbot-wiggle {
        0%, 100% { transform: rotate(0); }
        15% { transform: rotate(-8deg); }
        30% { transform: rotate(8deg); }
        45% { transform: rotate(-4deg); }
        60% { transform: rotate(4deg); }
        75% { transform: rotate(0); }
      }
      @keyframes chetbot-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.06); }
      }
      
      .chetbot-animate-bounce {
        animation: chetbot-bounce 2s infinite ease-in-out;
      }
      .chetbot-animate-wiggle {
        animation: chetbot-wiggle 1.5s infinite ease-in-out;
      }
      .chetbot-animate-pulse {
        animation: chetbot-pulse 2s infinite ease-in-out;
      }

      #chetbot-widget-container {
        position: fixed;
        bottom: 20px;
        ${isRight ? "right: 30px;" : "left: 30px;"}
        z-index: 999999;
        font-family: ${settings.font}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      
      #chetbot-bubble-trigger {
        position: relative;
        width: 60px;
        height: 60px;
        border-radius: ${settings.bubbleStyle === "square" ? `${settings.borderRadius}px` : "50%"};
        background-color: ${launcherBg};
        box-shadow: ${launcherShadow};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        border: none;
        outline: none;
      }
      
      #chetbot-bubble-trigger.open {
        animation: none !important;
        transform: none !important;
      }
      
      #chetbot-bubble-trigger:hover {
        transform: scale(1.05);
        box-shadow: ${launcherHoverShadow};
      }

      #chetbot-notification-badge {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background-color: #ef4444;
        color: #ffffff;
        font-size: 10px;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        border: 2px solid #ffffff;
        z-index: 10;
        transition: opacity 0.2s, transform 0.2s;
      }
      
      #chetbot-bubble-trigger.open #chetbot-notification-badge {
        opacity: 0;
        transform: scale(0);
        pointer-events: none;
      }
      
      #chetbot-launcher-greeting-container {
        position: absolute;
        bottom: -30px;
        ${isRight ? "right: -30px;" : "left: -30px;"}
        width: 120px;
        height: 120px;
        pointer-events: none;
        z-index: 999998;
        transition: opacity 0.3s ease, transform 0.3s ease;
        opacity: 0;
        transform: scale(0.9) translateY(10px);
      }
      
      #chetbot-launcher-greeting-container.show {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
      
      #chetbot-greeting-close {
        position: absolute;
        top: 34px;
        right: 12px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background-color: #ef4444;
        color: #ffffff;
        border: none;
        font-size: 8px;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        pointer-events: auto;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        transition: background-color 0.2s, transform 0.2s;
        z-index: 999999;
      }
      
      #chetbot-greeting-close:hover {
        background-color: #dc2626;
        transform: scale(1.1);
      }
      
      #chetbot-bubble-trigger svg, #chetbot-bubble-trigger img, #chetbot-bubble-trigger #chetbot-icon-chat {
        width: ${iconSize};
        height: ${iconSize};
        max-width: ${iconSize};
        max-height: ${iconSize};
        transition: transform 0.3s ease;
        object-fit: contain;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      #chetbot-bubble-trigger svg {
        fill: ${isBgTransparent ? primaryColor : "#ffffff"};
        color: ${isBgTransparent ? primaryColor : "#ffffff"};
      }
      
      #chetbot-bubble-trigger.open svg {
        transform: rotate(90deg);
      }

      #chetbot-chat-window {
        position: absolute;
        bottom: 80px;
        ${isRight ? "right: 0;" : "left: 0;"}
        width: 400px;
        height: 600px;
        background: transparent;
        border-radius: ${settings.borderRadius}px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease;
        opacity: 0;
        transform: translateY(20px) scale(0.95);
        visibility: hidden;
        pointer-events: none;
      }

      #chetbot-chat-window.open {
        opacity: 1;
        transform: translateY(0) scale(1);
        visibility: visible;
        pointer-events: auto;
      }

      #chetbot-iframe {
        width: 100%;
        height: 100%;
        border: none;
        background: #ffffff;
      }

      @media (max-width: 480px) {
        #chetbot-widget-container {
          bottom: 10px;
          ${isRight ? "right: 10px;" : "left: 10px;"}
        }
        #chetbot-chat-window {
          position: fixed;
          top: 10px;
          left: 10px;
          right: 10px;
          bottom: 80px;
          width: calc(100vw - 20px) !important;
          height: calc(100vh - 100px) !important;
        }
      }
    `;
    document.head.appendChild(style);

    // Create Widget DOM Elements
    const container = document.createElement("div");
    container.id = "chetbot-widget-container";

    // Chat Window Container
    const chatWindow = document.createElement("div");
    chatWindow.id = "chetbot-chat-window";

    // Setup Iframe pointing to server's widget route
    const iframe = document.createElement("iframe");
    iframe.id = "chetbot-iframe";
    // We pass config like font and color as query parameters so that the iframe can match styling seamlessly
    iframe.src = `${serverUrl}/widget/${botId}?origin=${encodeURIComponent(window.location.origin)}`;
    chatWindow.appendChild(iframe);

    // Bubble Trigger Button
    const trigger = document.createElement("button");
    trigger.id = "chetbot-bubble-trigger";
    if (animationClass) {
      trigger.classList.add(animationClass);
    }
    trigger.setAttribute("aria-label", "Open Chat");

    // Icon representing the chat bubble (SVG)
    let launcherHtml = `
      <svg id="chetbot-icon-chat" viewBox="0 0 24 24">
        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
      </svg>
    `;

    if (settings.launcherIcon) {
      if (settings.launcherIcon.trim().startsWith("<svg")) {
        launcherHtml = `<div id="chetbot-icon-chat" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:${isBgTransparent ? primaryColor : "#ffffff"};fill:currentColor;">${settings.launcherIcon}</div>`;
      } else {
        const iconSrc = settings.launcherIcon.startsWith("/") 
          ? (settings.launcherIcon.startsWith("/chetbot") ? `${scriptUrl.origin}${settings.launcherIcon}` : `${serverUrl}${settings.launcherIcon}`) 
          : settings.launcherIcon;
        launcherHtml = `<img id="chetbot-icon-chat" src="${iconSrc}" alt="Chat" style="width:${iconSize};height:${iconSize};object-fit:contain;" />`;
      }
    }

    trigger.innerHTML = `
      ${launcherHtml}
      <svg id="chetbot-icon-close" viewBox="0 0 24 24" style="display: none;">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
      <div id="chetbot-notification-badge">1</div>
    `;

    container.appendChild(chatWindow);
    container.appendChild(trigger);

    // Render Greeting Tooltip if enabled
    if (settings.launcherGreetingEnabled !== false && settings.launcherGreeting) {
      const greetingBox = document.createElement("div");
      greetingBox.id = "chetbot-launcher-greeting-container";
      
      const textToDraw = settings.launcherGreeting.toUpperCase();
      
      greetingBox.innerHTML = `
        <svg viewBox="0 0 120 120" style="width: 100%; height: 100%; overflow: visible;">
          <defs>
            <path id="chetbot-text-path-curve" d="M 15 55 A 45 45 0 0 1 105 55" fill="none" />
          </defs>
          <!-- Curved text -->
          <text dy="3.5" style="font-family: inherit; font-size: 9.5px; font-weight: 850; letter-spacing: 0.8px; fill: ${primaryColor}; text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0px 2px 4px rgba(0,0,0,0.15);">
            <textPath href="#chetbot-text-path-curve" startOffset="50%" text-anchor="middle">
              ${textToDraw}
            </textPath>
          </text>
        </svg>
        <button id="chetbot-greeting-close" aria-label="Close greeting">✕</button>
      `;
      container.appendChild(greetingBox);

      // Close greeting tooltip action
      const closeGreetingBtn = greetingBox.querySelector("#chetbot-greeting-close");
      closeGreetingBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        greetingBox.classList.remove("show");
      });

      // Show after 1.5 seconds delay
      setTimeout(() => {
        if (!isOpen && !greetingBox.classList.contains("hidden")) {
          greetingBox.classList.add("show");
        }
      }, 1500);

      // Hide tooltip when trigger is clicked
      trigger.addEventListener("click", () => {
        greetingBox.classList.remove("show");
        greetingBox.classList.add("hidden"); // Prevents showing it again during this session
      });
    }

    document.body.appendChild(container);

    const chatIcon = trigger.querySelector("#chetbot-icon-chat");
    const closeIcon = trigger.querySelector("#chetbot-icon-close");

    let isOpen = false;

    // Toggle Chat visibility
    trigger.addEventListener("click", () => {
      isOpen = !isOpen;
      if (isOpen) {
        chatWindow.classList.add("open");
        trigger.classList.add("open");
        chatIcon.style.display = "none";
        closeIcon.style.display = "block";
        // Notify the iframe that it has been opened
        iframe.contentWindow.postMessage({ type: "widget-opened" }, "*");
      } else {
        chatWindow.classList.remove("open");
        trigger.classList.remove("open");
        chatIcon.style.display = "block";
        closeIcon.style.display = "none";
      }
    });

    // Listen to messages from the iframe (e.g. to automatically toggle or adapt height)
    window.addEventListener("message", (event) => {
      if (event.origin !== serverUrl) return;
      
      if (event.data && event.data.type === "chetbot-close") {
        trigger.click();
      }
    });
  }
})();
