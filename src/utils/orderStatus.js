const STATUS_LABELS_AR = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  preparing: 'قيد التحضير',
  out_for_delivery: 'في الطريق للتوصيل',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي'
};

const ALLOWED_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: []
};

function statusLabel(status) {
  return STATUS_LABELS_AR[status] || status;
}

function isValidTransition(currentStatus, newStatus) {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
}

function nextPossibleStatuses(currentStatus) {
  return ALLOWED_TRANSITIONS[currentStatus] || [];
}

module.exports = {
  statusLabel,
  STATUS_LABELS_AR,
  isValidTransition,
  nextPossibleStatuses,
  ALLOWED_TRANSITIONS
};
