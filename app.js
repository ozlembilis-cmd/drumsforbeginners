// ─── Drum kit layout ────────────────────────────────────────
// Positions are fractions of screen width/height.
// "Default" mirrors a real overhead view: hi-hat left, crash right-high,
// snare front-center-left, toms center, floor tom far right.
// These can be repositioned by the user in calibration mode.

const DEFAULT_KIT_POSITIONS = [
    { name: "hihat",  label: "Hi-hat", x: 0.20, y: 0.34, radius: 0.10, color: "#6ab5d1" },
    { name: "crash",  label: "Crash",  x: 0.80, y: 0.28, radius: 0.10, color: "#d16ac4" },
    { name: "snare",  label: "Snare",  x: 0.33, y: 0.58, radius: 0.11, color: "#d1b06a" },
    { name: "tom",    label: "Tom",    x: 0.52, y: 0.44, radius: 0.10, color: "#6ad17a" },
    { name: "floor",  label: "Floor",  x: 0.73, y: 0.62, radius: 0.11, color: "#d19a6a" }
];

// Mutable kit — gets updated if user calibrates
const DRUM_KIT = DEFAULT_KIT_POSITIONS.map(d => ({ ...d }));

const DRUM_COLORS = {};
const DRUM_LABELS = {};
DRUM_KIT.forEach((d) => { DRUM_COLORS[d.name] = d.color; DRUM_LABELS[d.name] = d.label; });

const DRUM_LANES = { floor: 0, snare: 1, tom: 2, hihat: 3, crash: 4 };

const RAIL_BEAT_WIDTH = 78;
const RAIL_MIN_Y = 16;
const RAIL_MAX_Y = 168;
const POSE_SAMPLE_MS = 40;

// Strike detection
const STRIKE_VELOCITY_THRESHOLD = 0.7;
const STRIKE_COOLDOWN_MS = 150;
const HIT_RADIUS_MULTIPLIER = 2.2; // how close wrist must be to pad center (× pad radius)

// Stick drawing
const STICK_WIDTH = 5;

// ─── Song Library ───────────────────────────────────────────

// Notes use [beat, drum, hand] format. Beat is absolute position.
// Each bar = 8 beat positions (eighth notes in 4/4 time).
// tempo = eighth-note BPM (double the quarter-note BPM).
// spotifyId is used to auto-load the Spotify player for real songs.
const SONG_LIBRARY = {
    // ── Real Songs ──────────────────────────────────────────
    billie_jean: {
        title: "Billie Jean",
        composer: "Michael Jackson",
        spotifyId: "5ChkMS8OtDnJGX3cRussID",
        prompt: "Classic disco-pop groove. Steady hi-hat, snare on 2 & 4, kick on 1 & 3.",
        tempo: 234,   // 117 BPM quarter note
        totalBeats: 32,
        notes: [
            // 4 bars of the iconic groove
            ...[0, 8, 16, 24].flatMap((b) => [
                [b+0, "hihat", "L"], [b+0, "floor", "R"],
                [b+1, "hihat", "L"],
                [b+2, "hihat", "L"], [b+2, "snare", "L"],
                [b+3, "hihat", "L"],
                [b+4, "hihat", "L"], [b+4, "floor", "R"],
                [b+5, "hihat", "L"],
                [b+6, "hihat", "L"], [b+6, "snare", "L"],
                [b+7, "hihat", "L"],
            ]),
        ]
    },
    back_in_black: {
        title: "Back in Black",
        composer: "AC/DC",
        spotifyId: "08mG3Y1vljYA6bvDt4Wqkj",
        prompt: "Hard rock groove. Double kick on beat 1, snare on 2 & 4. Hit it hard!",
        tempo: 192,   // 96 BPM quarter note
        totalBeats: 32,
        notes: [
            // 4 bars — double kick on 1, snare on 2 & 4
            ...[0, 8, 16, 24].flatMap((b) => [
                [b+0, "hihat", "L"], [b+0, "floor", "R"],
                [b+1, "hihat", "L"], [b+1, "floor", "R"],
                [b+2, "hihat", "L"], [b+2, "snare", "L"],
                [b+3, "hihat", "L"],
                [b+4, "hihat", "L"], [b+4, "floor", "R"],
                [b+5, "hihat", "L"],
                [b+6, "hihat", "L"], [b+6, "snare", "L"],
                [b+7, "hihat", "L"],
            ]),
        ]
    },
    stay_with_me: {
        title: "Stay With Me",
        composer: "Sam Smith",
        spotifyId: "5Nm9ERjJZ5oyfXZTECKmRt",
        prompt: "Simple and soulful. Quarter-note hi-hat, kick on 1 & 3, snare on 2 & 4. Nice and easy.",
        tempo: 168,   // 84 BPM quarter note
        totalBeats: 32,
        notes: [
            // 4 bars — quarter note hi-hat (positions 0, 2, 4, 6), simple kick & snare
            ...[0, 8, 16, 24].flatMap((b) => [
                [b+0, "hihat", "L"], [b+0, "floor", "R"],
                [b+2, "hihat", "L"], [b+2, "snare", "L"],
                [b+4, "hihat", "L"], [b+4, "floor", "R"],
                [b+6, "hihat", "L"], [b+6, "snare", "L"],
            ]),
        ]
    },
    seven_nation_army: {
        title: "Seven Nation Army",
        composer: "The White Stripes",
        spotifyId: "7i2DJ88J4SnCmeTFcLMmQV",
        prompt: "Meg White's raw, simple power. Crash on 1, snare on 2 & 4. Keep it primal!",
        tempo: 248,   // 124 BPM quarter note
        totalBeats: 32,
        notes: [
            // 4 bars — Meg White's minimalist style
            ...[0, 8, 16, 24].flatMap((b) => [
                [b+0, "floor", "R"], [b+0, "crash", "R"],
                [b+2, "snare", "L"],
                [b+4, "floor", "R"],
                [b+6, "snare", "L"],
            ]),
        ]
    },

    // ── Practice Patterns ───────────────────────────────────
    basic_rock: {
        title: "Basic Rock",
        composer: "Practice pattern",
        prompt: "Swing your hands down onto the drum pads. Follow the colored highlights on the kit!",
        tempo: 100,
        totalBeats: 32,
        notes: [
            ...[0, 8, 16].flatMap((bar) => [
                [bar + 0, "hihat", "L"], [bar + 0, "floor", "R"],
                [bar + 1, "hihat", "L"],
                [bar + 2, "snare", "L"], [bar + 2, "hihat", "L"],
                [bar + 3, "hihat", "L"],
                [bar + 4, "hihat", "L"], [bar + 4, "floor", "R"],
                [bar + 5, "hihat", "L"],
                [bar + 6, "snare", "L"], [bar + 6, "hihat", "L"],
                [bar + 7, "hihat", "L"],
            ]),
            [24, "hihat", "L"], [24, "floor", "R"],
            [25, "hihat", "L"],
            [26, "snare", "L"], [26.5, "snare", "L"],
            [27, "tom", "R"], [27.5, "tom", "R"],
            [28, "floor", "R"],
            [30, "crash", "R"],
        ]
    },
    half_time: {
        title: "Half-Time Groove",
        composer: "Practice pattern",
        prompt: "Slow and heavy. Big space between the hits. Let them breathe.",
        tempo: 80,
        totalBeats: 32,
        notes: [
            ...[0, 8, 16].flatMap((bar) => [
                [bar + 0, "floor", "R"], [bar + 0, "hihat", "L"],
                [bar + 2, "hihat", "L"],
                [bar + 4, "snare", "L"], [bar + 4, "hihat", "L"],
                [bar + 6, "hihat", "L"],
            ]),
            [24, "floor", "R"],
            [26, "snare", "L"], [27, "snare", "L"],
            [28, "tom", "R"], [29, "tom", "R"],
            [30, "floor", "R"],
            [31, "crash", "R"],
        ]
    },
};

