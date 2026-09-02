import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { loadRegulations } from '../../data/regulationData';
import { loadRegulationRequirements } from '../../data/regulationRequirementData';
import { loadBills } from '../../data/billData';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'effective-date' | 'deadline' | 'review' | 'bill-tracking';
  priority: 'critical' | 'high' | 'medium' | 'low';
  entityId: string;
  entityType: 'regulation' | 'requirement' | 'bill';
}

export function RegulatoryCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [timeframeFilter, setTimeframeFilter] = useState<'30' | '60' | '90' | 'all'>('30');

  useEffect(() => {
    loadCalendarEvents();
  }, []);

  function loadCalendarEvents() {
    const allEvents: CalendarEvent[] = [];
    const today = new Date();

    // Load regulation effective dates
    const regulations = loadRegulations();
    regulations.forEach(reg => {
      if (reg.effectiveDate) {
        const effectiveDate = new Date(reg.effectiveDate);
        if (effectiveDate >= today) {
          allEvents.push({
            id: `reg-${reg.id}`,
            title: `${reg.name} becomes effective`,
            date: reg.effectiveDate,
            type: 'effective-date',
            priority: reg.impactLevel === 'high' ? 'high' : reg.impactLevel === 'critical' ? 'critical' : 'medium',
            entityId: reg.id,
            entityType: 'regulation',
          });
        }
      }
      if (reg.nextReviewDate) {
        const reviewDate = new Date(reg.nextReviewDate);
        if (reviewDate >= today) {
          allEvents.push({
            id: `rev-${reg.id}`,
            title: `Review ${reg.name}`,
            date: reg.nextReviewDate,
            type: 'review',
            priority: 'medium',
            entityId: reg.id,
            entityType: 'regulation',
          });
        }
      }
    });

    // Load requirement deadlines
    const requirements = loadRegulationRequirements();
    requirements.forEach(req => {
      if (req.dueDate) {
        const dueDate = new Date(req.dueDate);
        if (dueDate >= today) {
          allEvents.push({
            id: `req-${req.id}`,
            title: `${req.requirementNumber} - ${req.title}`,
            date: req.dueDate,
            type: 'deadline',
            priority: req.priority,
            entityId: req.id,
            entityType: 'requirement',
          });
        }
      }
    });

    // Load bills in active tracking
    const bills = loadBills();
    bills.forEach(bill => {
      if (bill.priority === 'critical' || bill.priority === 'high') {
        if (!['signed', 'vetoed', 'failed'].includes(bill.status)) {
          allEvents.push({
            id: `bill-${bill.id}`,
            title: `Monitor ${bill.billNumber} - ${bill.status}`,
            date: bill.introducedDate,
            type: 'bill-tracking',
            priority: bill.priority,
            entityId: bill.id,
            entityType: 'bill',
          });
        }
      }
    });

    // Sort by date
    allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setEvents(allEvents);
  }

  function filterEventsByTimeframe(events: CalendarEvent[]): CalendarEvent[] {
    if (timeframeFilter === 'all') return events;

    const today = new Date();
    const daysAhead = parseInt(timeframeFilter);
    const cutoffDate = new Date(today);
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate <= cutoffDate;
    });
  }

  const filteredEvents = filterEventsByTimeframe(events);
  const upcomingCount = filterEventsByTimeframe(events).length;

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '24px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={20} style={{ color: 'var(--primary)' }} />
          <h3
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '18px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: 0,
            }}
          >
            Regulatory Calendar
          </h3>
        </div>

        {/* Timeframe Filter */}
        <select
          value={timeframeFilter}
          onChange={e => setTimeframeFilter(e.target.value as '30' | '60' | '90' | 'all')}
          style={{
            padding: '6px 12px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-input)',
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            background: 'var(--input-background)',
            color: 'var(--foreground)',
          }}
        >
          <option value="30">Next 30 Days</option>
          <option value="60">Next 60 Days</option>
          <option value="90">Next 90 Days</option>
          <option value="all">All Upcoming</option>
        </select>
      </div>

      {/* Summary */}
      <div
        style={{
          padding: '12px',
          background: 'var(--muted)',
          borderRadius: 'var(--radius-card)',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            color: 'var(--foreground)',
          }}
        >
          <strong>{upcomingCount}</strong> upcoming deadline{upcomingCount === 1 ? '' : 's'} and event{upcomingCount === 1 ? '' : 's'}
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div
          style={{
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Calendar size={48} style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--muted-foreground)',
              margin: 0,
            }}
          >
            No upcoming events in this timeframe
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
          {filteredEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({ event }: { event: CalendarEvent }) {
  const eventDate = new Date(event.date);
  const today = new Date();
  const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isUrgent = daysUntil <= 14;
  const isOverdue = daysUntil < 0;

  const typeConfig = {
    'effective-date': { label: 'Effective Date', color: '#1565C0', icon: Calendar },
    deadline: { label: 'Deadline', color: '#E65100', icon: Clock },
    review: { label: 'Review', color: '#6A1B9A', icon: AlertCircle },
    'bill-tracking': { label: 'Bill Monitor', color: '#0277BD', icon: AlertCircle },
  };

  const config = typeConfig[event.type];
  const Icon = config.icon;

  const priorityColors = {
    critical: '#C62828',
    high: '#E65100',
    medium: '#F57F17',
    low: '#388E3C',
  };

  return (
    <div
      style={{
        padding: '12px',
        border: `1px solid ${isUrgent ? priorityColors[event.priority] : 'var(--border)'}`,
        borderRadius: 'var(--radius-card)',
        background: isUrgent ? `${priorityColors[event.priority]}10` : 'var(--card)',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = 'var(--elevation-sm)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-card)',
            background: `${config.color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={18} style={{ color: config.color }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              marginBottom: '4px',
            }}
          >
            {event.title}
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: '100px',
                fontSize: '11px',
                fontFamily: 'var(--font-family-primary)',
                fontWeight: 'var(--font-weight-semibold)',
                background: config.color + '20',
                color: config.color,
              }}
            >
              {config.label}
            </span>

            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                color: isUrgent ? priorityColors[event.priority] : 'var(--muted-foreground)',
                fontWeight: isUrgent ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
              }}
            >
              {eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {' · '}
              {isOverdue
                ? 'Overdue'
                : daysUntil === 0
                  ? 'Today'
                  : daysUntil === 1
                    ? 'Tomorrow'
                    : `in ${daysUntil} days`}
            </span>

            <span
              style={{
                display: 'inline-block',
                padding: '2px 6px',
                borderRadius: '100px',
                fontSize: '10px',
                fontFamily: 'var(--font-family-primary)',
                fontWeight: 'var(--font-weight-semibold)',
                background: priorityColors[event.priority] + '20',
                color: priorityColors[event.priority],
                textTransform: 'uppercase',
              }}
            >
              {event.priority}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
