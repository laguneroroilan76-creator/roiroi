const { z } = require('zod');

const validatePassword = (password) => {
  const hasCapital = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  if (password.length < 8) return "Password must be at least 8 characters long.";
  if (!hasCapital) return "Password must contain at least one capital letter.";
  if (!hasSpecial) return "Password must contain at least one special character.";
  return null;
};

// Common ID schema
const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a number").transform(Number),
});

// Item schemas
const prfItemSchema = z.object({
  qty: z.string().optional().nullable().or(z.literal('')),
  unit: z.string().optional().nullable().or(z.literal('')),
  particulars: z.string().optional().nullable().or(z.literal('')),
  estimatedCost: z.string().optional().nullable().or(z.literal('')),
  availableStocks: z.string().optional().nullable().or(z.literal('')),
});

const rfpItemSchema = z.object({
  qty: z.string().optional().nullable().or(z.literal('')),
  unit: z.string().optional().nullable().or(z.literal('')),
  particulars: z.string().optional().nullable().or(z.literal('')),
  estimatedCost: z.string().optional().nullable().or(z.literal('')),
  availableStocks: z.string().optional().nullable().or(z.literal('')),
});

// PRF schemas
const prfCreateBodySchema = z.object({
  prfNo: z.string().optional().nullable().or(z.literal('')),
  rfpNo: z.string().optional().nullable().or(z.literal('')), // Alias for backward compatibility
  dateRequested: z.string().optional().nullable(),
  dateNeeded: z.string().optional().nullable(),
  to: z.string().optional().nullable().or(z.literal('')),
  from: z.string().optional().nullable().or(z.literal('')),
  department: z.string().optional().nullable().or(z.literal('')),
  company: z.string().optional().nullable().or(z.literal('')),
  remarks: z.string().optional().nullable().or(z.literal('')),
  preparedBy: z.string().optional().nullable().or(z.literal('')),
  verifiedBy: z.string().optional().nullable().or(z.literal('')),
  notedBy: z.string().optional().nullable().or(z.literal('')),
  approvedBy: z.string().optional().nullable().or(z.literal('')),
  status: z.string().optional().nullable(),
  requestor: z.string().optional().nullable().or(z.literal('')),
  layout: z.string().optional().nullable().or(z.literal('')),
  items: z.array(prfItemSchema).optional().nullable(),
});



const prfUpdateBodySchema = z.object({
  prfNo: z.string().optional().nullable().or(z.literal('')),
  rfpNo: z.string().optional().nullable().or(z.literal('')), // Alias for backward compatibility
  dateRequested: z.string().optional().nullable(),
  dateNeeded: z.string().optional().nullable(),
  to: z.string().optional().nullable().or(z.literal('')),
  from: z.string().optional().nullable().or(z.literal('')),
  department: z.string().optional().nullable().or(z.literal('')),
  company: z.string().optional().nullable().or(z.literal('')),
  remarks: z.string().optional().nullable().or(z.literal('')),
  preparedBy: z.string().optional().nullable().or(z.literal('')),
  verifiedBy: z.string().optional().nullable().or(z.literal('')),
  notedBy: z.string().optional().nullable().or(z.literal('')),
  approvedBy: z.string().optional().nullable().or(z.literal('')),
// status is stripped from payloads for security
  requestor: z.string().optional().nullable().or(z.literal('')),
  layout: z.string().optional().nullable().or(z.literal('')),
  archivedBy: z.string().optional().nullable(),
  disapprovalReason: z.string().optional().nullable(),
  items: z.array(prfItemSchema).optional().nullable(),
});



// RFP schemas
const rfpCreateBodySchema = z.object({
  rfpNo: z.string().optional().nullable().or(z.literal('')),
  rfpNo: z.string().optional().nullable().or(z.literal('')), // Legacy support
  dateRequested: z.string().optional().nullable(),
  dateNeeded: z.string().optional().nullable(),
  chargeTo: z.string().optional().nullable().or(z.literal('')),
  releaseFundsTo: z.string().optional().nullable().or(z.literal('')),
  amount: z.string().optional().nullable().or(z.literal('')),
  purpose: z.string().optional().nullable().or(z.literal('')),
  poNumber: z.string().optional().nullable().or(z.literal('')),
  siNumber: z.string().optional().nullable().or(z.literal('')),
  receivedBy: z.string().optional().nullable().or(z.literal('')),
  receivedDate: z.string().optional().nullable().or(z.literal('')),
  prfNo: z.string().optional().nullable().or(z.literal('')),
  status: z.string().optional().nullable(),
  requestor: z.string().optional().nullable().or(z.literal('')),
  approvedBy: z.string().optional().nullable().or(z.literal('')),
  deptHead: z.string().optional().nullable().or(z.literal('')),
  items: z.array(rfpItemSchema).optional().nullable(),
});