// ─── DOM ────────────────────────────────────────────────────

const elements = {
    songSelect: document.getElementById("songSelect"),
    bootButton: document.getElementById("bootButton"),
    countdownOverlay: document.getElementById("countdownOverlay"),
    trackingOverlay: document.getElementById("trackingOverlay"),
    hitCanvas: document.getElementById("hitCanvas"),
    video: document.getElementById("video"),
    cameraStatus: document.getElementById("cameraStatus"),
    railViewport: document.getElementById("railViewport"),
    railTrack: document.getElementById("railTrack"),
    setupModal: document.getElementById("setupModal"),
    setupYes: document.getElementById("setupYes"),
    setupNo: document.getElementById("setupNo"),
    calibrationOverlay: document.getElementById("calibrationOverlay"),
    calibrationDone: document.getElementById("calibrationDone"),
    resetSetupBtn: document.getElementById("resetSetupBtn"),
    spotifyDock: document.getElementById("spotifyDock"),
    spotifyPlayer: document.getElementById("spotifyPlayer"),
    spotifyClose: document.getElementById("spotifyClose")
};

const trackingCtx = elements.trackingOverlay.getContext("2d");
const hitCtx = elements.hitCanvas.getContext("2d");

// ─── State ──────────────────────────────────────────────────

const state = {
    booted: false,
    booting: false,
    detector: null,
    stream: null,
    poseAvailable: false,
    cameraError: "",
    poseLoopActive: false,
    renderLoopActive: false,
    lastPoseSampleAt: 0,
    lastFrameAt: performance.now(),
    transportBeat: 0,
    isPlaying: false,
    startedAt: 0,
    lastBeatTick: -1,
    countdownToken: 0,
    countdownActive: false,
    selectedSongId: "billie_jean",
    currentPiece: null,
    pose: {
        points: {},
        lastPoseAt: 0,
        trackingConfidence: 0,
        leftWristHistory: [],
        rightWristHistory: [],
        leftStrikeVelocity: 0,
        rightStrikeVelocity: 0,
        leftLastStrikeAt: 0,
        rightLastStrikeAt: 0
    },
    audio: null,
    hitEffects: [],       // expanding ring ripples on drum pads
    padGlows: {},         // per-drum glow intensity (0-1), decays over time
    activeTargetDrum: null // which drum the rail is asking for right now
};

// ─── Audio Engine ───────────────────────────────────────────

class DrumAudioEngine {
    constructor() {
        this.ctx = null;
        this.master = null;
        this.ready = false;
        this.noiseBuffer = null;
    }

    async init() {
        if (this.ready) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();

        this.master = this.ctx.createGain();
        this.master.gain.value = 0.88;

        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -12;
        this.compressor.knee.value = 6;
        this.compressor.ratio.value = 4;
        this.compressor.attack.value = 0.002;
        this.compressor.release.value = 0.1;

        this.master.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);

