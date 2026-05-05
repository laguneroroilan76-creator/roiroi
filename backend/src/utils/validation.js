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
  qty: z.string().optional().or(z.literal('')),
  unit: z.string().optional().or(z.literal('')),
  particulars: z.string().optional().or(z.literal('')),
  estimatedCost: z.string().optional().or(z.literal('')),
  availableStocks: z.string().optional().or(z.literal('')),
});

const rrfItemSchema = z.object({
  qty: z.string().optional().or(z.literal('')),
  unit: z.string().optional().or(z.literal('')),
  particulars: z.string().optional().or(z.literal('')),
  estimatedCost: z.string().optional().or(z.literal('')),
  availableStocks: z.string().optional().or(z.literal('')),
});

// PRF schemas
const prfCreateBodySchema = z.object({
  prfNo: z.string().optional().or(z.literal('')),
  rrfNo: z.string().optional().or(z.literal('')), // Alias for backward compatibility
  dateRequested: z.string().optional(),
  dateNeeded: z.string().optional(),
  to: z.string().optional().or(z.literal('')),
  from: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  remarks: z.string().optional().or(z.literal('')),
  preparedBy: z.string().optional().or(z.literal('')),
  verifiedBy: z.string().optional().or(z.literal('')),
  notedBy: z.string().optional().or(z.literal('')),
  approvedBy: z.string().optional().or(z.literal('')),
  status: z.string().optional(),
  requestor: z.string().optional().or(z.literal('')),
  layout: z.string().optional().or(z.literal('')),
  items: z.array(prfItemSchema).optional(),
});



const prfUpdateBodySchema = z.object({
  prfNo: z.string().optional().or(z.literal('')),
  rrfNo: z.string().optional().or(z.literal('')), // Alias for backward compatibility
  dateRequested: z.string().optional(),
  dateNeeded: z.string().optional(),
  to: z.string().optional().or(z.literal('')),
  from: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  remarks: z.string().optional().or(z.literal('')),
  preparedBy: z.string().optional().or(z.literal('')),
  verifiedBy: z.string().optional().or(z.literal('')),
  notedBy: z.string().optional().or(z.literal('')),
  approvedBy: z.string().optional().or(z.literal('')),
  status: z.string().optional(),
  requestor: z.string().optional().or(z.literal('')),
  layout: z.string().optional().or(z.literal('')),
  archivedBy: z.string().optional().nullable(),
  disapprovalReason: z.string().optional().nullable(),
  items: z.array(prfItemSchema).optional(),
});



// RFP schemas
const rrfCreateBodySchema = z.object({
  rfpNo: z.string().optional().or(z.literal('')),
  rrfNo: z.string().optional().or(z.literal('')), // Legacy support
  dateRequested: z.string().optional(),
  dateNeeded: z.string().optional(),
  chargeTo: z.string().optional().or(z.literal('')),
  releaseFundsTo: z.string().optional().or(z.literal('')),
  amount: z.string().optional().or(z.literal('')),
  purpose: z.string().optional().or(z.literal('')),
  poNumber: z.string().optional().or(z.literal('')),
  siNumber: z.string().optional().or(z.literal('')),
  receivedBy: z.string().optional().or(z.literal('')),
  receivedDate: z.string().optional().or(z.literal('')),
  prfNo: z.string().optional().or(z.literal('')),
  status: z.string().optional(),
  requestor: z.string().optional().or(z.literal('')),
  approvedBy: z.string().optional().or(z.literal('')),
  deptHead: z.string().optional().or(z.literal('')),
  items: z.array(rrfItemSchema).optional(),
});



// Trip Ticket schemas
const ticketCreateBodySchema = z.object({
  dateRequested: z.string().optional(),
  requestorName: z.string().optional().or(z.literal('')),
  subsidiary: z.string().optional().or(z.literal('')),
  driver: z.string().optional().or(z.literal('')),
  vehicle: z.string().optional().or(z.literal('')),
  plateNumber: z.string().optional().or(z.literal('')),
  etdOffice: z.string().optional(),
  etaDestination: z.string().optional(),
  dateTimeDeparture: z.string().optional().or(z.literal('')),
  dateTimeReturn: z.string().optional().or(z.literal('')),
  passengersDetail: z.string().optional().or(z.literal('')),
  destination: z.string().optional().or(z.literal('')),
  purpose: z.string().optional().or(z.literal('')),
  medium: z.string().optional().or(z.literal('')),
  requestedBy: z.string().optional().or(z.literal('')),
  endorsedBy: z.string().optional().or(z.literal('')),
  approvedBy: z.string().optional().or(z.literal('')),
  status: z.string().optional(),
  kmOut: z.string().optional().or(z.literal('')),
  kmIn: z.string().optional().or(z.literal('')),
  guardOut: z.string().optional().or(z.literal('')),
  guardIn: z.string().optional().or(z.literal('')),
  hdiPassengers: z.string().optional().or(z.literal('')),
  outsidePassengers: z.string().optional().or(z.literal('')),
  passengerCount: z.string().optional().or(z.literal('')),
});


// Support Ticket schemas
const supportTicketCreateSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional().or(z.literal('')),
  priority: z.string().optional(),
  category: z.string().optional(),
});

const supportTicketUpdateSchema = z.object({
  subject: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  category: z.string().optional(),
  assignedToId: z.number().optional().nullable(),
});


const formatZodErrors = (error) => {
  if (!error || !error.errors) return error?.message || 'Validation error';
  return error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
};


module.exports = {
  validatePassword,
  idParamSchema,
  prfCreateBodySchema,
  prfUpdateBodySchema,
  rrfCreateBodySchema,
  ticketCreateBodySchema,
  supportTicketCreateSchema,
  supportTicketUpdateSchema,
  formatZodErrors
};
