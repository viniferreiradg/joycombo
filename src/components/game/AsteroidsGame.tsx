'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Copy, Reload, Trophy, Whatsapp } from 'pixelarticons/react'
import WhatsAppLink from '@/components/WhatsAppLink'
import { SHIP_POINTS } from '@/components/Brand'
import { fillTemplate } from '@/lib/format'
import { trackEvent } from '@/lib/tracking'
import Screen from './Screen'
import type { GameTexts } from './GameSection'

// Asteroids com a nave do Joycombo. O jogo roda numa resolucao baixa (cada
// "pixel" do jogo = 3px da tela) e o canvas e ampliado com image-rendering:
// pixelated, o que da o visual de pixel sem nenhum asset.

const SCALE = 3
const ACCENT = '#dcff01'
const BG = '#111111'

// Sequencia da vitoria (segundos desde bater a meta)
const WIN_BOOM_GAP = 0.09 // intervalo entre as explosoes dos asteroides
const WIN_SPIN_TIME = 1.1 // duracao do giro de 360 da nave
const WIN_DIALOG_PAUSE = 0.25 // respiro entre o giro e o cupom

// Movimento: antes de comecar o cenario desliza devagar (a nave "navegando");
// ao comecar ela freia. Cada tiro empurra a nave de leve para tras; passando
// do limite, quem anda e o cenario
const CRUISE_SPEED = 0.05 // velocidade do cenario parado, em fracao da tela por segundo
const BRAKE_TIME = 1.4 // segundos para frear (e para voltar a navegar)
const RECOIL = 0.06 // empurrao de cada tiro, em fracao da tela por segundo
const RECOIL_FRICTION = 2.5 // quanto maior, mais rapido o empurrao acaba
const SHIP_LIMIT_PX = 150 // distancia maxima da nave ao centro, em px da tela

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

// Passa do ponto e volta (efeito de quique)
const easeOutBack = (t: number) => {
  const c = 1.9
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}

// winning: a animacao entre bater a meta e abrir o cupom
type Phase = 'idle' | 'playing' | 'winning' | 'won' | 'over'
type Rock = { x: number; y: number; vx: number; vy: number; r: number; big: boolean; img: HTMLCanvasElement; boomAt?: number }
type Bullet = { x: number; y: number; vx: number; vy: number; life: number }
type Particle = { x: number; y: number; vx: number; vy: number; life: number }

// Asteroide como um blob de pixels, desenhado uma vez num canvas fora da tela
function makeRockImage(r: number): HTMLCanvasElement {
  const size = Math.ceil(r * 2) + 2
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')!
  const lobes = Array.from({ length: 7 }, () => 0.72 + Math.random() * 0.28)
  const cx = size / 2
  const radiusAt = (a: number) => {
    const t = ((a + Math.PI) / (Math.PI * 2)) * lobes.length
    const i = Math.floor(t) % lobes.length
    const f = t - Math.floor(t)
    return r * (lobes[i] * (1 - f) + lobes[(i + 1) % lobes.length] * f)
  }
  ctx.fillStyle = '#ffffff'
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - cx
      const dy = y + 0.5 - cx
      if (Math.hypot(dx, dy) <= radiusAt(Math.atan2(dy, dx))) ctx.fillRect(x, y, 1, 1)
    }
  }
  // Crateras
  ctx.globalCompositeOperation = 'source-atop'
  ctx.fillStyle = '#9a9a9a'
  for (let k = 0; k < Math.max(1, Math.round(r / 5)); k++) {
    const a = Math.random() * Math.PI * 2
    const d = Math.random() * r * 0.45
    const cr = Math.max(1, Math.round(r * (0.12 + Math.random() * 0.1)))
    const px = Math.round(cx + Math.cos(a) * d)
    const py = Math.round(cx + Math.sin(a) * d)
    for (let y = -cr; y <= cr; y++) for (let x = -cr; x <= cr; x++) if (x * x + y * y <= cr * cr) ctx.fillRect(px + x, py + y, 1, 1)
  }
  return c
}