        this.noiseBuffer = this._noise();
        this.ready = true;
    }

    _noise() {
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        return buf;
    }

    async resume() {
        if (this.ctx && this.ctx.state !== "running") await this.ctx.resume();
    }

    playDrum(drum, velocity = 0.8) {
        if (!this.ready) return;
        const v = clamp(velocity, 0.3, 1.0);
        switch (drum) {
            case "snare": this._snare(v); break;
            case "hihat": this._hihat(v); break;
            case "tom": this._tom(v, 200); break;
            case "crash": this._crash(v); break;
            case "floor": this._tom(v, 120); break;
        }
    }

    _snare(v) {
        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        const og = this.ctx.createGain();
        o.type = "triangle";
        o.frequency.setValueAtTime(220, t);
        o.frequency.exponentialRampToValueAtTime(120, t + 0.06);
        og.gain.setValueAtTime(v * 0.45, t);
        og.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        o.connect(og); og.connect(this.master);
        o.start(t); o.stop(t + 0.15);

        const n = this.ctx.createBufferSource();
        n.buffer = this.noiseBuffer;
        const ng = this.ctx.createGain();
        const nf = this.ctx.createBiquadFilter();
        nf.type = "highpass"; nf.frequency.value = 3000;
        ng.gain.setValueAtTime(v * 0.38, t);
        ng.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        n.connect(nf); nf.connect(ng); ng.connect(this.master);
        n.start(t); n.stop(t + 0.2);
    }

    _hihat(v) {
        const t = this.ctx.currentTime;
        const n = this.ctx.createBufferSource();
        n.buffer = this.noiseBuffer;
        const g = this.ctx.createGain();
        const f = this.ctx.createBiquadFilter();
        f.type = "bandpass"; f.frequency.value = 8000; f.Q.value = 1.2;
        g.gain.setValueAtTime(v * 0.28, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        n.connect(f); f.connect(g); g.connect(this.master);
        n.start(t); n.stop(t + 0.1);
    }

    _tom(v, freq) {
        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(freq * 1.4, t);
        o.frequency.exponentialRampToValueAtTime(freq, t + 0.06);
        g.gain.setValueAtTime(v * 0.55, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        o.connect(g); g.connect(this.master);
        o.start(t); o.stop(t + 0.35);

        const o2 = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();
        o2.type = "triangle";
        o2.frequency.setValueAtTime(freq * 2.2, t);
        o2.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.04);
        g2.gain.setValueAtTime(v * 0.12, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        o2.connect(g2); g2.connect(this.master);
        o2.start(t); o2.stop(t + 0.18);
    }

    _crash(v) {
        const t = this.ctx.currentTime;
        const n = this.ctx.createBufferSource();
        n.buffer = this.noiseBuffer;
        const g = this.ctx.createGain();
        const f = this.ctx.createBiquadFilter();
        f.type = "bandpass"; f.frequency.value = 5500; f.Q.value = 0.4;
        g.gain.setValueAtTime(v * 0.32, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        n.connect(f); f.connect(g); g.connect(this.master);
        n.start(t); n.stop(t + 0.85);

        const o = this.ctx.createOscillator();
        const og = this.ctx.createGain();
        o.type = "sine"; o.frequency.value = 420;
        og.gain.setValueAtTime(v * 0.06, t);
        og.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        o.connect(og); og.connect(this.master);
        o.start(t); o.stop(t + 0.55);
    }

    tick(isDownbeat) {
        if (!this.ready) return;
        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = isDownbeat ? 1200 : 880;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(isDownbeat ? 0.03 : 0.018, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
        o.connect(g); g.connect(this.master);
        o.start(t); o.stop(t + 0.08);
    }
}

// ─── Utilities ──────────────────────────────────────────────

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

// ─── Coordinate helpers ─────────────────────────────────────
// Video coords → screen coords (mirrored, cover-fit)

function videoToScreen(point, cw, ch) {
    const vw = elements.video.videoWidth || 1;
    const vh = elements.video.videoHeight || 1;
    const scale = Math.max(cw / vw, ch / vh);
    const rw = vw * scale;
    const rh = vh * scale;
    const ox = (cw - rw) / 2;
    const oy = (ch - rh) / 2;
    return { x: cw - (point.x * scale + ox), y: point.y * scale + oy };
}

// Drum pad screen position (fractional → pixels)
function padScreen(pad, cw, ch) {
    return { x: pad.x * cw, y: pad.y * ch };
}
function padRadiusPx(pad, cw, ch) {
    return pad.radius * Math.min(cw, ch);
}

// ─── Piece / Rail Logic ─────────────────────────────────────

function createPiece(songId) {
    const song = SONG_LIBRARY[songId];
    // Notes are [beat, drum, hand]. Sort by beat, then compute duration as
    // gap to next note on the same drum (or 1 beat, whichever is smaller).
    const sorted = song.notes.slice().sort((a, b) => a[0] - b[0]);
    const events = sorted.map(([beat, drum, hand], i) => {
        // Find next note on the same drum to derive duration
        let duration = 1;
        for (let j = i + 1; j < sorted.length; j++) {
            if (sorted[j][1] === drum) {
                duration = Math.min(sorted[j][0] - beat, 1);
                break;
            }
        }
        // Clamp to end of piece
        duration = Math.min(duration, song.totalBeats - beat);
        return {
            id: `${songId}-${i}`, drum, hand, duration,
            startBeat: beat, endBeat: beat + duration,
            lane: DRUM_LANES[drum], coverage: 0, hit: false, element: null
        };
    });
    return {
        id: songId, title: song.title, composer: song.composer,
        prompt: song.prompt, tempo: song.tempo, totalBeats: song.totalBeats, events
    };
}

// Returns ALL events active at current transport beat (supports simultaneous notes)
function getActiveEvents() {
    if (!state.currentPiece) return [];
    return state.currentPiece.events.filter(
        (e) => state.transportBeat >= e.startBeat && state.transportBeat < e.endBeat
    );
}

// Returns the first un-hit active event (for coaching display)
function getActiveEvent() {
    const active = getActiveEvents();
    return active.find((e) => !e.hit) || active[0] || null;
}

function buildSongSelect() {
    elements.songSelect.innerHTML = "";

    // Real songs first
    const songGroup = document.createElement("optgroup");
    songGroup.label = "Songs";
    const practiceGroup = document.createElement("optgroup");
    practiceGroup.label = "Practice";

    Object.entries(SONG_LIBRARY).forEach(([id, song]) => {
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = song.spotifyId
            ? `${song.title} — ${song.composer}`
            : song.title;
        if (song.spotifyId) {
            songGroup.appendChild(opt);
        } else {
            practiceGroup.appendChild(opt);
        }
    });

    elements.songSelect.appendChild(songGroup);
    elements.songSelect.appendChild(practiceGroup);
}

function setTransportBeat(b) {
    state.transportBeat = clamp(b, 0, state.currentPiece.totalBeats);
}

function applySong(songId) {
    state.selectedSongId = songId;
    state.currentPiece = createPiece(songId);
    state.tempo = state.currentPiece.tempo;
    elements.songSelect.value = songId;
    resetPerformanceState();
    buildRail();

    // Auto-load Spotify for real songs
    const song = SONG_LIBRARY[songId];
    if (song.spotifyId) {
        elements.spotifyPlayer.innerHTML =
            `<iframe src="https://open.spotify.com/embed/track/${song.spotifyId}?utm_source=generator&theme=0" ` +
            `width="100%" height="152" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" ` +
            `loading="lazy"></iframe>`;
        elements.spotifyDock.classList.remove("hidden");
    } else {
        elements.spotifyPlayer.innerHTML = "";
        elements.spotifyDock.classList.add("hidden");
    }
}

function resetPerformanceState() {
    if (!state.currentPiece) return;
    cancelCountdown();
    state.isPlaying = false;
    state.startedAt = 0;
    state.lastBeatTick = -1;
    setTransportBeat(0);
    state.currentPiece.events.forEach((e) => { e.coverage = 0; e.hit = false; });
    state.padGlows = {};
    updateRail();
}

function buildRail() {
    elements.railTrack.innerHTML = "";
    const piece = state.currentPiece;
    const width = piece.totalBeats * RAIL_BEAT_WIDTH + 320;
    elements.railTrack.style.width = `${width}px`;
    const lanes = 5;

    piece.events.forEach((ev) => {
        const block = document.createElement("div");
        const yRatio = (lanes - 1 - ev.lane) / (lanes - 1);
        const top = RAIL_MIN_Y + yRatio * (RAIL_MAX_Y - RAIL_MIN_Y);
        const w = Math.max(48, ev.duration * RAIL_BEAT_WIDTH - 10);
        block.className = "note-block";
        block.style.setProperty("--note-color", DRUM_COLORS[ev.drum]);
        block.style.left = `${ev.startBeat * RAIL_BEAT_WIDTH + 160}px`;
        block.style.top = `${top}px`;
        block.style.width = `${w}px`;
        block.innerHTML = `<span class="note-block__name">${DRUM_LABELS[ev.drum]}</span><span class="note-block__hand">${ev.hand === "any" ? "either" : ev.hand}</span>`;
        ev.element = block;
        elements.railTrack.appendChild(block);
    });
}

function updateRail() {
    // Read the playhead's actual CSS left offset to stay in sync across breakpoints
    const playhead = elements.railViewport.querySelector(".playhead");
    const playheadPct = playhead ? parseFloat(getComputedStyle(playhead).left) / elements.railViewport.clientWidth : 0.29;
    const off = elements.railViewport.clientWidth * playheadPct;
    const tx = off - (state.transportBeat * RAIL_BEAT_WIDTH + 160);
    elements.railTrack.style.transform = `translateX(${tx}px)`;

    state.currentPiece.events.forEach((ev) => {
        if (!ev.element) return;
        ev.element.style.setProperty("--fill", ev.coverage.toFixed(3));
        ev.element.classList.toggle("active", state.transportBeat >= ev.startBeat && state.transportBeat < ev.endBeat);
        ev.element.classList.toggle("done", state.transportBeat >= ev.endBeat);
    });
}

// ─── Camera & Pose ──────────────────────────────────────────

async function setupCamera() {
    // If camera was already opened during calibration, skip
    if (state.stream && elements.video.srcObject) {
        syncOverlay();
        return;
    }
    state.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
    });
    elements.video.srcObject = state.stream;
    await new Promise((resolve) => {
        elements.video.onloadedmetadata = () => { elements.video.play(); syncOverlay(); resolve(); };
    });
}

async function setupDetector() {
    const { tf, poseDetection } = window;
    await tf.setBackend("webgl"); await tf.ready();
    state.detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
    );
}

