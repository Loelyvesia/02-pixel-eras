<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { eras, specCards, type Era } from './data'

const index = ref(2)
const era = computed<Era>(() => eras[index.value])

const sceneEl = ref<HTMLCanvasElement | null>(null)
const dustEl = ref<HTMLCanvasElement | null>(null)

// --- Scene renderer ---
let sceneCtx: CanvasRenderingContext2D | null = null
let raf = 0

function drawScene(t: number) {
  const canvas = sceneEl.value
  if (!canvas) return
  const ctx = sceneCtx || canvas.getContext('2d')
  if (!ctx) return
  sceneCtx = ctx as CanvasRenderingContext2D

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  if (canvas.width !== Math.round(w * dpr)) canvas.width = Math.round(w * dpr)
  if (canvas.height !== Math.round(h * dpr)) canvas.height = Math.round(h * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const e = era.value
  const [gw, gh] = e.grid
  const off = document.createElement('canvas')
  off.width = gw
  off.height = gh
  const octx = off.getContext('2d')!
  octx.imageSmoothingEnabled = false
  const P = e.palette

  // sky
  const sky = octx.createLinearGradient(0, 0, 0, gh)
  sky.addColorStop(0, P.skyTop)
  sky.addColorStop(1, P.skyBottom)
  octx.fillStyle = sky
  octx.fillRect(0, 0, gw, gh)

  // stars / clouds
  if (e.style === '8bit' || e.style === 'early3d') {
    octx.fillStyle = 'rgba(255,255,255,.55)'
    for (let i = 0; i < 8; i++) {
      const x = (i * 37 + 13) % gw
      const y = (i * 11 + 5) % Math.floor(gh * 0.4)
      octx.fillRect(x, y, 1, 1)
    }
  } else {
    octx.fillStyle = 'rgba(255,255,255,.5)'
    for (let i = 0; i < 3; i++) {
      const x = (i * 23 + 10) % gw
      const y = Math.floor(gh * 0.18) + (i % 2)
      octx.fillRect(x, y, 6, 2)
      octx.fillRect(x + 2, y - 1, 3, 1)
    }
  }

  // sun
  const sunX = Math.floor(gw * 0.76)
  const sunY = Math.floor(gh * 0.2)
  octx.fillStyle = P.sun
  octx.beginPath()
  octx.arc(sunX, sunY, Math.max(2, Math.floor(gw / 22)), 0, Math.PI * 2)
  octx.fill()
  if (e.style === 'modern') {
    const glow = octx.createRadialGradient(sunX, sunY, 1, sunX, sunY, Math.floor(gw / 8))
    glow.addColorStop(0, 'rgba(255,220,130,.85)')
    glow.addColorStop(1, 'rgba(255,220,130,0)')
    octx.fillStyle = glow
    octx.fillRect(0, 0, gw, gh)
  }

  // mountains (two layers)
  const horizon = Math.floor(gh * 0.66)
  drawRange(octx, gw, horizon, 4, 0.45, P.mt1, e.style)
  drawRange(octx, gw, horizon, 3, 0.3, P.mt2, e.style)

  // ground
  octx.fillStyle = P.ground
  octx.fillRect(0, horizon, gw, gh - horizon)
  if (e.style === '16bit' || e.style === 'modern') {
    octx.fillStyle = 'rgba(0,0,0,.16)'
    for (let y = horizon; y < gh; y += 3) octx.fillRect(0, y, gw, 1)
  }
  if (e.style === 'early3d') {
    octx.fillStyle = 'rgba(0,0,0,.2)'
    for (let y = horizon + 1; y < gh; y += 2) {
      for (let x = (y % 4); x < gw; x += 4) octx.fillRect(x, y, 1, 1)
    }
  }

  // hero character
  const hx = Math.floor(gw * 0.42)
  drawHero(octx, hx, horizon, e.style, P)

  // fog for early3d
  if (e.style === 'early3d') {
    octx.fillStyle = 'rgba(140,150,160,.28)'
    octx.fillRect(0, Math.floor(gh * 0.78), gw, gh)
  }

  // upscale to visible canvas (nearest neighbour = crisp pixels)
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, w, h)
  ctx.drawImage(off, 0, 0, w, h)

  // outline pass for stylized
  if (e.style === 'stylized') {
    ctx.strokeStyle = P.outline
    ctx.lineWidth = 3
    ctx.strokeRect(1.5, 1.5, w - 3, h - 3)
  }
}

