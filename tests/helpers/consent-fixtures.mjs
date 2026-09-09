// Legacy workflow suites assume consent was verified before their scenario.
// This trigger exists only in each test's in-memory database. Privacy tests do not use it.
export function installConsentFixtures(sql){sql.exec(`CREATE TRIGGER fixture_verified_consent AFTER INSERT ON accounts BEGIN INSERT OR IGNORE INTO family_consents(account_id,version,status,squads,requested_at,verified_at,method,reference) VALUES(NEW.id,'family-privacy-2026-09-09-v1','verified',1,'fixture','fixture','signed_form','Synthetic fixture only'); END;`);}