function syncOverlay() {
    const w = elements.video.videoWidth || elements.video.clientWidth;
    const h = elements.video.videoHeight || elements.video.clientHeight;
    if (!w || !h) return;
    if (elements.trackingOverlay.width !== w) elements.trackingOverlay.width = w;
    if (elements.trackingOverlay.height !== h) elements.trackingOverlay.height = h;
}

function blendPoint(prev, next) {
    if (!next) return prev ? { ...prev, score: prev.score * 0.88 } : null;
    if (!prev) return { ...next };
    return { x: lerp(prev.x, next.x, 0.4), y: lerp(prev.y, next.y, 0.4), score: lerp(prev.score, next.score, 0.48) };
}

function extractKeypoints(pose) {
    const m = {};
    (pose?.keypoints || []).forEach((kp) => {
        const k = kp.name || kp.part;
        if (k && kp.score > 0.18) m[k] = { x: kp.x, y: kp.y, score: kp.score };
    });
    return m;
}

// ─── Strike & Hit Detection ────────────────────────────────

function detectStrike(history) {
    if (history.length < 3) return { velocity: 0, struck: false };
    const recent = history.slice(-3);
    let dy = 0, dt = 0;
    for (let i = 1; i < recent.length; i++) {
        dy += recent[i].y - recent[i - 1].y;
        dt += (recent[i].t - recent[i - 1].t) / 1000;
    }
    if (dt < 0.001) return { velocity: 0, struck: false };
    const v = (dy / dt) / 200;
    return { velocity: v, struck: v > STRIKE_VELOCITY_THRESHOLD };
}

function findNearestPad(screenPoint, cw, ch) {
    let best = null, bestDist = Infinity;
    DRUM_KIT.forEach((pad) => {
        const ps = padScreen(pad, cw, ch);
        const pr = padRadiusPx(pad, cw, ch) * HIT_RADIUS_MULTIPLIER;
        const d = dist(screenPoint, ps);
        if (d < pr && d < bestDist) { best = pad; bestDist = d; }
    });
    return best;
}