function drawRange(ctx: CanvasRenderingContext2D, w: number, horizon: number, peaks: number, height: number, color: string, style: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, horizon)
  const amp = Math.floor(horizon * height)
  for (let i = 0; i <= peaks; i++) {
    const x = Math.floor((w / peaks) * i)
    const y = horizon - Math.floor(amp * (0.5 + 0.5 * Math.sin(i * 1.7 + 1)))
    ctx.lineTo(x, y)
  }
  ctx.lineTo(w, horizon)
  ctx.closePath()
  ctx.fill()
  if (style === 'stylized') {
    ctx.strokeStyle = 'rgba(20,20,30,.55)'
    ctx.lineWidth = 1
    ctx.stroke()
  }
}

function drawHero(ctx: CanvasRenderingContext2D, x: number, ground: number, style: string, P: Era['palette']) {
  const s = Math.max(1, Math.floor(ground / 14))
  if (style === '8bit' || style === '16bit') {
    ctx.fillStyle = P.hero
    ctx.fillRect(x, ground - s * 5, s * 2, s * 3) // body
    ctx.fillRect(x + s * 2, ground - s * 4, s * 2, s * 2) // head
    ctx.fillStyle = P.hero2
    ctx.fillRect(x + s * 3, ground - s * 3, s, s) // eye
    ctx.fillStyle = P.outline
    ctx.fillRect(x, ground - s * 2, s * 4, s) // legs
  } else {
    ctx.fillStyle = P.hero
    ctx.beginPath()
    ctx.arc(x + s * 3, ground - s * 6, s * 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(x, ground - s * 4, s * 6, s * 4)
    ctx.fillStyle = P.hero2
    ctx.beginPath()
    ctx.arc(x + s * 4, ground - s * 7, s, 0, Math.PI * 2)
    ctx.fill()
    if (style === 'stylized') {
      ctx.strokeStyle = P.outline
      ctx.lineWidth = Math.max(1, Math.floor(s * 0.6))
      ctx.stroke()
    }
  }
}

// --- Pixel dust background (mouse-reactive) ---
let dustCtx: CanvasRenderingContext2D | null = null
let dustRaf = 0
const parts: { x: number; y: number; vx: number; vy: number; s: number; c: string }[] = []
let mouse = { x: 0, y: 0 }

function setupDust() {
  const c = dustEl.value
  if (!c) return
  dustCtx = c.getContext('2d')
  const colors = ['#ff4d6d', '#ffd166', '#4dd6ff', '#9b5de5', '#7aff8e']
  for (let i = 0; i < 90; i++) {
    parts.push({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.0006, vy: (Math.random() - 0.5) * 0.0006, s: 1 + Math.floor(Math.random() * 4), c: colors[i % colors.length] })
  }
}

function drawDust() {
  const c = dustEl.value
  const ctx = dustCtx
  if (!c || !ctx) return
  const w = c.clientWidth
  const h = c.clientHeight
  if (c.width !== w) c.width = w
  if (c.height !== h) c.height = h
  ctx.clearRect(0, 0, w, h)
  for (const p of parts) {
    p.x += p.vx + (mouse.x - p.x) * 0.00004
    p.y += p.vy + (mouse.y - p.y) * 0.00004
    if (p.x < 0) p.x = 1
    if (p.x > 1) p.x = 0
    if (p.y < 0) p.y = 1
    if (p.y > 1) p.y = 0
    ctx.fillStyle = p.c
    ctx.globalAlpha = 0.55
    ctx.fillRect(p.x * w, p.y * h, p.s, p.s)
  }
  ctx.globalAlpha = 1
  dustRaf = requestAnimationFrame(drawDust)
}

function onMouseMove(ev: MouseEvent) {
  mouse.x = ev.clientX / window.innerWidth
  mouse.y = ev.clientY / window.innerHeight
}

function loop(t: number) {
  drawScene(t)
  raf = requestAnimationFrame(loop)
}

function selectEra(i: number) {
  index.value = Math.max(0, Math.min(eras.length - 1, i))
}
function scrub(e: Event) {
  selectEra(Number((e.target as HTMLInputElement).value))
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

watch(era, () => {})

onMounted(() => {
  setupDust()
  drawDust()
  raf = requestAnimationFrame(loop)
  window.addEventListener('mousemove', onMouseMove)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  cancelAnimationFrame(dustRaf)
  window.removeEventListener('mousemove', onMouseMove)
})
</script>

<template>
  <div class="wrap">
    <canvas ref="dustEl" class="dust" aria-hidden="true"></canvas>
    <header class="arcade-top">
      <div class="arcade-logo">
        <span class="logo-block">▚</span>
        <span class="logo-text"><b>像素纪元</b><i>PIXEL ERAS · 游戏艺术展览</i></span>
      </div>
      <div class="coin-badge"><span>CREDIT</span><b>1</b></div>
    </header>

    <section class="hero">
      <p class="kicker">A PLAYABLE HISTORY OF GAME ART · 可玩的游戏美术史</p>
      <h1 class="hero-title">
        <span>像素</span>
        <span class="glitch" :data-text="'进化'">进化</span>
      </h1>
      <p class="hero-sub">
        从四个颜色到实时光照，游戏画面走过了四十年的路。
        转动下方的「图形年代旋钮」，同一个场景会一层层穿越回这些时代。
      </p>
      <button class="btn" @click="scrollToId('dial')">转动旋钮 ↓</button>
    </section>

    <section class="dial" id="dial">
      <div class="dial-head">
        <div>
          <p class="kicker">SIGNATURE INTERACTION</p>
          <h2>图形年代旋钮 <span>· Graphics Dial</span></h2>
        </div>
        <div class="era-tag">{{ era.year }} · {{ era.name }}</div>
      </div>

      <div class="stage">
        <div class="stage-frame">
          <div class="stage-scan" aria-hidden="true"></div>
          <canvas ref="sceneEl" class="scene"></canvas>
          <div class="stage-hud">
            <span>{{ era.en }}</span>
            <span>RES {{ era.grid[0] }}×{{ era.grid[1] }}</span>
          </div>
        </div>
        <div class="stage-side">
          <p class="stage-desc">{{ era.desc }}</p>
          <ul class="tech">
            <li v-for="t in era.tech" :key="t">{{ t }}</li>
          </ul>
        </div>
      </div>

      <div class="dial-controls">
        <button v-for="(e, i) in eras" :key="e.id" class="era-btn" :class="{ active: i === index }" @click="selectEra(i)">
          <span class="era-btn-year">{{ e.year }}</span>
          <span class="era-btn-name">{{ e.name }}</span>
        </button>
      </div>
      <input class="dial-slider" type="range" min="0" max="4" step="1" :value="index" @input="scrub" aria-label="图形年代旋钮" />
    </section>

    <section class="wall">
      <div class="wall-head">
        <p class="kicker">EXHIBITION WALL</p>
        <h2>技术展墙 <span>· Tech Specimens</span></h2>
        <p>每一件展品，都是一次图形技术的革命。</p>
      </div>
      <div class="specs">
        <article v-for="(s, i) in specCards" :key="s.item" class="spec" :style="{ '--i': i }">
          <span class="spec-era">{{ s.era }}</span>
          <h3>{{ s.item }}</h3>
          <p>{{ s.note }}</p>
        </article>
      </div>
    </section>

    <section class="about">
      <div class="about-inner">
        <h2>关于这个展馆</h2>
        <p>
          《像素纪元》用同一个程序化场景演示游戏画面从 8-bit 到风格化渲染的演进。
          场景由 Canvas 实时绘制，不同时代对应不同的分辨率、色板与渲染手法，属于
          技术演示与常识梳理，不涉及真实统计数据。所有视觉均为原创代码绘制。
        </p>
        <div class="about-meta"><span>Vue 3 + Canvas</span><span>像素粒子 · CRT 扫描线 · 故障特效</span><span>无外部素材依赖</span></div>
      </div>
    </section>

    <footer class="foot">
      <span>像素纪元 · Pixel Eras</span>
      <span>当前年代 {{ era.name }}</span>
      <span>DIGITAL VISUAL LAB</span>
    </footer>
  </div>
</template>

<style>
:root {
  --neon: #ff4d6d;
  --neon2: #4dd6ff;
  --neon3: #ffd166;
  --ink: #15101d;
  --paper: #1b1626;
  --mono: 'Cascadia Mono', Consolas, 'Courier New', monospace;
}
.wrap {
  position: relative;
  min-height: 100vh;
  background: radial-gradient(120% 80% at 50% -10%, #2a2140 0%, #171222 48%, #0d0a14 100%);
  color: #f4efff;
  font-family: var(--mono);
  overflow-x: hidden;
}
.dust {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 5;
  opacity: 0.7;
}
.arcade-top {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px clamp(18px, 4vw, 56px);
  border-bottom: 2px solid #2c2440;
}
.arcade-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}
.logo-block {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  font-size: 26px;
  color: var(--neon);
  border: 2px solid var(--neon);
  box-shadow: 0 0 0 3px #1b1626, 0 0 18px rgba(255, 77, 109, 0.55);
}
.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.logo-text b {
  font-size: 19px;
  letter-spacing: 3px;
}
.logo-text i {
  font-style: normal;
  font-size: 11px;
  color: #8f83a8;
  letter-spacing: 1px;
}
.coin-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 2px solid var(--neon3);
  color: var(--neon3);
  padding: 6px 12px;
  font-size: 12px;
  letter-spacing: 1px;
  box-shadow: 0 0 14px rgba(255, 209, 102, 0.3);
}
.coin-badge b {
  font-size: 20px;
}

.hero {
  position: relative;
  z-index: 10;
  padding: clamp(56px, 10vh, 120px) clamp(18px, 4vw, 56px);
  max-width: 1240px;
  margin: 0 auto;
}
.kicker {
  font-size: 11px;
  letter-spacing: 4px;
  color: var(--neon2);
  margin: 0 0 16px;
}
.hero-title {
  font-size: clamp(56px, 13vw, 180px);
  line-height: 0.92;
  letter-spacing: 0.04em;
  margin: 0;
  color: #fff;
  text-shadow: 0 0 30px rgba(255, 77, 109, 0.35);
}
.hero-title span {
  display: inline-block;
}
.hero-title .glitch {
  color: var(--neon);
  position: relative;
}
.hero-title .glitch::before,
.hero-title .glitch::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
}
.hero-title .glitch::before {
  color: var(--neon2);
  transform: translate(-3px, 2px);
  animation: glitchA 2.4s infinite steps(2);
}
.hero-title .glitch::after {
  color: var(--neon3);
  transform: translate(3px, -2px);
  animation: glitchB 1.9s infinite steps(2);
}
@keyframes glitchA {
  0%, 92% { clip-path: inset(0 0 0 0); }
  93% { clip-path: inset(20% 0 55% 0); }
  95% { clip-path: inset(60% 0 10% 0); }
  97% { clip-path: inset(5% 0 70% 0); }
  100% { clip-path: inset(0 0 0 0); }
}
@keyframes glitchB {
  0%, 90% { clip-path: inset(0 0 0 0); }
  91% { clip-path: inset(50% 0 25% 0); }
  94% { clip-path: inset(10% 0 65% 0); }
  96% { clip-path: inset(40% 0 30% 0); }
  100% { clip-path: inset(0 0 0 0); }
}
.hero-sub {
  max-width: 52ch;
  font-size: clamp(14px, 1.6vw, 17px);
  color: #b9aed0;
  margin: 24px 0 0;
  line-height: 1.7;
}
.btn {
  margin-top: 28px;
  background: var(--neon);
  color: #150b16;
  border: 0;
  padding: 13px 24px;
  font-weight: 700;
  letter-spacing: 2px;
  font-family: var(--mono);
  box-shadow: 0 0 0 3px #1b1626, 0 0 22px rgba(255, 77, 109, 0.6);
  transition: transform 0.15s;
}
.btn:active {
  transform: translateY(2px);
}