export default function AsteroidsGame({ texts }: { texts: GameTexts }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [score, setScore] = useState(0)
  const [canRedeem, setCanRedeem] = useState(false)
  const [copied, setCopied] = useState(false)

  // Estado do jogo fora do React: muda 60x por segundo
  const game = useRef({
    phase: 'idle' as Phase,
    W: 0,
    H: 0,
    shipScale: 0.1,
    angle: -Math.PI / 2,
    pointer: null as { x: number; y: number } | null,
    keys: { left: false, right: false },
    rocks: [] as Rock[],
    bullets: [] as Bullet[],
    particles: [] as Particle[],
    stars: [] as { x: number; y: number; a: number; d: number }[],
    // Deslocamento do cenario (estrelas) e da nave em relacao ao centro
    camX: 0,
    camY: 0,
    sx: 0,
    sy: 0,
    svx: 0,
    svy: 0,
    // Velocidade de navegacao: 1 = navegando, 0 = parado; muda com easing
    cruise: 1,
    cruiseFrom: 1,
    cruiseTo: 1,
    cruiseT: 1,
    spawnIn: 0.6,
    destroyed: 0,
    cooldown: 0,
    reduced: false,
    winT: 0,
    spinFrom: 0,
    spinAt: 0,
    pop: 1,
  })

  // Pontuacao: X pontos por asteroide; o cupom sai ao chegar na meta
  const perHit = Math.max(1, texts.pointsPerHit || 50)
  const goal = Math.max(1, texts.pointsGoal || 750)

  const setGamePhase = useCallback((p: Phase) => {
    game.current.phase = p
    setPhase(p)
  }, [])

  const start = useCallback(() => {
    const g = game.current
    g.rocks = []
    g.bullets = []
    g.particles = []
    g.destroyed = 0
    g.spawnIn = 0.4
    g.pop = 1
    g.sx = g.sy = g.svx = g.svy = 0
    g.cruiseFrom = g.cruise
    g.cruiseTo = 0
    g.cruiseT = 0
    setScore(0)
    setCanRedeem(false)
    setCopied(false)
    setGamePhase('playing')
    trackEvent('jogo_inicio')
  }, [setGamePhase])

  const shoot = useCallback(() => {
    const g = game.current
    if (g.phase !== 'playing' || g.cooldown > 0) return
    const speed = Math.max(g.W, g.H) * 0.55
    // O bico da nave fica a ~100 unidades do centro (contorno original)
    const nose = 100 * g.shipScale
    g.bullets.push({
      x: g.W / 2 + g.sx + Math.cos(g.angle) * nose,
      y: g.H / 2 + g.sy + Math.sin(g.angle) * nose,
      vx: Math.cos(g.angle) * speed,
      vy: Math.sin(g.angle) * speed,
      life: 1.4,
    })
    g.cooldown = 0.12
    // Coice: a nave vai um pouco para o lado contrario do tiro
    const kick = Math.min(g.W, g.H) * RECOIL
    g.svx -= Math.cos(g.angle) * kick
    g.svy -= Math.sin(g.angle) * kick
  }, [])

  // Clique / toque: comeca o jogo ou atira
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    aim(e)
    const g = game.current
    if (g.phase === 'idle' || g.phase === 'over') {
      start()
      return
    }
    shoot()
  }

  const aim = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    game.current.pointer = { x: (e.clientX - rect.left) / SCALE, y: (e.clientY - rect.top) / SCALE }
  }

  const onKey = (e: React.KeyboardEvent<HTMLCanvasElement>, down: boolean) => {
    const g = game.current
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      g.keys[e.key === 'ArrowLeft' ? 'left' : 'right'] = down
      g.pointer = null
    } else if (down && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault()
      if (g.phase === 'idle' || g.phase === 'over') start()
      else shoot()
    }
  }

  // Loop principal
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const g = game.current
    g.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      g.W = Math.max(60, Math.floor(rect.width / SCALE))
      g.H = Math.max(60, Math.floor(rect.height / SCALE))
      canvas.width = g.W
      canvas.height = g.H
      g.shipScale = (Math.min(g.W, g.H) * 0.13) / 184
      g.stars = Array.from({ length: Math.round((g.W * g.H) / 900) }, () => ({
        x: Math.floor(Math.random() * g.W),
        y: Math.floor(Math.random() * g.H),
        a: 0.15 + Math.random() * 0.35,
        d: 0.4 + Math.random() * 0.6, // profundidade: as de perto andam mais
      }))
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const spawnRock = () => {
      const big = Math.random() < 0.6
      const unit = Math.min(g.W, g.H)
      const r = big ? unit * 0.075 : unit * 0.042
      // Nasce fora da tela, num ponto aleatorio da borda
      const edge = Math.floor(Math.random() * 4)
      const x = edge === 0 ? -r : edge === 1 ? g.W + r : Math.random() * g.W
      const y = edge === 2 ? -r : edge === 3 ? g.H + r : Math.random() * g.H
      const toShip = Math.atan2(g.H / 2 + g.sy - y, g.W / 2 + g.sx - x) + (Math.random() - 0.5) * 0.7
      const speed = unit * (0.09 + g.destroyed * 0.006) * (g.reduced ? 0.6 : 1) * (big ? 1 : 1.3)
      g.rocks.push({ x, y, vx: Math.cos(toShip) * speed, vy: Math.sin(toShip) * speed, r, big, img: makeRockImage(r) })
    }

    const burst = (x: number, y: number, n: number) => {
      if (g.reduced) return
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2
        const s = 10 + Math.random() * 40
        g.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.3 + Math.random() * 0.4 })
      }
    }

    const explode = (x: number, y: number, n: number) => {
      if (g.reduced) return
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2
        const s = 20 + Math.random() * 70
        g.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5 + Math.random() * 0.6 })
      }
    }

    // Vitoria: explode tudo, a nave gira 360 com quique e entao abre o cupom
    const updateWin = (dt: number) => {
      g.winT += dt
      const t = g.winT

      for (const r of g.rocks) {
        r.x += r.vx * dt * 0.4
        r.y += r.vy * dt * 0.4
      }
      g.rocks = g.rocks.filter((r) => {
        if (t < (r.boomAt ?? 0)) return true
        explode(r.x, r.y, r.big ? 28 : 18)
        return false
      })

      const spin = g.reduced ? 1 : Math.min(1, Math.max(0, (t - g.spinAt) / WIN_SPIN_TIME))
      if (spin > 0) {
        g.angle = g.spinFrom + Math.PI * 2 * easeOutBack(spin)
        // A nave cresce um pouco no meio do giro e volta
        g.pop = 1 + Math.sin(Math.PI * Math.min(1, spin * 1.15)) * 0.35
      }

      if (t >= g.spinAt + (g.reduced ? 0 : WIN_SPIN_TIME) + WIN_DIALOG_PAUSE) {
        g.pop = 1
        setGamePhase('won')
        // Pequena pausa antes do botao do WhatsApp aceitar clique: o
        // visitante pode estar clicando rapido para atirar
        window.setTimeout(() => setCanRedeem(true), 800)
      }
    }

    // Move o cenario inteiro (estrelas, asteroides, tiros, particulas)
    const scrollWorld = (dx: number, dy: number) => {
      g.camX += dx
      g.camY += dy
      for (const list of [g.rocks, g.bullets, g.particles]) {
        for (const o of list) {
          o.x += dx
          o.y += dy
        }
      }
    }

    const updateMotion = (dt: number) => {
      // Navegacao: o cenario corre no sentido contrario ao bico da nave
      const goingIdle = g.phase === 'idle' || g.phase === 'over' || g.phase === 'won'
      if (goingIdle && g.cruiseTo !== 1) {
        g.cruiseFrom = g.cruise
        g.cruiseTo = 1
        g.cruiseT = 0
      }
      if (g.cruiseT < 1) {
        g.cruiseT = Math.min(1, g.cruiseT + dt / BRAKE_TIME)
        g.cruise = g.cruiseFrom + (g.cruiseTo - g.cruiseFrom) * easeInOutCubic(g.cruiseT)
      }
      if (!g.reduced && g.cruise > 0) {
        const v = Math.min(g.W, g.H) * CRUISE_SPEED * g.cruise
        scrollWorld(-Math.cos(g.angle) * v * dt, -Math.sin(g.angle) * v * dt)
      }

      // Coice dos tiros, com atrito
      const f = Math.exp(-RECOIL_FRICTION * dt)
      g.svx *= f
      g.svy *= f
      g.sx += g.svx * dt
      g.sy += g.svy * dt
      // Passou do limite: a nave fica e o cenario anda no lugar dela
      const limit = Math.min(SHIP_LIMIT_PX / SCALE, Math.min(g.W, g.H) * 0.3)
      const dist = Math.hypot(g.sx, g.sy)
      if (dist > limit) {
        const k = (dist - limit) / dist
        scrollWorld(-g.sx * k, -g.sy * k)
        g.sx -= g.sx * k
        g.sy -= g.sy * k
      }
    }

    const update = (dt: number) => {
      updateMotion(dt)
      const cx = g.W / 2 + g.sx
      const cy = g.H / 2 + g.sy

      // Particulas animam em qualquer fase (explosoes do fim e do game over)
      for (const p of g.particles) {
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.life -= dt
      }
      g.particles = g.particles.filter((p) => p.life > 0)

      if (g.phase === 'winning') {
        updateWin(dt)
        return
      }

      // Mira: segue o mouse/dedo; no teclado, gira com as setas
      if (g.pointer) {
        const target = Math.atan2(g.pointer.y - cy, g.pointer.x - cx)
        let diff = target - g.angle
        diff = Math.atan2(Math.sin(diff), Math.cos(diff))
        g.angle += diff * Math.min(1, dt * 18)
      }
      if (g.keys.left) g.angle -= dt * 4
      if (g.keys.right) g.angle += dt * 4

      if (g.phase !== 'playing') return

      g.cooldown = Math.max(0, g.cooldown - dt)
      g.spawnIn -= dt
      if (g.spawnIn <= 0) {
        spawnRock()
        g.spawnIn = Math.max(0.5, 1.5 - g.destroyed * 0.07) * (g.reduced ? 1.4 : 1)
      }

      for (const b of g.bullets) {
        b.x += b.vx * dt
        b.y += b.vy * dt
        b.life -= dt
      }
      g.bullets = g.bullets.filter((b) => b.life > 0 && b.x > -4 && b.x < g.W + 4 && b.y > -4 && b.y < g.H + 4)

      for (const r of g.rocks) {
        r.x += r.vx * dt
        r.y += r.vy * dt
      }

      // Tiro x asteroide
      const born: Rock[] = []
      g.rocks = g.rocks.filter((rock) => {
        const hit = g.bullets.find((b) => Math.hypot(b.x - rock.x, b.y - rock.y) < rock.r + 1)
        if (!hit) return true
        hit.life = 0
        g.destroyed++
        burst(rock.x, rock.y, rock.big ? 14 : 8)
        // Asteroide grande racha em dois pequenos
        if (rock.big) {
          const unit = Math.min(g.W, g.H)
          for (const side of [-1, 1]) {
            const a = Math.atan2(rock.vy, rock.vx) + side * 0.8
            const s = Math.hypot(rock.vx, rock.vy) * 1.25
            const r = unit * 0.042
            born.push({ x: rock.x, y: rock.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r, big: false, img: makeRockImage(r) })
          }
        }
        return false
      })
      g.rocks.push(...born)
      g.bullets = g.bullets.filter((b) => b.life > 0)

      // Remove o que ja passou longe da tela
      const m = Math.max(g.W, g.H) * 0.3
      g.rocks = g.rocks.filter((r) => r.x > -m && r.x < g.W + m && r.y > -m && r.y < g.H + m)

      const points = g.destroyed * perHit
      setScore((prev) => (prev === points ? prev : points))

      if (points >= goal) {
        // Comeca a sequencia: os asteroides explodem um a um, do mais perto
        // da nave para o mais longe, e nao nascem mais
        g.bullets = []
        g.winT = 0
        g.rocks
          .sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy))
          .forEach((r, i) => (r.boomAt = 0.15 + i * WIN_BOOM_GAP))
        const lastBoom = g.rocks.length ? 0.15 + (g.rocks.length - 1) * WIN_BOOM_GAP : 0
        g.spinAt = lastBoom + 0.35
        g.spinFrom = g.angle
        setGamePhase('winning')
        trackEvent('jogo_cupom', { cupom: texts.couponCode })
        return
      }

      // Asteroide x nave
      const shipR = 60 * g.shipScale
      if (g.rocks.some((r) => Math.hypot(r.x - cx, r.y - cy) < r.r * 0.85 + shipR)) {
        burst(cx, cy, 24)
        setGamePhase('over')
      }
    }

    const draw = () => {
      ctx.imageSmoothingEnabled = false
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, g.W, g.H)

      for (const s of g.stars) {
        const x = (((s.x + g.camX * s.d) % g.W) + g.W) % g.W
        const y = (((s.y + g.camY * s.d) % g.H) + g.H) % g.H
        ctx.fillStyle = `rgba(255,255,255,${s.a})`
        ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1)
      }

      for (const r of g.rocks) ctx.drawImage(r.img, Math.round(r.x - r.img.width / 2), Math.round(r.y - r.img.height / 2))

      ctx.fillStyle = ACCENT
      for (const b of g.bullets) ctx.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, 2, 2)
      for (const p of g.particles) ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1)

      if (g.phase !== 'over') {
        ctx.save()
        ctx.translate(g.W / 2 + g.sx, g.H / 2 + g.sy)
        // O bico da nave original aponta para a esquerda: gira meia volta
        ctx.rotate(g.angle + Math.PI)
        ctx.scale(g.shipScale * g.pop, g.shipScale * g.pop)
        ctx.beginPath()
        SHIP_POINTS.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
        ctx.closePath()
        ctx.fillStyle = ACCENT
        ctx.fill()
        ctx.restore()
      }
    }

    let raf = 0
    let last = performance.now()
    let visible = true
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      update(dt)
      draw()
      raf = visible ? requestAnimationFrame(frame) : 0
    }

    // Pausa quando o jogo sai da tela ou a aba fica em segundo plano
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting && !document.hidden
      if (visible && !raf) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    })
    io.observe(canvas)
    const onVisibility = () => {
      visible = !document.hidden
      if (visible && !raf) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [setGamePhase, perHit, goal, texts.couponCode])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(texts.couponCode)
      setCopied(true)
    } catch {}
  }

  return (
    <Screen>
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="application"
        aria-label="Jogo Asteroids. Clique, toque, Espaço ou Enter para começar e atirar. Mire com o mouse, o dedo ou as setas."
        onPointerDown={onPointerDown}
        onPointerMove={aim}
        onKeyDown={(e) => onKey(e, true)}
        onKeyUp={(e) => onKey(e, false)}
        className="absolute inset-0 h-full w-full cursor-crosshair"
        style={{ imageRendering: 'pixelated', touchAction: phase === 'playing' ? 'none' : 'manipulation' }}
      />

      {/* Placar */}
      {(phase === 'playing' || phase === 'winning') && (
        <p className="pointer-events-none absolute left-4 top-4 font-title tabular-nums md:left-8 md:top-6 text-sm font-bold uppercase tracking-[0.14em] text-white md:text-base" aria-live="polite">
          Pontos <span className="text-accent">{score}</span>
        </p>
      )}

      {phase === 'idle' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-2 text-center">
          <span className="animate-blink font-title text-xl font-bold uppercase tracking-[0.2em] text-accent md:text-2xl">Press start</span>
          <span className="text-sm text-muted-dark">Clique ou toque pra começar</span>
        </div>
      )}

      {phase === 'over' && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 text-center" aria-live="polite">
          <span className="font-title text-3xl font-bold uppercase text-white md:text-5xl">Game over</span>
          <span className="text-muted-dark">
            Pontuação: {score}. Clique pra tentar de novo.
          </span>
        </div>
      )}

      {phase === 'won' && (
        <div className="absolute inset-0 flex animate-fade items-center justify-center bg-black/85 p-4" aria-live="polite">
          <div className="on-light w-full max-w-md animate-pop motion-reduce:animate-none">
            <div className="pixel-box bg-white p-6 text-center text-black md:p-8" style={{ ['--p' as string]: '8px' }}>
              <Trophy className="mx-auto mb-3 h-10 w-10" aria-hidden />
              <p className="font-title text-2xl font-bold uppercase">Cupom desbloqueado</p>
              <p className="mt-2 text-sm text-muted-light">{texts.couponText}</p>
              <button
                type="button"
                onClick={copy}
                className="pixel-box mx-auto mt-5 flex items-center gap-3 bg-accent px-5 py-3 font-title text-xl font-bold tracking-[0.12em]"
                aria-label={`Copiar cupom ${texts.couponCode}`}
              >
                {texts.couponCode}
                <Copy className="h-5 w-5" aria-hidden />
              </button>
              <p className="mt-2 h-4 text-xs text-muted-light">{copied ? 'Copiado!' : ''}</p>
              <WhatsAppLink
                message={fillTemplate(texts.couponMessage, { codigo: texts.couponCode })}
                origin="jogo-cupom"
                aria-disabled={!canRedeem}
                onClick={(e) => {
                  if (!canRedeem) e.preventDefault()
                }}
                className={`btn btn-dark mt-4 w-full ${canRedeem ? '' : 'pointer-events-none opacity-60'}`}
              >
                <Whatsapp aria-hidden />
                <span>{texts.couponCta}</span>
              </WhatsAppLink>
              <button type="button" onClick={start} className="mx-auto mt-4 flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
                <Reload className="h-4 w-4" aria-hidden />
                Jogar de novo
              </button>
            </div>
          </div>
        </div>
      )}
    </Screen>
  )
}