// Compute the stick tip in screen coords: extends from wrist in the
// elbow→wrist direction by the forearm length (same as the drawn stick).
function stickTipScreen(elbowVideo, wristVideo, cw, ch) {
    const elbow = videoToScreen(elbowVideo, cw, ch);
    const wrist = videoToScreen(wristVideo, cw, ch);
    const dx = wrist.x - elbow.x;
    const dy = wrist.y - elbow.y;
    const len = Math.hypot(dx, dy);
    if (len < 1) return wrist;
    return { x: wrist.x + (dx / len) * len, y: wrist.y + (dy / len) * len };
}

function handleStrike(hand, drum, velocity) {
    // Always play the sound and show the visual, even outside playback
    state.audio?.playDrum(drum, velocity);

    // Pad glow
    state.padGlows[drum] = 1.0;

    // Ripple effect centered on the pad
    const pad = DRUM_KIT.find((p) => p.name === drum);
    if (pad) {
        const cw = elements.hitCanvas.clientWidth || window.innerWidth;
        const ch = elements.hitCanvas.clientHeight || window.innerHeight;
        const ps = padScreen(pad, cw, ch);
        state.hitEffects.push({
            x: ps.x, y: ps.y, t: performance.now(),
            drum, velocity, duration: 450
        });
    }

    // Only score against the rail while actually playing (fix: no pre-start scoring)
    if (!state.isPlaying) return;

    // Check all active events for a matching drum + hand
    const active = getActiveEvents();
    for (const event of active) {
        if (event.hit) continue;
        if (event.drum !== drum) continue;
        // Enforce hand: "L" requires left, "R" requires right, "any" accepts either
        if (event.hand === "L" && hand !== "left") continue;
        if (event.hand === "R" && hand !== "right") continue;
        event.hit = true;
        event.coverage = 1;
        break;  // only score one event per strike
    }
}

