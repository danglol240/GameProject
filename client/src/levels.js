// ---------- dữ liệu màn chơi ----------
export const LEVELS = [
    {
      name: "Khởi Động",
      hint: "Đứng lên nút tròn để mở cửa cho đồng đội — cả hai cùng chạm cờ!",
      theme: { sky: 0x9fd9ff, fog: 0xc9eaff, hemi: 0xeaf7ff, plat: 0x58c08a, side: 0x3f9468, accent: 0xff9f43, accent2: 0x845ef7 },
      spawns: [{ x: -1.5, y: 0 }, { x: 0.3, y: 0 }],
      platforms: [
        { x1: -5, x2: 6, top: 0 },
        { x1: 8.5, x2: 14.8, top: 0.6 },
        { x1: 16.8, x2: 32.5, top: 0 }
      ],
      plates: [{ id: "A", x: 12.6, y: 0.6 }],
      buttons: [{ id: "B", x: 22.4, y: 0 }],
      doors: [{ id: "D1", x: 19.2, base: 0, w: 0.8, h: 3.4, when: function (s) { return s.plates.A || s.latched.B; } }],
      movers: [],
      checkpoints: [],
      goal: { x: 29, y: 0 }
    },
    {
      name: "Nâng Nhau Lên",
      hint: "Tường quá cao? Hãy nhảy lên ĐẦU đồng đội để leo lên!",
      theme: { sky: 0xffd9a3, fog: 0xffe7c4, hemi: 0xfff1dc, plat: 0xe2795b, side: 0xb05a42, accent: 0x2ec4b6, accent2: 0xffd166 },
      spawns: [{ x: -1.5, y: 0 }, { x: 0.3, y: 0 }],
      platforms: [
        { x1: -5, x2: 18, top: 0 },
        { x1: 7, x2: 9, top: 2.8, th: 1.3 },
        { x1: 26, x2: 34, top: 0 }
      ],
      plates: [],
      buttons: [{ id: "B", x: 8, y: 2.8 }],
      doors: [{ id: "D1", x: 8, base: 0, w: 2.0, h: 1.5, when: function (s) { return s.latched.B; } }],
      movers: [{ x: 22, y: 0, w: 3, ax: 2.6, ay: 0, period: 7, phase: 0 }],
      checkpoints: [{ x1: 9.5, x2: 18, top: 0, spawns: [{ x: 10.5, y: 0 }, { x: 12, y: 0 }] }],
      goal: { x: 31, y: 0 }
    },
    {
      name: "Song Kiếm Hợp Bích",
      hint: "Hai nút cuối phải được giữ CÙNG LÚC — cửa chỉ mở vài giây, chạy nhanh lên!",
      theme: { sky: 0x2b2a55, fog: 0x3a3870, hemi: 0x8e8cc9, plat: 0x7163d1, side: 0x55489f, accent: 0xffd166, accent2: 0xff6b9d },
      spawns: [{ x: -1.8, y: 0 }, { x: 0, y: 0 }],
      platforms: [
        { x1: -5.5, x2: 4, top: 0 },
        { x1: 9, x2: 17, top: 2.6 },
        { x1: 18.5, x2: 31.5, top: 0 }
      ],
      plates: [
        { id: "R1", x: 10.6, y: 2.6 }, { id: "R2", x: 15.9, y: 2.6 },
        { id: "T1", x: 20.6, y: 0 }, { id: "T2", x: 23.2, y: 0 }
      ],
      buttons: [],
      doors: [
        { id: "D1", x: 13.4, base: 2.6, w: 0.8, h: 3, when: function (s) { return s.plates.R1 || s.plates.R2; } },
        { id: "D2", x: 25.2, base: 0, w: 0.8, h: 3.4, duration: 3.5, trigger: function (s) { return s.plates.T1 && s.plates.T2; } }
      ],
      movers: [{ x: 6.6, y: 1.3, w: 2.3, ax: 0, ay: 1.3, period: 5.5, phase: 0 }],
      checkpoints: [{ x1: 18.5, x2: 24.5, top: 0, spawns: [{ x: 19.3, y: 0 }, { x: 20.2, y: 0 }] }],
      goal: { x: 29, y: 0 }
    }
  ];

export const P_COLORS = [0xff7a4d, 0x4da8ff];
export const P_NAMES = ["CAM", "LAM"];