.dial,
.wall,
.about {
  position: relative;
  z-index: 10;
  padding: clamp(48px, 8vh, 96px) clamp(18px, 4vw, 56px);
  max-width: 1240px;
  margin: 0 auto;
}
.dial-head,
.wall-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
  margin-bottom: 26px;
}
.dial-head h2,
.wall-head h2 {
  margin: 0;
  font-size: clamp(26px, 4vw, 46px);
  letter-spacing: 1px;
}
.dial-head h2 span,
.wall-head h2 span {
  color: #8f83a8;
  font-weight: 400;
}
.wall-head p:last-child {
  color: #8f83a8;
  margin: 6px 0 0;
  max-width: 46ch;
}
.era-tag {
  border: 2px solid var(--neon3);
  color: var(--neon3);
  padding: 8px 16px;
  letter-spacing: 2px;
}

.stage {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: clamp(18px, 3vw, 40px);
  align-items: stretch;
}
.stage-frame {
  position: relative;
  border: 3px solid #2c2440;
  border-radius: 8px;
  overflow: hidden;
  background: #0b0812;
  aspect-ratio: 16 / 10;
}
.scene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.stage-scan {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3;
  background: repeating-linear-gradient(to bottom, rgba(0, 0, 0, 0) 0 2px, rgba(0, 0, 0, 0.22) 3px 4px);
  mix-blend-mode: multiply;
  animation: scanShift 8s linear infinite;
}
@keyframes scanShift {
  from { background-position: 0 0; }
  to { background-position: 0 20px; }
}
.stage-hud {
  position: absolute;
  inset: auto 0 0 0;
  z-index: 4;
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 11px;
  letter-spacing: 2px;
  color: #cfd;
  background: rgba(8, 6, 14, 0.55);
}
.stage-side {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
}
.stage-desc {
  margin: 0;
  color: #cfc4e8;
  line-height: 1.7;
}
.tech {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tech li {
  border-left: 3px solid var(--neon2);
  padding-left: 12px;
  color: #9d91b8;
  font-size: 13px;
  letter-spacing: 1px;
}

.dial-controls {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-top: 22px;
}
.era-btn {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  padding: 14px 8px;
  background: #201a30;
  border: 2px solid #2c2440;
  color: #9d91b8;
  font-family: var(--mono);
  transition: all 0.2s;
}
.era-btn:hover {
  border-color: var(--neon2);
}
.era-btn.active {
  border-color: var(--neon);
  color: #fff;
  background: #2a2140;
  box-shadow: 0 0 18px rgba(255, 77, 109, 0.35);
}
.era-btn-year {
  font-size: 14px;
  color: var(--neon3);
}
.era-btn-name {
  font-size: 12px;
  letter-spacing: 1px;
}
.dial-slider {
  width: 100%;
  margin-top: 16px;
  appearance: none;
  height: 34px;
  background: transparent;
  cursor: grab;
}
.dial-slider::-webkit-slider-runnable-track {
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--neon), var(--neon2), var(--neon3), #9b5de5, #7aff8e);
}
.dial-slider::-webkit-slider-thumb {
  appearance: none;
  width: 28px;
  height: 28px;
  margin-top: -10px;
  border-radius: 50%;
  border: 3px solid #fff;
  background: var(--neon);
  box-shadow: 0 0 16px var(--neon);
}
.dial-slider::-moz-range-track {
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--neon), var(--neon2), var(--neon3), #9b5de5, #7aff8e);
}
.dial-slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 3px solid #fff;
  background: var(--neon);
}