function processPose(poses) {
    const pose = poses[0];
    const named = extractKeypoints(pose);
    const tracked = ["nose", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist"];
    tracked.forEach((n) => { state.pose.points[n] = blendPoint(state.pose.points[n], named[n] || null); });

    const ls = state.pose.points.left_shoulder;
    const rs = state.pose.points.right_shoulder;
    const lw = state.pose.points.left_wrist;
    const rw = state.pose.points.right_wrist;
    const now = performance.now();
    state.pose.lastPoseAt = now;

    if (!(ls && rs)) { state.pose.trackingConfidence = 0; return; }

    state.pose.trackingConfidence = [ls, rs, lw, rw].filter(Boolean).reduce((s, p) => s + p.score, 0) / 4;

    const cw = elements.hitCanvas.clientWidth || window.innerWidth;
    const ch = elements.hitCanvas.clientHeight || window.innerHeight;
    const le = state.pose.points.left_elbow;
    const re = state.pose.points.right_elbow;

    // Left hand — use stick tip (not wrist) for pad collision
    if (lw) {
        state.pose.leftWristHistory.push({ x: lw.x, y: lw.y, t: now });
        if (state.pose.leftWristHistory.length > 8) state.pose.leftWristHistory.shift();

        const strike = detectStrike(state.pose.leftWristHistory);
        state.pose.leftStrikeVelocity = strike.velocity;
        if (strike.struck && now - state.pose.leftLastStrikeAt > STRIKE_COOLDOWN_MS) {
            const tip = le ? stickTipScreen(le, lw, cw, ch) : videoToScreen(lw, cw, ch);
            const pad = findNearestPad(tip, cw, ch);
            if (pad) {
                state.pose.leftLastStrikeAt = now;
                handleStrike("left", pad.name, clamp(strike.velocity / 4, 0.4, 1.0));
            }
        }
    }

    // Right hand — use stick tip for pad collision
    if (rw) {
        state.pose.rightWristHistory.push({ x: rw.x, y: rw.y, t: now });
        if (state.pose.rightWristHistory.length > 8) state.pose.rightWristHistory.shift();

        const strike = detectStrike(state.pose.rightWristHistory);
        state.pose.rightStrikeVelocity = strike.velocity;
        if (strike.struck && now - state.pose.rightLastStrikeAt > STRIKE_COOLDOWN_MS) {
            const tip = re ? stickTipScreen(re, rw, cw, ch) : videoToScreen(rw, cw, ch);
            const pad = findNearestPad(tip, cw, ch);
            if (pad) {
                state.pose.rightLastStrikeAt = now;
                handleStrike("right", pad.name, clamp(strike.velocity / 4, 0.4, 1.0));
            }
        }
    }
}

async function poseLoop() {
    if (!state.poseLoopActive) return;
    const now = performance.now();
    if (state.detector && elements.video.readyState >= 2 && now - state.lastPoseSampleAt >= POSE_SAMPLE_MS) {
        state.lastPoseSampleAt = now;
        try {
            const poses = await state.detector.estimatePoses(elements.video, { maxPoses: 1, flipHorizontal: false });
            processPose(poses);
        } catch (e) { console.error("Pose failed", e); }
    }
    window.requestAnimationFrame(poseLoop);
}

// ─── Drawing ────────────────────────────────────────────────

function drawDrumKit(cw, ch) {
    const activeEvents = getActiveEvents();
    const targetDrums = new Set(activeEvents.filter((e) => !e.hit).map((e) => e.drum));
    const now = performance.now();

    DRUM_KIT.forEach((pad) => {
        const ps = padScreen(pad, cw, ch);
        const pr = padRadiusPx(pad, cw, ch);
        const isTarget = targetDrums.has(pad.name) && state.isPlaying;
        const glow = state.padGlows[pad.name] || 0;

        // Outer ring
        hitCtx.beginPath();
        hitCtx.arc(ps.x, ps.y, pr, 0, Math.PI * 2);
        hitCtx.strokeStyle = pad.color;
        hitCtx.lineWidth = isTarget ? 3.5 : 2;
        hitCtx.globalAlpha = isTarget ? 0.8 : 0.35;
        hitCtx.stroke();

        // Fill with glow on hit
        if (glow > 0.01) {
            hitCtx.beginPath();
            hitCtx.arc(ps.x, ps.y, pr, 0, Math.PI * 2);
            hitCtx.fillStyle = pad.color;
            hitCtx.globalAlpha = glow * 0.45;
            hitCtx.fill();
        }

        // Target highlight pulse
        if (isTarget) {
            const pulse = 0.5 + 0.5 * Math.sin(now / 120);
            hitCtx.beginPath();
            hitCtx.arc(ps.x, ps.y, pr + 6, 0, Math.PI * 2);
            hitCtx.strokeStyle = pad.color;
            hitCtx.lineWidth = 2;
            hitCtx.globalAlpha = 0.25 + pulse * 0.2;
            hitCtx.stroke();
        }

        hitCtx.globalAlpha = 1;

        // Label
        hitCtx.fillStyle = pad.color;
        hitCtx.globalAlpha = isTarget ? 0.9 : 0.5;
        hitCtx.font = `600 ${Math.round(pr * 0.42)}px "Alegreya Sans", sans-serif`;
        hitCtx.textAlign = "center";
        hitCtx.textBaseline = "middle";
        hitCtx.fillText(pad.label, ps.x, ps.y);
        hitCtx.globalAlpha = 1;
    });
}

function drawStick(elbowVideo, wristVideo, cw, ch, color) {
    const elbow = videoToScreen(elbowVideo, cw, ch);
    const wrist = videoToScreen(wristVideo, cw, ch);

    // Direction from elbow to wrist
    const dx = wrist.x - elbow.x;
    const dy = wrist.y - elbow.y;
    const forearmLen = Math.hypot(dx, dy);
    if (forearmLen < 1) return;

    // Stick starts at the wrist (hand grips here) and extends
    // in the elbow→wrist direction by the same length as the forearm
    const nx = dx / forearmLen;
    const ny = dy / forearmLen;
    const tipX = wrist.x + nx * forearmLen;
    const tipY = wrist.y + ny * forearmLen;

    // Shaft: wrist → tip
    hitCtx.beginPath();
    hitCtx.moveTo(wrist.x, wrist.y);
    hitCtx.lineTo(tipX, tipY);
    hitCtx.strokeStyle = color;
    hitCtx.lineWidth = STICK_WIDTH;
    hitCtx.lineCap = "round";
    hitCtx.globalAlpha = 0.85;
    hitCtx.stroke();

    // Tip ball
    hitCtx.beginPath();
    hitCtx.arc(tipX, tipY, STICK_WIDTH * 1.2, 0, Math.PI * 2);
    hitCtx.fillStyle = "#fff";
    hitCtx.globalAlpha = 0.9;
    hitCtx.fill();

    // Grip dot at wrist
    hitCtx.beginPath();
    hitCtx.arc(wrist.x, wrist.y, 5, 0, Math.PI * 2);
    hitCtx.fillStyle = color;
    hitCtx.globalAlpha = 0.7;
    hitCtx.fill();

    hitCtx.globalAlpha = 1;
}

function drawHitEffects(cw, ch) {
    const now = performance.now();
    state.hitEffects = state.hitEffects.filter((fx) => now - fx.t < fx.duration);

    state.hitEffects.forEach((fx) => {
        const progress = (now - fx.t) / fx.duration;
        const alpha = 1 - progress;
        const radius = 20 + progress * 60 * fx.velocity;
        const color = DRUM_COLORS[fx.drum] || "#fff";

        hitCtx.beginPath();
        hitCtx.arc(fx.x, fx.y, radius, 0, Math.PI * 2);
        hitCtx.strokeStyle = color;
        hitCtx.globalAlpha = alpha * 0.7;
        hitCtx.lineWidth = 3;
        hitCtx.stroke();

        hitCtx.beginPath();
        hitCtx.arc(fx.x, fx.y, radius * 0.3, 0, Math.PI * 2);
        hitCtx.fillStyle = color;
        hitCtx.globalAlpha = alpha * 0.4;
        hitCtx.fill();

        hitCtx.globalAlpha = 1;
    });
}

function drawScene() {
    const cw = elements.hitCanvas.clientWidth;
    const ch = elements.hitCanvas.clientHeight;
    if (elements.hitCanvas.width !== cw) elements.hitCanvas.width = cw;
    if (elements.hitCanvas.height !== ch) elements.hitCanvas.height = ch;
    hitCtx.clearRect(0, 0, cw, ch);

    // Decay pad glows
    Object.keys(state.padGlows).forEach((k) => {
        state.padGlows[k] *= 0.88;
        if (state.padGlows[k] < 0.01) state.padGlows[k] = 0;
    });

    drawDrumKit(cw, ch);
    drawHitEffects(cw, ch);

    // Draw sticks
    if (state.poseAvailable && state.pose.trackingConfidence > 0.2) {
        const le = state.pose.points.left_elbow;
        const lw = state.pose.points.left_wrist;
        const re = state.pose.points.right_elbow;
        const rw = state.pose.points.right_wrist;
        if (le && lw) drawStick(le, lw, cw, ch, "#d1b06a");
        if (re && rw) drawStick(re, rw, cw, ch, "#6ab5d1");
    }

    // Tracking overlay (just wrist dots)
    syncOverlay();
    const { width, height } = elements.trackingOverlay;
    trackingCtx.clearRect(0, 0, width, height);
}

// ─── Transport & Performance ────────────────────────────────

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function cancelCountdown() {
    state.countdownToken += 1;
    state.countdownActive = false;
    elements.countdownOverlay.textContent = "";
    elements.countdownOverlay.classList.add("hidden");
}

async function runCountdown(seconds = 3) {
    const token = ++state.countdownToken;
    state.countdownActive = true;
    elements.countdownOverlay.classList.remove("hidden");
    for (let c = seconds; c >= 1; c--) {
        if (token !== state.countdownToken) return false;
        elements.countdownOverlay.textContent = String(c);
        elements.cameraStatus.textContent = `Starting in ${c}...`;
        state.audio?.tick(c === 1);
        await sleep(700);
    }
    if (token !== state.countdownToken) return false;
    elements.countdownOverlay.textContent = "Play";
    elements.cameraStatus.textContent = "Strike downward to hit the drums!";
    await sleep(260);
    if (token !== state.countdownToken) return false;
    state.countdownActive = false;
    elements.countdownOverlay.textContent = "";
    elements.countdownOverlay.classList.add("hidden");
    return true;
}

function updateCoaching(event) {
    if (!state.booted) {
        elements.cameraStatus.textContent = "Press Start once to allow camera and sound.";
        return;
    }
    if (state.booting || state.countdownActive) return;

    if (!state.poseAvailable) {
        elements.cameraStatus.textContent = event
            ? "Camera unavailable. Guided playback running without pose tracking."
            : "Camera unavailable. Change the beat any time.";
        return;
    }

    if (state.pose.trackingConfidence < 0.22) {
        elements.cameraStatus.textContent = "Step back until both shoulders and wrists are visible.";
        return;
    }

    if (!event || !state.isPlaying) {
        elements.cameraStatus.textContent = "Listening for your strikes. Change the beat any time.";
        return;
    }

    if (event.hit) {
        elements.cameraStatus.textContent = state.currentPiece.prompt;
    } else {
        const hand = event.hand === "L" ? "left" : event.hand === "R" ? "right" : "either";
        elements.cameraStatus.textContent = `${DRUM_LABELS[event.drum]} with ${hand} hand!`;
    }
}

function stepPerformance(now) {
    const dt = Math.min(0.05, (now - state.lastFrameAt) / 1000);
    state.lastFrameAt = now;

    if (state.isPlaying) {
        const msPerBeat = 60000 / state.tempo;
        setTransportBeat((now - state.startedAt) / msPerBeat);

        if (state.transportBeat >= state.currentPiece.totalBeats) {
            resetLoop(now);
        } else {
            const beat = Math.floor(state.transportBeat);
            if (beat !== state.lastBeatTick) {
                state.audio?.tick(beat % 4 === 0);
                state.lastBeatTick = beat;
            }
        }
    }

    const activeEvents = getActiveEvents();
    const event = activeEvents.find((e) => !e.hit) || activeEvents[0] || null;

    // Auto-play for non-pose mode: trigger every active unhit event
    // Uses beat-based check instead of a time window, so notes can't be skipped
    if (state.isPlaying && !state.poseAvailable) {
        for (const ev of activeEvents) {
            if (!ev.hit) {
                ev.hit = true;
                ev.coverage = 1;
                state.audio?.playDrum(ev.drum, 0.7);
                state.padGlows[ev.drum] = 1.0;
            }
        }
    }

    for (const ev of activeEvents) {
        if (ev.hit) ev.coverage = 1;
    }

    drawScene();
    updateRail();
    updateCoaching(event);
}

function renderLoop(now) {
    stepPerformance(now);
    window.requestAnimationFrame(renderLoop);
}

function resetLoop(now = performance.now()) {
    state.currentPiece.events.forEach((e) => { e.coverage = 0; e.hit = false; });
    setTransportBeat(0);
    state.startedAt = now;
    state.lastBeatTick = -1;
}

// ─── Setup & Calibration ───────────────────────────────────

function loadSavedPositions() {
    try {
        const saved = localStorage.getItem("drumPositions");
        if (saved) {
            const positions = JSON.parse(saved);
            positions.forEach(pos => {
                const pad = DRUM_KIT.find(d => d.name === pos.name);
                if (pad) { pad.x = pos.x; pad.y = pos.y; }
            });
            return true;
        }
    } catch (e) { /* ignore */ }
    return false;
}

function savePositions() {
    const positions = DRUM_KIT.map(d => ({ name: d.name, x: d.x, y: d.y }));
    localStorage.setItem("drumPositions", JSON.stringify(positions));
}

function hideSetupModal() {
    elements.setupModal.classList.add("hidden");
    elements.bootButton.classList.remove("hidden");
    elements.resetSetupBtn.classList.remove("hidden");
}

function showSetupModal() {
    // Stop playback and reset state
    cancelCountdown();
    state.isPlaying = false;
    state.booted = false;
    state.booting = false;

    // Stop camera if running
    if (state.stream) {
        state.stream.getTracks().forEach(t => t.stop());
        state.stream = null;
        elements.video.srcObject = null;
    }
    state.poseAvailable = false;
    state.poseLoopActive = false;

    // Reset drum positions to defaults
    DEFAULT_KIT_POSITIONS.forEach(def => {
        const pad = DRUM_KIT.find(d => d.name === def.name);
        if (pad) { pad.x = def.x; pad.y = def.y; }
    });
    localStorage.removeItem("drumPositions");

    // Show modal, hide everything else
    elements.setupModal.classList.remove("hidden");
    elements.bootButton.classList.add("hidden");
    elements.resetSetupBtn.classList.add("hidden");
    elements.bootButton.disabled = false;
    elements.cameraStatus.textContent = "Press Start once to allow camera and sound.";
}

async function startCalibration() {
    // First open camera so user can see their kit
    elements.setupModal.classList.add("hidden");
    elements.cameraStatus.textContent = "Opening camera for calibration...";

    try {
        state.stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        });
        elements.video.srcObject = state.stream;
        await new Promise((resolve) => {
            elements.video.onloadedmetadata = () => { elements.video.play(); syncOverlay(); resolve(); };
        });
    } catch (e) {
        elements.cameraStatus.textContent = "Camera unavailable. Using default positions.";
        hideSetupModal();
        elements.bootButton.classList.remove("hidden");
        return;
    }

    elements.cameraStatus.textContent = "";
    elements.calibrationOverlay.classList.remove("hidden");

    // Create draggable pads
    const container = elements.calibrationOverlay;
    const cw = window.innerWidth;
    const ch = window.innerHeight;

    DRUM_KIT.forEach(pad => {
        const el = document.createElement("div");
        el.className = "calibration-pad";
        el.dataset.drum = pad.name;
        const r = pad.radius * Math.min(cw, ch);
        el.style.width = `${r * 2}px`;
        el.style.height = `${r * 2}px`;
        el.style.borderColor = pad.color;
        el.style.background = `${pad.color}22`;
        el.style.left = `${pad.x * cw - r}px`;
        el.style.top = `${pad.y * ch - r}px`;
        el.innerHTML = `<span class="cal-label" style="color:${pad.color}">${pad.label}</span>`;

        // Drag handling
        let dragging = false, offsetX = 0, offsetY = 0;

        const onStart = (ex, ey) => {
            dragging = true;
            const rect = el.getBoundingClientRect();
            offsetX = ex - rect.left;
            offsetY = ey - rect.top;
            el.style.boxShadow = `0 0 20px ${pad.color}66`;
        };

        const onMove = (ex, ey) => {
            if (!dragging) return;
            el.style.left = `${ex - offsetX}px`;
            el.style.top = `${ey - offsetY}px`;
        };

        const onEnd = () => {
            if (!dragging) return;
            dragging = false;
            el.style.boxShadow = "";
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            pad.x = cx / window.innerWidth;
            pad.y = cy / window.innerHeight;
        };

        el.addEventListener("mousedown", (e) => { e.preventDefault(); onStart(e.clientX, e.clientY); });
        window.addEventListener("mousemove", (e) => onMove(e.clientX, e.clientY));
        window.addEventListener("mouseup", onEnd);

        el.addEventListener("touchstart", (e) => { e.preventDefault(); const t = e.touches[0]; onStart(t.clientX, t.clientY); }, { passive: false });
        window.addEventListener("touchmove", (e) => { if (dragging) { const t = e.touches[0]; onMove(t.clientX, t.clientY); } });
        window.addEventListener("touchend", onEnd);

        container.appendChild(el);
    });
}

