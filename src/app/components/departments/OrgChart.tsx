import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ZoomIn, ZoomOut, Maximize2, Move as MoveIcon } from 'lucide-react';
import { UserChip } from '../shared/UserPicker';
import type { Department, DeptType } from '../../data/departmentData';
import { getDeptChildren, getDeptRoots } from '../../data/departmentData';
import { MOCK_USERS } from '../../data/mockData';

// ─── Layout constants ──────────────────────────────────────────────────────────

const NODE_W = 218;
const NODE_H = 130;
const GAP_X = 28;
const GAP_Y = 72;
const MARGIN = 40;

// ─── Type colors ──────────────────────────────────────────────────────────────

const TYPE_STYLE: Record<DeptType, { bg: string; border: string; text: string; chipBg: string }> = {
  Division:   { bg: 'var(--card)', border: '#4338CA', text: '#4338CA', chipBg: '#EEF2FF' },
  Department: { bg: 'var(--card)', border: '#0369A1', text: '#0369A1', chipBg: '#E0F2FE' },
  Team:       { bg: 'var(--card)', border: '#065F46', text: '#065F46', chipBg: '#D1FAE5' },
  Unit:       { bg: 'var(--card)', border: '#4B5563', text: '#4B5563', chipBg: '#F3F4F6' },
};

// ─── Layout engine ────────────────────────────────────────────────────────────

interface NodePos {
  dept: Department;
  x: number;   // left edge of card
  y: number;   // top edge of card
  cx: number;  // horizontal center (for connector anchors)
}

function subtreeWidth(allDepts: Department[], id: string): number {
  const children = getDeptChildren(allDepts, id);
  if (children.length === 0) return NODE_W;
  const childrenTotal = children.reduce(
    (sum, c, i) => sum + subtreeWidth(allDepts, c.id) + (i < children.length - 1 ? GAP_X : 0),
    0
  );
  return Math.max(NODE_W, childrenTotal);
}

function computeLayout(allDepts: Department[]): NodePos[] {
  const positions: NodePos[] = [];
  const roots = getDeptRoots(allDepts);

  function place(dept: Department, x: number, y: number) {
    const sw = subtreeWidth(allDepts, dept.id);
    const cx = x + sw / 2;
    positions.push({ dept, x: cx - NODE_W / 2, y, cx });

    const children = getDeptChildren(allDepts, dept.id);
    let childX = x;
    for (const child of children) {
      const csw = subtreeWidth(allDepts, child.id);
      place(child, childX, y + NODE_H + GAP_Y);
      childX += csw + GAP_X;
    }
  }

  let startX = MARGIN;
  for (const root of roots) {
    place(root, startX, MARGIN);
    startX += subtreeWidth(allDepts, root.id) + GAP_X * 3;
  }

  return positions;
}

// ─── Org chart ────────────────────────────────────────────────────────────────

interface OrgChartProps {
  allDepts: Department[];
  onMove: (dept: Department) => void;
}

