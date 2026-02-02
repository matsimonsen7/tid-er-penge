interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  rotation: number
  rotationSpeed: number
  opacity: number
}

const COLORS = ['#10B981', '#34D399', '#059669', '#6EE7B7', '#ECFDF5', '#FFD700', '#FFA500']

export function createConfetti(
  canvas: HTMLCanvasElement,
  particleCount: number = 80
): () => void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) return () => {}

  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * window.devicePixelRatio
  canvas.height = rect.height * window.devicePixelRatio
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

  const particles: Particle[] = []
  const centerX = rect.width / 2
  const centerY = rect.height * 0.3

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.random() * Math.PI * 2)
    const velocity = 8 + Math.random() * 12
    particles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * velocity * (0.5 + Math.random()),
      vy: Math.sin(angle) * velocity * 0.7 - 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 4 + Math.random() * 6,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      opacity: 1,
    })
  }

  let animationFrame: number
  let cancelled = false
  const gravity = 0.3
  const friction = 0.99

  const animate = (): void => {
    if (cancelled) return

    ctx.clearRect(0, 0, rect.width, rect.height)

    let activeParticles = 0

    particles.forEach(p => {
      if (p.opacity <= 0) return
      activeParticles++

      p.vy += gravity
      p.vx *= friction
      p.vy *= friction
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.rotationSpeed

      if (p.y > rect.height * 0.8) {
        p.opacity -= 0.02
      }

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.globalAlpha = p.opacity
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
      ctx.restore()
    })

    if (activeParticles > 0) {
      animationFrame = requestAnimationFrame(animate)
    }
  }

  animationFrame = requestAnimationFrame(animate)

  return () => {
    cancelled = true
    cancelAnimationFrame(animationFrame)
    ctx.clearRect(0, 0, rect.width, rect.height)
  }
}

export function triggerConfetti(returnPercent: number): () => void {
  const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement
  if (!canvas) return () => {}

  let particleCount = 0
  if (returnPercent > 100) {
    particleCount = 80
  } else if (returnPercent > 50) {
    particleCount = 40
  }

  if (particleCount === 0) return () => {}

  return createConfetti(canvas, particleCount)
}
