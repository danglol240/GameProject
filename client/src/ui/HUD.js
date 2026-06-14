export const HUD_HTML = '' +
    '<style>' +
    '.cg-hud{position:absolute;inset:0;pointer-events:none;font-family:"Be Vietnam Pro",system-ui,sans-serif;color:#fff;user-select:none;}' +
    '.cg-bar{position:absolute;top:16px;left:0;right:0;display:flex;justify-content:space-between;padding:0 20px;align-items:flex-start;}' +
    '.cg-chip{background:rgba(16,20,38,.72);backdrop-filter:blur(6px);border-radius:14px;padding:10px 16px;display:flex;gap:14px;align-items:center;box-shadow:0 4px 16px rgba(0,0,0,.18);}' +
    '.cg-lvl{font-weight:800;font-size:15px;letter-spacing:.04em;}' +
    '.cg-lvlname{font-weight:600;font-size:13px;opacity:.8;}' +
    '.cg-stat{font-weight:700;font-size:14px;font-variant-numeric:tabular-nums;display:flex;gap:14px;}' +
    '.cg-stat span b{opacity:.55;font-weight:600;margin-right:5px;}' +
    '.cg-toast{position:absolute;top:78px;left:50%;transform:translateX(-50%);background:rgba(16,20,38,.78);backdrop-filter:blur(6px);border-radius:12px;padding:9px 18px;font-size:14px;font-weight:600;opacity:0;transition:opacity .4s;max-width:70%;text-align:center;}' +
    '.cg-timer{position:absolute;bottom:84px;left:50%;transform:translateX(-50%);background:rgba(255,107,157,.92);border-radius:12px;padding:8px 18px;font-size:16px;font-weight:800;opacity:0;transition:opacity .2s;font-variant-numeric:tabular-nums;}' +
    '.cg-legend{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);display:flex;gap:10px;font-size:12px;font-weight:600;opacity:.85;}' +
    '.cg-key{background:rgba(16,20,38,.6);border-radius:8px;padding:5px 10px;display:flex;gap:6px;align-items:center;}' +
    '.cg-dot{width:9px;height:9px;border-radius:50%;display:inline-block;}' +
    '.cg-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(10,12,26,.55);backdrop-filter:blur(7px);opacity:0;pointer-events:none;transition:opacity .45s;}' +
    '.cg-overlay.on{opacity:1;pointer-events:auto;}' +
    '.cg-panel{text-align:center;max-width:620px;padding:30px;}' +
    '.cg-title{font-size:52px;font-weight:900;letter-spacing:.02em;line-height:1.05;text-shadow:0 6px 24px rgba(0,0,0,.35);}' +
    '.cg-sub{font-size:16px;font-weight:600;opacity:.85;margin-top:10px;}' +
    '.cg-cards{display:flex;gap:16px;justify-content:center;margin:26px 0 8px;}' +
    '.cg-card{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);border-radius:16px;padding:16px 22px;min-width:170px;}' +
    '.cg-card h4{margin:0 0 8px;font-size:14px;font-weight:800;display:flex;align-items:center;gap:8px;justify-content:center;}' +
    '.cg-card p{margin:3px 0;font-size:13px;font-weight:600;opacity:.9;}' +
    '.cg-kbd{display:inline-block;background:rgba(255,255,255,.16);border-radius:6px;padding:1px 8px;font-weight:800;font-size:12px;margin:0 1px;}' +
    '.cg-press{margin-top:26px;font-size:17px;font-weight:800;letter-spacing:.06em;animation:cgPulse 1.4s ease-in-out infinite;}' +
    '@keyframes cgPulse{0%,100%{opacity:1}50%{opacity:.45}}' +
    '.cg-big{font-size:64px;}' +
    '</style>' +
    '<div class="cg-hud">' +
    '  <div class="cg-bar">' +
    '    <div class="cg-chip"><span class="cg-lvl" id="cgLvl">MÀN 1/3</span><span class="cg-lvlname" id="cgLvlName"></span></div>' +
    '    <div class="cg-chip cg-stat"><span><b>THỜI GIAN</b><span id="cgTime">0:00</span></span><span><b>NGÃ</b><span id="cgDeaths">0</span></span></div>' +
    '  </div>' +
    '  <div class="cg-toast" id="cgToast"></div>' +
    '  <div class="cg-timer" id="cgTimer"></div>' +
    '  <div class="cg-legend">' +
    '    <span class="cg-key"><span class="cg-dot" style="background:#ff7a4d"></span>P1: A D · nhảy W</span>' +
    '    <span class="cg-key"><span class="cg-dot" style="background:#4da8ff"></span>P2: ← → · nhảy ↑</span>' +
    '    <span class="cg-key">R: chơi lại màn</span>' +
    '  </div>' +
    '  <div class="cg-overlay on" id="cgIntro"><div class="cg-panel">' +
    '    <div class="cg-title">ĐÔI BẠN<br>CÙNG TIẾN</div>' +
    '    <div class="cg-sub">Game platformer phối hợp · 2 người · 1 bàn phím</div>' +
    '    <div class="cg-cards">' +
    '      <div class="cg-card"><h4><span class="cg-dot" style="background:#ff7a4d"></span>NGƯỜI CHƠI 1</h4><p><span class="cg-kbd">A</span><span class="cg-kbd">D</span> di chuyển</p><p><span class="cg-kbd">W</span> nhảy</p></div>' +
    '      <div class="cg-card"><h4><span class="cg-dot" style="background:#4da8ff"></span>NGƯỜI CHƠI 2</h4><p><span class="cg-kbd">←</span><span class="cg-kbd">→</span> di chuyển</p><p><span class="cg-kbd">↑</span> nhảy</p></div>' +
    '    </div>' +
    '    <div class="cg-sub">Phối hợp vượt chướng ngại — cả hai cùng chạm cờ để qua màn!</div>' +
    '    <div class="cg-press">NHẤN ENTER ĐỂ BẮT ĐẦU</div>' +
    '  </div></div>' +
    '  <div class="cg-overlay" id="cgNext"><div class="cg-panel">' +
    '    <div class="cg-title" id="cgNextTitle">MÀN 1 HOÀN THÀNH!</div>' +
    '    <div class="cg-sub" id="cgNextSub"></div>' +
    '    <div class="cg-press">NHẤN ENTER ĐỂ TIẾP TỤC</div>' +
    '  </div></div>' +
    '  <div class="cg-overlay" id="cgFinal"><div class="cg-panel">' +
    '    <div class="cg-title cg-big">CHIẾN THẮNG!</div>' +
    '    <div class="cg-sub" id="cgFinalStats"></div>' +
    '    <div class="cg-sub">Tinh thần đồng đội tuyệt vời — thử phá kỷ lục thời gian xem!</div>' +
    '    <div class="cg-press">NHẤN ENTER ĐỂ CHƠI LẠI</div>' +
    '  </div></div>' +
    '</div>';