export function OrgChart({ allDepts, onMove }: OrgChartProps) {
  const navigate = useNavigate();
  const [zoom, setZoom] = useState(1);

  const positions = computeLayout(allDepts);
  const posMap = new Map<string, NodePos>(positions.map(p => [p.dept.id, p]));

  const canvasW = positions.reduce((m, p) => Math.max(m, p.x + NODE_W), 0) + MARGIN;
  const canvasH = positions.reduce((m, p) => Math.max(m, p.y + NODE_H), 0) + MARGIN;

  return (
    <div style={{ position: 'relative' }}>
      {/* Zoom controls */}
      <div style={{
        position: 'absolute', top: '12px', right: '12px', zIndex: 10,
        display: 'flex', gap: '2px', alignItems: 'center',
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '3px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <ZoomButton title="Zoom in"  onClick={() => setZoom(z => Math.min(1.6, +(z + 0.1).toFixed(1)))}><ZoomIn  size={13} /></ZoomButton>
        <ZoomButton title="Reset"    onClick={() => setZoom(1)}><Maximize2 size={13} /></ZoomButton>
        <ZoomButton title="Zoom out" onClick={() => setZoom(z => Math.max(0.4, +(z - 0.1).toFixed(1)))}><ZoomOut size={13} /></ZoomButton>
        <span style={{
          fontFamily: 'var(--font-family-mono, monospace)', fontSize: '11px',
          color: 'var(--muted-foreground)', paddingLeft: '4px', paddingRight: '4px',
          minWidth: '34px', textAlign: 'center',
        }}>
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Scrollable viewport */}
      <div style={{
        overflow: 'auto',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        background: 'var(--muted)',
        minHeight: '320px',
        maxHeight: '640px',
      }}>
        {/* Scaled canvas wrapper — outer div sets the scroll extent */}
        <div style={{ width: canvasW * zoom, height: canvasH * zoom, position: 'relative' }}>
          {/* Inner div is the actual scaled surface */}
          <div style={{
            position: 'absolute', top: 0, left: 0,
            width: canvasW, height: canvasH,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}>
            {/* SVG connector layer */}
            <svg
              width={canvasW}
              height={canvasH}
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="6" markerHeight="6"
                  refX="3" refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L6,3 z" fill="var(--border)" />
                </marker>
              </defs>
              {positions.map(pos => {
                const parent = posMap.get(pos.dept.parentId);
                if (!parent) return null;
                const x1 = parent.cx;
                const y1 = parent.y + NODE_H;
                const x2 = pos.cx;
                const y2 = pos.y;
                const midY = y1 + (y2 - y1) * 0.5;
                return (
                  <path
                    key={`edge-${pos.dept.id}`}
                    d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="1.5"
                    strokeDasharray="none"
                  />
                );
              })}
            </svg>

            {/* Node cards */}
            {positions.map(pos => {
              const { dept } = pos;
              const ts = TYPE_STYLE[dept.type];
              const lead = MOCK_USERS.find(u => u.id === dept.leadId) ?? null;
              const childCount = getDeptChildren(allDepts, dept.id).length;

              return (
                <div
                  key={dept.id}
                  style={{
                    position: 'absolute',
                    left: pos.x,
                    top: pos.y,
                    width: NODE_W,
                    minHeight: NODE_H,
                    background: ts.bg,
                    border: `1px solid ${ts.border}`,
                    borderLeft: `4px solid ${ts.border}`,
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  {/* Card body — click to navigate */}
                  <div
                    onClick={() => navigate(`/departments/${dept.id}`)}
                    style={{
                      flex: 1, padding: '10px 10px 6px 10px',
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '5px',
                    }}
                  >
                    <div style={{
                      display: 'flex', alignItems: 'flex-start',
                      justifyContent: 'space-between', gap: '6px',
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-family-primary)', fontSize: '13px',
                        fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                        lineHeight: '1.25', flex: 1, wordBreak: 'break-word',
                      }}>
                        {dept.name}
                      </span>
                      <code style={{
                        fontFamily: 'var(--font-family-mono, monospace)', fontSize: '10px',
                        color: ts.text, background: ts.chipBg, padding: '1px 5px',
                        borderRadius: '3px', flexShrink: 0, letterSpacing: '0.05em',
                      }}>
                        {dept.code}
                      </code>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', height: '16px',
                        padding: '0 6px', borderRadius: '100px',
                        background: ts.chipBg, color: ts.text,
                        fontSize: '10px', fontWeight: 'var(--font-weight-semibold)',
                        whiteSpace: 'nowrap',
                      }}>
                        {dept.type}
                      </span>
                      {childCount > 0 && (
                        <span style={{
                          fontSize: '10px', color: 'var(--muted-foreground)',
                          fontFamily: 'var(--font-family-primary)',
                        }}>
                          {childCount} {childCount === 1 ? 'report' : 'reports'}
                        </span>
                      )}
                    </div>

                    {lead && (
                      <div style={{ marginTop: '1px' }}>
                        <UserChip user={lead} size="sm" />
                      </div>
                    )}
                  </div>

                  {/* Card footer */}
                  <div style={{
                    display: 'flex', borderTop: `1px solid ${ts.border}22`,
                    background: `${ts.chipBg}CC`,
                  }}>
                    <button
                      onClick={() => navigate(`/departments/${dept.id}`)}
                      style={{
                        flex: 1, border: 'none', background: 'transparent',
                        cursor: 'pointer', padding: '5px 0',
                        fontFamily: 'var(--font-family-primary)', fontSize: '10px',
                        fontWeight: 'var(--font-weight-semibold)', color: ts.text,
                        letterSpacing: '0.02em',
                      }}
                    >
                      View
                    </button>
                    <div style={{ width: '1px', background: `${ts.border}33`, flexShrink: 0 }} />
                    <button
                      onClick={e => { e.stopPropagation(); onMove(dept); }}
                      style={{
                        flex: 1, border: 'none', background: 'transparent',
                        cursor: 'pointer', padding: '5px 0',
                        fontFamily: 'var(--font-family-primary)', fontSize: '10px',
                        fontWeight: 'var(--font-weight-semibold)', color: ts.text,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px',
                        letterSpacing: '0.02em',
                      }}
                    >
                      <MoveIcon size={10} />
                      Move
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Zoom button ──────────────────────────────────────────────────────────────

function ZoomButton({
  children, onClick, title,
}: {
  children: React.ReactNode; onClick: () => void; title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: '26px', height: '26px', border: 'none', background: 'transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--muted-foreground)', borderRadius: '6px',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--muted)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      {children}
    </button>
  );
}
