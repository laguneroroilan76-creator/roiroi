INSERT INTO company (name) SELECT DISTINCT company FROM "user" WHERE company IS NOT NULL AND company NOT IN (SELECT name FROM company);
UPDATE "user" SET companyId = (SELECT id FROM company WHERE company.name = "user".company) WHERE company IS NOT NULL;
SELECT id, email, company, companyId FROM "user" WHERE company IS NOT NULL;