.specs {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
}
.spec {
  position: relative;
  border: 2px solid #2c2440;
  background: #1d172b;
  padding: 20px 16px;
  min-height: 170px;
  transition: transform 0.25s, border-color 0.25s;
}
.spec:hover {
  transform: translateY(-6px);
  border-color: var(--neon2);
}
.spec-era {
  display: inline-block;
  font-size: 11px;
  letter-spacing: 2px;
  color: var(--neon3);
  border-bottom: 2px solid var(--neon3);
  padding-bottom: 4px;
  margin-bottom: 14px;
}
.spec h3 {
  margin: 0 0 8px;
  font-size: 17px;
  letter-spacing: 1px;
}
.spec p {
  margin: 0;
  color: #9d91b8;
  font-size: 13px;
  line-height: 1.6;
}

.about-inner {
  border: 2px solid #2c2440;
  padding: clamp(24px, 4vw, 44px);
  max-width: 820px;
  background: #1d172b;
}
.about-inner h2 {
  margin: 0 0 14px;
}
.about-inner p {
  color: #b9aed0;
  line-height: 1.7;
  margin: 0 0 16px;
}
.about-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 22px;
  font-size: 12px;
  color: #8f83a8;
  letter-spacing: 1px;
}

.foot {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding: 22px clamp(18px, 4vw, 56px);
  border-top: 2px solid #2c2440;
  color: #8f83a8;
  font-size: 12px;
  letter-spacing: 1px;
}

@media (max-width: 900px) {
  .stage {
    grid-template-columns: 1fr;
  }
  .specs {
    grid-template-columns: repeat(2, 1fr);
  }
  .dial-controls {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 480px) {
  .specs {
    grid-template-columns: 1fr;
  }
}
</style>
