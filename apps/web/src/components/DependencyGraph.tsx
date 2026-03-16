'use client'

import { useEffect, useRef, useState } from 'react'
import { ZoomIn, ZoomOut, Maximize2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getLanguageColor } from '@/lib/utils'
import type { DependencyGraph as DepsGraph, DependencyNode } from '@/types'

interface DependencyGraphProps {
  graph: DepsGraph
}

interface SimNode extends DependencyNode {
  x: number
  y: number
  vx: number
  vy: number
}

interface SimEdge {
  source: string
  target: string
  sourceNode?: SimNode
  targetNode?: SimNode
}

const CANVAS_W = 800
const CANVAS_H = 500
const NODE_RADIUS = 6
const ITERATIONS = 150
const REPULSION = 8000
const ATTRACTION = 0.05
const DAMPING = 0.85

function runForceSimulation(nodes: SimNode[], edges: SimEdge[]): void {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  for (const e of edges) {
    e.sourceNode = nodeMap.get(e.source)
    e.targetNode = nodeMap.get(e.target)
  }

  for (let iter = 0; iter < ITERATIONS; iter++) {
    // Repulsion between nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]
        const b = nodes[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.01
        const force = REPULSION / (dist * dist)
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        a.vx -= fx
        a.vy -= fy
        b.vx += fx
        b.vy += fy
      }
    }

    // Attraction along edges
    for (const e of edges) {
      if (!e.sourceNode || !e.targetNode) continue
      const dx = e.targetNode.x - e.sourceNode.x
      const dy = e.targetNode.y - e.sourceNode.y
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.01
      const idealDist = 80
      const force = (dist - idealDist) * ATTRACTION
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      e.sourceNode.vx += fx
      e.sourceNode.vy += fy
      e.targetNode.vx -= fx
      e.targetNode.vy -= fy
    }

    // Apply velocity
    for (const n of nodes) {
      n.vx *= DAMPING
      n.vy *= DAMPING
      n.x += n.vx
      n.y += n.vy
      // Boundary
      n.x = Math.max(NODE_RADIUS + 10, Math.min(CANVAS_W - NODE_RADIUS - 10, n.x))
      n.y = Math.max(NODE_RADIUS + 10, Math.min(CANVAS_H - NODE_RADIUS - 10, n.y))
    }
  }
}

export function DependencyGraph({ graph }: DependencyGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [hoveredNode, setHoveredNode] = useState<SimNode | null>(null)
  const simNodes = useRef<SimNode[]>([])
  const simEdges = useRef<SimEdge[]>([])
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (graph.nodes.length === 0) return

    // Initialize node positions
    simNodes.current = graph.nodes.map((n, i) => ({
      ...n,
      x: CANVAS_W / 2 + Math.cos((i / graph.nodes.length) * Math.PI * 2) * 150,
      y: CANVAS_H / 2 + Math.sin((i / graph.nodes.length) * Math.PI * 2) * 150,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
    }))

    simEdges.current = graph.edges.map((e) => ({ ...e }))

    runForceSimulation(simNodes.current, simEdges.current)
    drawGraph()
  }, [graph])

  const drawGraph = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const nodes = simNodes.current
    const edges = simEdges.current
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

    // Background
    ctx.fillStyle = 'hsl(224 71% 4%)'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    ctx.save()
    ctx.translate(offset.x, offset.y)
    ctx.scale(zoom, zoom)

    // Draw edges
    for (const e of edges) {
      const src = nodeMap.get(e.source)
      const tgt = nodeMap.get(e.target)
      if (!src || !tgt) continue

      ctx.beginPath()
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 1
      ctx.moveTo(src.x, src.y)
      ctx.lineTo(tgt.x, tgt.y)
      ctx.stroke()

      // Arrow
      const angle = Math.atan2(tgt.y - src.y, tgt.x - src.x)
      const arrowX = tgt.x - Math.cos(angle) * (NODE_RADIUS + 3)
      const arrowY = tgt.y - Math.sin(angle) * (NODE_RADIUS + 3)
      ctx.beginPath()
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.moveTo(arrowX, arrowY)
      ctx.lineTo(arrowX - 6 * Math.cos(angle - 0.4), arrowY - 6 * Math.sin(angle - 0.4))
      ctx.lineTo(arrowX - 6 * Math.cos(angle + 0.4), arrowY - 6 * Math.sin(angle + 0.4))
      ctx.closePath()
      ctx.fill()
    }

    // Draw nodes
    for (const n of nodes) {
      const color = getLanguageColor(n.language)
      const isHovered = hoveredNode?.id === n.id

      // Glow for hovered
      if (isHovered) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, NODE_RADIUS + 4, 0, Math.PI * 2)
        ctx.fillStyle = color + '40'
        ctx.fill()
      }

      ctx.beginPath()
      ctx.arc(n.x, n.y, NODE_RADIUS, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()

      // Label
      ctx.font = isHovered ? 'bold 10px monospace' : '9px monospace'
      ctx.fillStyle = isHovered ? '#fff' : 'rgba(255,255,255,0.6)'
      ctx.textAlign = 'center'
      ctx.fillText(n.label, n.x, n.y + NODE_RADIUS + 10)
    }

    ctx.restore()
  }

  useEffect(() => {
    drawGraph()
  }, [zoom, offset, hoveredNode])

  const getNodeAtPoint = (clientX: number, clientY: number): SimNode | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const x = (clientX - rect.left - offset.x) / zoom
    const y = (clientY - rect.top - offset.y) / zoom

    for (const n of simNodes.current) {
      const dist = Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2)
      if (dist < NODE_RADIUS + 5) return n
    }
    return null
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
      dragStart.current = { x: e.clientX, y: e.clientY }
      return
    }
    const node = getNodeAtPoint(e.clientX, e.clientY)
    setHoveredNode(node)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseUp = () => {
    isDragging.current = false
  }

  const resetView = () => {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }

  if (graph.nodes.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-border/60 text-muted-foreground text-sm">
        <div className="text-center space-y-2">
          <Info className="h-8 w-8 mx-auto opacity-30" />
          <p>No dependency relationships detected</p>
          <p className="text-xs opacity-60">This may be a config-only or documentation repo</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{graph.nodes.length}</span> nodes ·{' '}
          <span className="font-medium text-foreground">{graph.edges.length}</span> edges
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(3, z + 0.25))}>
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}>
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={resetView}>
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-border/60">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full cursor-grab active:cursor-grabbing"
          style={{ maxHeight: 500 }}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {hoveredNode && (
          <div className="absolute bottom-3 left-3 rounded-lg border border-border/60 bg-background/90 backdrop-blur px-3 py-2 text-xs">
            <p className="font-mono font-medium">{hoveredNode.path}</p>
            <p className="text-muted-foreground mt-0.5">{hoveredNode.language}</p>
          </div>
        )}

        <div className="absolute top-3 right-3 text-xs text-muted-foreground bg-background/60 backdrop-blur rounded px-2 py-1">
          Drag to pan · Scroll to zoom
        </div>
      </div>
    </div>
  )
}