// Trip Ticket schemas
const ticketCreateBodySchema = z.object({
  dateRequested: z.string().optional().nullable(),
  requestorName: z.string().optional().nullable().or(z.literal('')),
  subsidiary: z.string().optional().nullable().or(z.literal('')),
  driver: z.string().optional().nullable().or(z.literal('')),
  vehicle: z.string().optional().nullable().or(z.literal('')),
  plateNumber: z.string().optional().nullable().or(z.literal('')),
  etdOffice: z.string().optional().nullable(),
  etaDestination: z.string().optional().nullable(),
  dateTimeDeparture: z.string().optional().nullable().or(z.literal('')),
  dateTimeReturn: z.string().optional().nullable().or(z.literal('')),
  passengersDetail: z.string().optional().nullable().or(z.literal('')),
  destination: z.string().optional().nullable().or(z.literal('')),
  purpose: z.string().optional().nullable().or(z.literal('')),
  medium: z.string().optional().nullable().or(z.literal('')),
  requestedBy: z.string().optional().nullable().or(z.literal('')),
  endorsedBy: z.string().optional().nullable().or(z.literal('')),
  approvedBy: z.string().optional().nullable().or(z.literal('')),
  status: z.string().optional().nullable(),
  kmOut: z.string().optional().nullable().or(z.literal('')),
  kmIn: z.string().optional().nullable().or(z.literal('')),
  guardOut: z.string().optional().nullable().or(z.literal('')),
  guardIn: z.string().optional().nullable().or(z.literal('')),
  hdiPassengers: z.string().optional().nullable().or(z.literal('')),
  outsidePassengers: z.string().optional().nullable().or(z.literal('')),
  passengerCount: z.string().optional().nullable().or(z.literal('')),
});


// Support Ticket schemas
const supportTicketCreateSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional().nullable().or(z.literal('')),
  priority: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
});

const supportTicketUpdateSchema = z.object({
  subject: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  priority: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  assignedToId: z.number().optional().nullable(),
  resolvedById: z.number().optional().nullable(),
  resolutionNotes: z.string().optional().nullable(),
});


const formatZodErrors = (error) => {
  if (!error || !error.errors) return error?.message || 'Validation error';
  return error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
};

const parseLocalDateOnly = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return null;
  const datePart = dateString.split('T')[0];
  const parts = datePart.split('-').map(Number);
  if (parts.length !== 3 || parts.some((value) => !Number.isInteger(value))) return null;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
};

const isPastLocalDate = (dateString) => {
  const dateOnly = parseLocalDateOnly(dateString);
  if (!dateOnly) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return dateOnly < today;
};

const validateTripTicketDates = (data) => {
  const errors = [];
  if (data.dateRequested && isPastLocalDate(data.dateRequested)) {
    errors.push({ path: ['dateRequested'], message: 'You cannot select a past date for Date Requested.' });
  }
  if (data.etdOffice && isPastLocalDate(data.etdOffice)) {
    errors.push({ path: ['etdOffice'], message: 'You cannot select a past date for ETD.' });
  }
  if (data.etaDestination && isPastLocalDate(data.etaDestination)) {
    errors.push({ path: ['etaDestination'], message: 'You cannot select a past date for ETA.' });
  }
  return errors;
};

module.exports = {
  validatePassword,
  idParamSchema,
  prfCreateBodySchema,
  prfUpdateBodySchema,
  rfpCreateBodySchema,
  ticketCreateBodySchema,
  supportTicketCreateSchema,
  supportTicketUpdateSchema,
  formatZodErrors,
  validateTripTicketDates
};
