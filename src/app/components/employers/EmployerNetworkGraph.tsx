import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Share2 } from 'lucide-react';
import type { Employer, EmployerRelationship, EmployerRelationshipType } from '../../data/employerData';
import {
  RELATIONSHIP_TYPE_LABELS,
  RELATIONSHIP_TYPE_STYLES,
  RELATIONSHIP_TYPE_OPTIONS,
} from '../../data/employerData';

// ─── Canvas colour palette ────────────────────────────────────────────────────
// CSS variables cannot be read by the Canvas 2D API, so we inline the
// design-system hex values here. Update these if theme.css changes.

const T = {
  primary:        '#2322F0',
  primaryDark:    '#1919B0',
  primaryLight:   '#EAF0FB',
  foreground:     '#1A1F2E',
  mutedFg:        '#6B7489',
  border:         '#CFD7E9',
  card:           '#FFFFFF',
  muted:          '#F0F2F7',
  background:     '#ECF2FE',
  success:        '#1C8A45',
  neutral:        '#6B7489',
  gridDot:        'rgba(35,34,240,0.065)',
};

const REL_EDGE_COLOR: Record<EmployerRelationshipType, string> = {
  'Affiliate':          '#2322F0',
  'Subsidiary':         '#1C8A45',
  'Non-Related Entity': '#6B7489',
  'Department':         '#00A3A3',
  'Other':              '#E07B00',
  'Funding Entity':     '#7B2DBF',
};

const FONT = "'Open Sans', 'Source Sans Pro', -apple-system, sans-serif";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NodeDatum {
  id: string;
  employer: Employer;
  x: number;
  y: number;
  r: number;
  isCentral: boolean;
  relationship?: EmployerRelationship;
}

interface TooltipInfo {
  /** Position relative to the canvas element (CSS pixels) */
  x: number;
  y: number;
  node: NodeDatum;
}

interface Props {
  employer:      Employer;
  relationships: EmployerRelationship[];
  allEmployers:  Employer[];
  onNavigate:    (id: string) => void;
}

// ─── Canvas helpers ───────────────────────────────────────────────────────────

function clampText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 2 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}

function pillPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  text: string,
): { w: number; h: number } {
  ctx.font = `600 9px ${FONT}`;
  const tw = ctx.measureText(text).width;
  const w  = tw + 14;
  const h  = 16;
  const r  = h / 2;
  const x  = cx - w / 2;
  const y  = cy - h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  return { w, h };
}

function drawPill(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  text: string,
  bg: string,
  fg: string,
) {
  ctx.save();
  pillPath(ctx, cx, cy, text);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.restore();
  ctx.font         = `600 9px ${FONT}`;
  ctx.fillStyle    = fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy);
}

function nodeInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

// ─── Tooltip overlay (DOM, not canvas — sharper text) ─────────────────────────

function GraphTooltip({
  info,
  canvasW,
  canvasH,
}: {
  info: TooltipInfo;
  canvasW: number;
  canvasH: number;
}) {
  const { node, x, y } = info;
  const rel   = node.relationship;
  if (!rel) return null;

  const style    = RELATIONSHIP_TYPE_STYLES[rel.relationshipType];
  const TW       = 208;
  const offset   = 14;
  const rawLeft  = x + offset;
  const left     = rawLeft + TW > canvasW - 4 ? x - TW - offset : rawLeft;
  const top      = Math.max(4, Math.min(y - 36, canvasH - 130));

  return (
    <div
      style={{
        position: 'absolute',
        left:    `${left}px`,
        top:     `${top}px`,
        width:   `${TW}px`,
        background:   'var(--card)',
        border:       '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        boxShadow:    '0 6px 24px rgba(0,0,0,0.13)',
        padding:      '10px 12px',
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      {/* Employer name */}
      <div style={{
        fontFamily:   'var(--font-family-primary)',
        fontSize:     '13px',
        fontWeight:   'var(--font-weight-semibold)',
        color:        'var(--foreground)',
        marginBottom: '2px',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {node.employer.name}
      </div>

      {/* Code */}
      <div style={{
        fontFamily: 'var(--font-family-primary)',
        fontSize:   '11px',
        color:      'var(--muted-foreground)',
        marginBottom: '7px',
      }}>
        {node.employer.code}
      </div>

      {/* Badges row */}
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '7px' }}>
        {/* Relationship type */}
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          height: '17px', padding: '0 6px', borderRadius: '100px',
          background: style.bg, color: style.color,
          fontFamily: 'var(--font-family-primary)', fontSize: '10px',
          fontWeight: 'var(--font-weight-semibold)',
        }}>
          {RELATIONSHIP_TYPE_LABELS[rel.relationshipType]}
        </span>
        {/* Active / Inactive */}
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          height: '17px', padding: '0 6px', borderRadius: '100px',
          background: node.employer.isActive ? '#E8F5EE' : '#F0F2F7',
          color:      node.employer.isActive ? '#1C8A45' : '#6B7489',
          fontFamily: 'var(--font-family-primary)', fontSize: '10px',
          fontWeight: 'var(--font-weight-semibold)',
        }}>
          {node.employer.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* CTA hint */}
      <div style={{
        fontFamily:  'var(--font-family-primary)',
        fontSize:    '10px',
        fontWeight:  'var(--font-weight-semibold)',
        color:       'var(--primary)',
      }}>
        Click to view detail →
      </div>
    </div>
  );
}