function finishCalibration() {
    // Remove draggable pads
    elements.calibrationOverlay.querySelectorAll(".calibration-pad").forEach(el => el.remove());
    elements.calibrationOverlay.classList.add("hidden");

    // Update color/label maps
    DRUM_KIT.forEach(d => { DRUM_COLORS[d.name] = d.color; DRUM_LABELS[d.name] = d.label; });

    savePositions();
    elements.bootButton.classList.remove("hidden");
    // Camera is already open, state.stream is set — boot() will reuse it
}


// ─── Boot ───────────────────────────────────────────────────

async function boot() {
    if (state.booting || state.booted) return;
    state.booting = true;
    elements.bootButton.disabled = true;
    elements.cameraStatus.textContent = "Warming the drum engine...";

    try {
        state.audio = new DrumAudioEngine();
        await state.audio.init();
        await state.audio.resume();
        state.poseAvailable = false;

        try {
            elements.cameraStatus.textContent = "Opening camera...";
            await setupCamera();
            elements.cameraStatus.textContent = "Loading MoveNet pose detector...";
            await setupDetector();
            state.poseAvailable = true;
        } catch (e) {
            console.warn("Camera/pose setup failed", e);
            state.cameraError = e.message;
            state.pose.trackingConfidence = 0;
        }

        state.booted = true;
        elements.cameraStatus.textContent = state.poseAvailable
            ? "Camera live. Starting countdown..."
            : "Camera unavailable. Starting guided playback.";
        elements.bootButton.classList.add("hidden");

        if (state.poseAvailable && !state.poseLoopActive) {
            state.poseLoopActive = true;
            window.requestAnimationFrame(poseLoop);
        }
        if (!state.renderLoopActive) {
            state.renderLoopActive = true;
            window.requestAnimationFrame(renderLoop);
        }
    } catch (e) {
        console.error(e);
        elements.cameraStatus.textContent = `Setup failed: ${e.message}`;
        elements.bootButton.disabled = false;
    } finally {
        state.booting = false;
    }
}

