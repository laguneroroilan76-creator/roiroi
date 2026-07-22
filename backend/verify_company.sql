SELECT id, email, company_id, company.name FROM "user" LEFT JOIN company ON "user".company_id = company.id WHERE company_id IS NOT NULL;