// ─── Legend bar ───────────────────────────────────────────────────────────────

function GraphLegend({ visibleTypes }: { visibleTypes: Set<EmployerRelationshipType> }) {
  const types = RELATIONSHIP_TYPE_OPTIONS.filter(t => visibleTypes.has(t));
  if (types.length === 0) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px 14px',
      padding: '10px 16px',
      borderTop:    '1px solid var(--border)',
      background:   'var(--muted)',
    }}>
      <span style={{
        fontFamily:  'var(--font-family-primary)',
        fontSize:    '11px',
        fontWeight:  'var(--font-weight-semibold)',
        color:       'var(--muted-foreground)',
        whiteSpace:  'nowrap',
      }}>
        Relationship types:
      </span>
      {types.map(t => {
        const s = RELATIONSHIP_TYPE_STYLES[t];
        const isDashed = t === 'Non-Related Entity';
        return (
          <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            {/* Colour swatch / dash */}
            <span style={{
              display:     'inline-flex',
              alignItems:  'center',
              width:       '22px',
              height:      '2px',
              borderRadius: '2px',
              background:   isDashed ? 'transparent' : s.color,
              borderTop:    isDashed ? `2px dashed ${s.color}` : 'none',
              flexShrink:   0,
            }} />
            <span style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize:   '11px',
              fontWeight: 'var(--font-weight-regular)',
              color:      'var(--foreground)',
            }}>
              {t}
            </span>
          </span>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EmployerNetworkGraph({
  employer,
  relationships,
  allEmployers,
  onNavigate,
}: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef     = useRef<NodeDatum[]>([]);

  const [size,    setSize]    = useState({ w: 800, h: 440 });
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const [hovId,   setHovId]   = useState<string | null>(null);

  // ── Build node positions ────────────────────────────────────────────────────
  const buildNodes = useCallback((w: number, h: number): NodeDatum[] => {
    const cx = w / 2;
    const cy = h / 2;

    const centralR    = 38;
    const peripheralR = 28;
    const count       = relationships.length;

    // Orbit radius grows with node count but is capped by canvas dimensions
    const orbit = Math.max(
      140,
      Math.min(w * 0.33, h * 0.37, 220),
    );

    const central: NodeDatum = {
      id: employer.id,
      employer,
      x: cx, y: cy,
      r: centralR,
      isCentral: true,
    };

    const peripherals: NodeDatum[] = relationships
      .map((rel, i) => {
        const otherId = rel.employerId === employer.id
          ? rel.relatedEmployerId
          : rel.employerId;
        const other = allEmployers.find(e => e.id === otherId);
        if (!other) return null;

        // Distribute evenly; start at top (−π/2) so first node is at 12 o'clock
        const angle = count === 1
          ? 0                                               // single: directly right
          : (2 * Math.PI * i) / count - Math.PI / 2;

        return {
          id: other.id,
          employer: other,
          x: cx + orbit * Math.cos(angle),
          y: cy + orbit * Math.sin(angle),
          r: peripheralR,
          isCentral: false,
          relationship: rel,
        } as NodeDatum;
      })
      .filter(Boolean) as NodeDatum[];

    return [central, ...peripherals];
  }, [employer, relationships, allEmployers]);

  // ── Render canvas ───────────────────────────────────────────────────────────
  const draw = useCallback((w: number, h: number, hoveredId: string | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width        = w * dpr;
    canvas.height       = h * dpr;
    canvas.style.width  = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    const nodes = buildNodes(w, h);
    nodesRef.current = nodes;

    const central    = nodes.find(n => n.isCentral)!;
    const peripherals = nodes.filter(n => !n.isCentral);

    // ── Background ──────────────────────────────────────────────────────────
    ctx.fillStyle = '#F4F7FD';
    ctx.fillRect(0, 0, w, h);

    // Subtle dot grid
    ctx.fillStyle = T.gridDot;
    for (let gx = 22; gx < w; gx += 30) {
      for (let gy = 22; gy < h; gy += 30) {
        ctx.beginPath();
        ctx.arc(gx, gy, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── Edges ───────────────────────────────────────────────────────────────
    peripherals.forEach(node => {
      if (!node.relationship) return;
      const rel      = node.relationship;
      const edgeCol  = REL_EDGE_COLOR[rel.relationshipType];
      const style    = RELATIONSHIP_TYPE_STYLES[rel.relationshipType];
      const isHov    = hoveredId === node.id;
      const isDashed = rel.relationshipType === 'Non-Related Entity';

      // ── Glow under hovered edge ──────────────────────────────────────────
      if (isHov) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(central.x, central.y);
        ctx.lineTo(node.x, node.y);
        ctx.strokeStyle = edgeCol + '33';
        ctx.lineWidth   = 8;
        ctx.stroke();
        ctx.restore();
      }

      // ── Edge line ────────────────────────────────────────────────────────
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(central.x, central.y);
      ctx.lineTo(node.x, node.y);
      ctx.strokeStyle = isHov ? edgeCol : edgeCol + 'A0';
      ctx.lineWidth   = isHov ? 2.5 : 1.5;
      if (isDashed) ctx.setLineDash([7, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // ── Edge pill label ──────────────────────────────────────────────────
      // Midpoint, offset slightly perpendicular so it doesn't overlap the line
      const mx   = (central.x + node.x) / 2;
      const my   = (central.y + node.y) / 2;
      const text = RELATIONSHIP_TYPE_LABELS[rel.relationshipType];

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.10)';
      ctx.shadowBlur  = isHov ? 8 : 3;
      drawPill(
        ctx, mx, my, text,
        isHov ? edgeCol      : style.bg,
        isHov ? '#FFFFFF'    : style.color,
      );
      ctx.restore();
    });

    // ── Nodes ────────────────────────────────────────────────────────────────
    nodes.forEach(node => {
      const isHov     = hoveredId === node.id;
      const isActive  = node.employer.isActive;
      const r         = node.r + (isHov && !node.isCentral ? 3 : 0);
      const initials  = nodeInitials(node.employer.name);

      // Shadow / glow
      ctx.save();
      ctx.shadowColor = node.isCentral
        ? 'rgba(35,34,240,0.32)'
        : isHov ? 'rgba(35,34,240,0.20)' : 'rgba(0,0,0,0.10)';
      ctx.shadowBlur  = node.isCentral ? 16 : isHov ? 14 : 7;

      // Outer halo ring for central node
      if (node.isCentral) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 10, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(35,34,240,0.15)';
        ctx.lineWidth   = 7;
        ctx.stroke();
      }

      // Circle fill
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      if (node.isCentral) {
        // Radial gradient for the central node
        const g = ctx.createRadialGradient(
          node.x - 8, node.y - 8, 2,
          node.x,     node.y,     r,
        );
        g.addColorStop(0, '#4F4EF8');
        g.addColorStop(1, '#2322F0');
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = isHov ? '#F0F2FF' : T.card;
      }
      ctx.fill();
      ctx.restore();

      // Stroke ring
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = node.isCentral
        ? T.primaryDark
        : isHov ? T.primary : T.border;
      ctx.lineWidth = node.isCentral ? 2 : isHov ? 2 : 1.5;
      ctx.stroke();

      // Status dot (peripheral nodes only)
      if (!node.isCentral) {
        const sdx = node.x + r * 0.70;
        const sdy = node.y - r * 0.70;
        // white ring
        ctx.beginPath();
        ctx.arc(sdx, sdy, 6, 0, Math.PI * 2);
        ctx.fillStyle = T.card;
        ctx.fill();
        // colour fill
        ctx.beginPath();
        ctx.arc(sdx, sdy, 4, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? T.success : T.neutral;
        ctx.fill();
      }

      // Initials inside node
      ctx.font         = `700 ${node.isCentral ? 15 : 12}px ${FONT}`;
      ctx.fillStyle    = node.isCentral
        ? '#FFFFFF'
        : isHov ? T.primary : T.foreground;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initials, node.x, node.y);

      // ── Node label (name + code below circle) ─────────────────────────────
      const labelTop = node.y + r + (isHov && !node.isCentral ? 3 : 0) + 9;

      ctx.font = `600 10px ${FONT}`;
      ctx.fillStyle    = isHov ? T.primary : T.foreground;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'top';
      const nameTxt = clampText(ctx, node.employer.name, node.isCentral ? 120 : 96);
      ctx.fillText(nameTxt, node.x, labelTop);

      ctx.font      = `400 9px ${FONT}`;
      ctx.fillStyle = T.mutedFg;
      ctx.fillText(node.employer.code, node.x, labelTop + 14);
    });
  }, [buildNodes]);

  // ── Resize observer ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const e = entries[0];
      if (!e) return;
      const w = Math.floor(e.contentRect.width);
      const h = Math.max(340, Math.min(500, Math.floor(w * 0.43)));
      setSize({ w, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    draw(size.w, size.h, hovId);
  }, [draw, size, hovId]);

  // ── Pointer hit-test ─────────────────────────────────────────────────────────
  function hitTest(px: number, py: number): NodeDatum | null {
    for (const node of nodesRef.current) {
      const dx = node.x - px;
      const dy = node.y - py;
      const rr = node.r + 10; // generous hit area
      if (dx * dx + dy * dy <= rr * rr) return node;
    }
    return null;
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x    = e.clientX - rect.left;
    const y    = e.clientY - rect.top;
    const node = hitTest(x, y);

    if (node) {
      setHovId(node.id);
      if (!node.isCentral) {
        setTooltip({ x, y, node });
        canvasRef.current!.style.cursor = 'pointer';
      } else {
        setTooltip(null);
        canvasRef.current!.style.cursor = 'default';
      }
    } else {
      setHovId(null);
      setTooltip(null);
      canvasRef.current!.style.cursor = 'default';
    }
  }

  function handleMouseLeave() {
    setHovId(null);
    setTooltip(null);
  }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const node = hitTest(e.clientX - rect.left, e.clientY - rect.top);
    if (node && !node.isCentral) onNavigate(node.id);
  }

  // Collect which relationship types are currently displayed
  const visibleTypes = new Set<EmployerRelationshipType>(
    relationships.map(r => r.relationshipType),
  );

  // ── Empty state ───────────────────────────────────────────────────────────────
  if (relationships.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '56px 24px', gap: '12px',
        background: '#F4F7FD',
        borderRadius: 'var(--radius-card)',
        border: '1px dashed var(--border)',
      }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: 'var(--radius-card)',
          background: 'var(--muted)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: 'var(--muted-foreground)',
        }}>
          <Share2 size={22} />
        </div>
        <span style={{
          fontFamily: 'var(--font-family-primary)', fontSize: '14px',
          fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
        }}>
          No relationships to display
        </span>
        <span style={{
          fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
          textAlign: 'center', maxWidth: '320px',
        }}>
          Add employer relationships on the Relationships tab to see them visualised here.
        </span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        border:       '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        overflow:     'hidden',
        background:   '#F4F7FD',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />

      {/* Floating tooltip */}
      {tooltip && (
        <GraphTooltip info={tooltip} canvasW={size.w} canvasH={size.h} />
      )}

      {/* Legend bar */}
      <GraphLegend visibleTypes={visibleTypes} />
    </div>
  );
}
