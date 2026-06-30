function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('zh-HK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function daysUntil(date) {
  if (!date) return null;
  const due = new Date(date);
  due.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((due - now) / 86400000);
}

function dateUrgency(date) {
  const days = daysUntil(date);
  if (days === null) return 'none';
  if (days < 7) return 'red';
  if (days < 14) return 'yellow';
  return 'ok';
}

function machineUrgency(diffuser) {
  const oil = dateUrgency(diffuser.nextOilChange);
  const battery = dateUrgency(diffuser.nextBatteryChange);
  if (oil === 'red' || battery === 'red') return 'red';
  if (oil === 'yellow' || battery === 'yellow') return 'yellow';
  return 'ok';
}

function getMaintenanceAlerts(diffuser) {
  const alerts = [];
  if (diffuser.nextOilChange) {
    const level = dateUrgency(diffuser.nextOilChange);
    if (level === 'yellow' || level === 'red') {
      alerts.push({
        type: 'oil',
        label: '換油',
        days: daysUntil(diffuser.nextOilChange),
        date: diffuser.nextOilChange,
        level,
      });
    }
  }
  if (diffuser.nextBatteryChange) {
    const level = dateUrgency(diffuser.nextBatteryChange);
    if (level === 'yellow' || level === 'red') {
      alerts.push({
        type: 'battery',
        label: '換電',
        days: daysUntil(diffuser.nextBatteryChange),
        date: diffuser.nextBatteryChange,
        level,
      });
    }
  }
  return alerts;
}

function groupDiffusersByLocation(diffusers, { dueOnly = false } = {}) {
  const map = new Map();

  for (const diffuser of diffusers) {
    const item = {
      diffuser,
      urgency: machineUrgency(diffuser),
      alerts: getMaintenanceAlerts(diffuser),
    };
    if (dueOnly && item.alerts.length === 0) continue;

    const loc = diffuser.location;
    const key = loc._id.toString();
    if (!map.has(key)) map.set(key, { location: loc, items: [] });
    map.get(key).items.push(item);
  }

  return Array.from(map.values()).sort((a, b) =>
    a.location.name.localeCompare(b.location.name, 'zh-HK')
  );
}

function isOverdue(date) {
  const days = daysUntil(date);
  return days !== null && days < 0;
}

function isDueSoon(date, days = 14) {
  const until = daysUntil(date);
  return until !== null && until >= 0 && until < days;
}

function dueStatus(date) {
  const days = daysUntil(date);
  if (days === null) return 'none';
  if (days < 0) return 'overdue';
  if (days < 7) return 'urgent';
  if (days < 14) return 'soon';
  return 'ok';
}

module.exports = {
  addMonths,
  formatDate,
  daysUntil,
  dateUrgency,
  machineUrgency,
  getMaintenanceAlerts,
  groupDiffusersByLocation,
  isOverdue,
  isDueSoon,
  dueStatus,
};