async function startPlayback() {
    if (!state.booted) return;
    cancelCountdown();
    await state.audio.resume();
    resetLoop();
    const ok = await runCountdown(3);
    if (!ok) return;
    state.startedAt = performance.now();
    state.lastBeatTick = -1;
    state.isPlaying = true;
    elements.cameraStatus.textContent = state.poseAvailable
        ? "Strike downward onto the drum pads! Follow the rail."
        : "Guided playback running. Allow camera and reload for body control.";
}

async function startExperience() {
    if (state.booting) return;
    if (!state.booted) await boot();
    if (state.booted && !state.isPlaying) await startPlayback();
}

function attachEvents() {
    elements.bootButton.addEventListener("click", startExperience);
    elements.songSelect.addEventListener("change", (e) => {
        applySong(e.target.value);
        if (state.booted) startPlayback();
    });
    window.addEventListener("resize", syncOverlay);

    // Setup modal buttons
    elements.setupNo.addEventListener("click", () => {
        hideSetupModal();
    });
    elements.setupYes.addEventListener("click", () => {
        startCalibration();
    });
    elements.calibrationDone.addEventListener("click", () => {
        finishCalibration();
    });
    elements.resetSetupBtn.addEventListener("click", () => {
        showSetupModal();
    });

    // Spotify close — just hides, song change will re-show
    elements.spotifyClose.addEventListener("click", () => {
        elements.spotifyDock.classList.add("hidden");
    });
}

function init() {
    // Load saved drum positions if any
    const hasSaved = loadSavedPositions();

    buildSongSelect();
    applySong(state.selectedSongId);
    attachEvents();

    // If positions were previously saved, skip setup and go straight to Start
    if (hasSaved) {
        hideSetupModal();
    }
}

init();
