-- PostgreSQL schema for Supabase
-- Run this in: Supabase Dashboard -> SQL Editor

-- Enum types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('User', 'Admin', 'Driver', 'Guard', 'Accounting', 'IT');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'department_role') THEN
    CREATE TYPE department_role AS ENUM ('President', 'DepartmentHead', 'ImmediateSupervisor', 'Staff');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS company (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS department (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    company_id INTEGER,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    is_accounting BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT department_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS department_name_company_id_key ON department(name, company_id);

CREATE TABLE IF NOT EXISTS "user" (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    can_approve BOOLEAN NOT NULL DEFAULT false,
    can_approve_prf BOOLEAN NOT NULL DEFAULT false,
    can_approve_trip_ticket BOOLEAN NOT NULL DEFAULT false,
    can_approve_rfp BOOLEAN NOT NULL DEFAULT false,
    can_approve_dept_head BOOLEAN NOT NULL DEFAULT false,
    can_endorse BOOLEAN NOT NULL DEFAULT false,
    can_verify BOOLEAN NOT NULL DEFAULT false,
    signature_url TEXT,
    avatar_url TEXT,
    theme_color TEXT DEFAULT '#0f172a',
    is_dark_mode BOOLEAN NOT NULL DEFAULT false,
    role user_role NOT NULL DEFAULT 'User',
    status TEXT NOT NULL DEFAULT 'Active',
    inactive_reason TEXT,
    company_id INTEGER,
    department_id INTEGER,
    department_role department_role,
    is_driver BOOLEAN NOT NULL DEFAULT false,
    is_rfp_approver BOOLEAN NOT NULL DEFAULT false,
    is_security_guard BOOLEAN NOT NULL DEFAULT false,
    is_it_specialist BOOLEAN NOT NULL DEFAULT false,
    permissions JSONB,
    CONSTRAINT user_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE SET NULL,
    CONSTRAINT user_department_id_fkey FOREIGN KEY (department_id) REFERENCES department(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS user_company_id_idx ON "user"(company_id);
CREATE INDEX IF NOT EXISTS user_department_id_idx ON "user"(department_id);

CREATE TABLE IF NOT EXISTS activitylog (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id INTEGER NOT NULL,
    details TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT activitylog_user_id_fkey FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS activitylog_user_id_idx ON activitylog(user_id);

CREATE TABLE IF NOT EXISTS audittrail (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id INTEGER NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    hash TEXT,
    previous_hash TEXT,
    CONSTRAINT audittrail_user_id_fkey FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS audittrail_user_id_idx ON audittrail(user_id);

CREATE TABLE IF NOT EXISTS driver (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicle (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    plate_number TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    year TEXT,
    color TEXT,
    fuel_type TEXT,
    transmission TEXT,
    engine_number TEXT,
    chassis_number TEXT,
    capacity INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    company_id INTEGER,
    department_id INTEGER,
    CONSTRAINT vehicle_company_id_fkey FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE SET NULL,
    CONSTRAINT vehicle_department_id_fkey FOREIGN KEY (department_id) REFERENCES department(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS reminder (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    "date" TIMESTAMP NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    CONSTRAINT reminder_user_id_fkey FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS reminder_user_id_idx ON reminder(user_id);

CREATE TABLE IF NOT EXISTS task (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT false,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT task_user_id_fkey FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS task_user_id_idx ON task(user_id);

CREATE TABLE IF NOT EXISTS notification (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'INFO',
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    target_role TEXT,
    target_user_id INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notification_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS notification_target_user_id_idx ON notification(target_user_id);

CREATE TABLE IF NOT EXISTS supportticket (
    id SERIAL PRIMARY KEY,
    subject TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',
    priority TEXT NOT NULL DEFAULT 'Medium',
    category TEXT NOT NULL DEFAULT 'Others',
    author_id INTEGER NOT NULL,
    assigned_to_id INTEGER,
    resolved_by_id INTEGER,
    resolution_notes TEXT,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT supportticket_author_id_fkey FOREIGN KEY (author_id) REFERENCES "user"(id) ON DELETE CASCADE,
    CONSTRAINT supportticket_assigned_to_id_fkey FOREIGN KEY (assigned_to_id) REFERENCES "user"(id) ON DELETE SET NULL,
    CONSTRAINT supportticket_resolved_by_id_fkey FOREIGN KEY (resolved_by_id) REFERENCES "user"(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS supportmessage (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT supportmessage_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES supportticket(id) ON DELETE CASCADE,
    CONSTRAINT supportmessage_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tripticket (
    id SERIAL PRIMARY KEY,
    date_requested TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    requestor_id INTEGER,
    subsidiary TEXT,
    driver_id INTEGER,
    vehicle TEXT,
    vehicle_id INTEGER,
    plate_number TEXT,
    etd_office TEXT,
    eta_destination TEXT,
    date_time_departure TIMESTAMP,
    date_time_return TIMESTAMP,
    passengers_detail TEXT,
    destination TEXT,
    purpose TEXT,
    medium TEXT,
    requested_by_id INTEGER,
    endorsed_by_id INTEGER,
    approved_by_id INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    layout TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',
    author_id INTEGER,
    guard_in_id INTEGER,
    guard_out_id INTEGER,
    km_in TEXT,
    km_out TEXT,
    hdi_passengers TEXT,
    outside_passengers TEXT,
    passenger_count TEXT,
    archived_by_id INTEGER,
    disapproval_reason TEXT,
    CONSTRAINT tripticket_requestor_id_fkey FOREIGN KEY (requestor_id) REFERENCES "user"(id) ON DELETE SET NULL,
    CONSTRAINT tripticket_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES "user"(id) ON DELETE SET NULL,
    CONSTRAINT tripticket_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES vehicle(id) ON DELETE SET NULL,
    CONSTRAINT tripticket_requested_by_id_fkey FOREIGN KEY (requested_by_id) REFERENCES "user"(id) ON DELETE SET NULL,
    CONSTRAINT tripticket_endorsed_by_id_fkey FOREIGN KEY (endorsed_by_id) REFERENCES "user"(id) ON DELETE SET NULL,
    CONSTRAINT tripticket_approved_by_id_fkey FOREIGN KEY (approved_by_id) REFERENCES "user"(id) ON DELETE SET NULL,
    CONSTRAINT tripticket_guard_in_id_fkey FOREIGN KEY (guard_in_id) REFERENCES "user"(id) ON DELETE SET NULL,
    CONSTRAINT tripticket_guard_out_id_fkey FOREIGN KEY (guard_out_id) REFERENCES "user"(id) ON DELETE SET NULL,
    CONSTRAINT tripticket_archived_by_id_fkey FOREIGN KEY (archived_by_id) REFERENCES "user"(id) ON DELETE SET NULL,
    CONSTRAINT tripticket_author_id_fkey FOREIGN KEY (author_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS tripticket_author_id_idx ON tripticket(author_id);

CREATE TABLE IF NOT EXISTS prf (
    id SERIAL PRIMARY KEY,
    prf_no TEXT,
    date_requested TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_needed TIMESTAMP,
    "to" TEXT,
    "from" TEXT,
    remarks TEXT,
    quotation_summary TEXT,
    prepared_by_id INTEGER,
    verified_by_id INTEGER,
    noted_by_id INTEGER,
    approved_by_id INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    layout TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',
    author_id INTEGER,
    requestor_id INTEGER,
    department TEXT,
    company TEXT,
    archived_by_id INTEGER,
    disapproval_reason TEXT,
    CONSTRAINT prf_prepared_by_id_fkey FOREIGN KEY (prepared_by_id) REFERENCES "user"(id) ON DELETE SET NULL,
    CONSTRAINT prf_verified_by_id_fkey FOREIGN KEY (verified_by_id) REFERENCES "user"(id) ON DELETE SET NULL,
    CONSTRAINT prf_noted_by_id_fkey FOREIGN KEY (noted_by_id) REFERENCES "user"(id) ON DELETE SET NULL,
    CONSTRAINT prf_approved_by_id_fkey FOREIGN KEY (approved_by_id) REFERENCES "user"(id) ON DELETE SET NULL,
    CONSTRAINT prf_requestor_id_fkey FOREIGN KEY (requestor_id) REFERENCES "user"(id) ON DELETE SET NULL,
    CONSTRAINT prf_archived_by_id_fkey FOREIGN KEY (archived_by_id) REFERENCES "user"(id) ON DELETE SET NULL,
    CONSTRAINT prf_author_id_fkey FOREIGN KEY (author_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS prf_author_id_idx ON prf(author_id);

CREATE TABLE IF NOT EXISTS prfitem (
    id SERIAL PRIMARY KEY,
    qty TEXT,
    unit TEXT,
    particulars TEXT,
    estimated_cost TEXT,
    available_stocks TEXT,
    prf_id INTEGER NOT NULL,
    CONSTRAINT prfitem_prf_id_fkey FOREIGN KEY (prf_id) REFERENCES prf(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS prfitem_prf_id_idx ON prfitem(prf_id);

CREATE TABLE IF NOT EXISTS rfp (
    id SERIAL PRIMARY KEY,
    rfp_no TEXT,
    requestor_id INTEGER,
    date_requested TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_needed TIMESTAMP,
    "from" TEXT,
    department TEXT,
    company TEXT,
    remarks TEXT,
    prepared_by_id INTEGER,
    verified_by_id INTEGER,
    approved_by_id INTEGER,
    layout TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',
    author_id INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    archived_by_id INTEGER,
    received_by TEXT,
    received_date TIMESTAMP,
    disapproval_reason TEXT,
    CONSTRAINT rfp_requestor_id_fkey FOREIGN KEY (requestor_id) REFERENCES "user"(id) ON DELETE SET NULL,
    CONSTRAINT rfp_prepared_by_id_fkey FOREIGN KEY (prepared_by_id) REFERENCES "user"(id) ON DELETE SET NULL,
    CONSTRAINT rfp_verified_by_id_fkey FOREIGN KEY (verified_by_id) REFERENCES "user"(id) ON DELETE SET NULL,
    CONSTRAINT rfp_approved_by_id_fkey FOREIGN KEY (approved_by_id) REFERENCES "user"(id) ON DELETE SET NULL,
    CONSTRAINT rfp_archived_by_id_fkey FOREIGN KEY (archived_by_id) REFERENCES "user"(id) ON DELETE SET NULL,
    CONSTRAINT rfp_author_id_fkey FOREIGN KEY (author_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS rfp_author_id_idx ON rfp(author_id);

CREATE TABLE IF NOT EXISTS rfpitem (
    id SERIAL PRIMARY KEY,
    qty TEXT,
    unit TEXT,
    particulars TEXT,
    estimated_cost TEXT,
    available_stocks TEXT,
    rfp_id INTEGER NOT NULL,
    CONSTRAINT rfpitem_rfp_id_fkey FOREIGN KEY (rfp_id) REFERENCES rfp(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS rfpitem_rfp_id_idx ON rfpitem(rfp_id);

-- Trigger function for updatedAt columns
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updatedAt
CREATE TRIGGER user_updated_at BEFORE UPDATE ON "user" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER supportticket_updated_at BEFORE UPDATE ON supportticket FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
