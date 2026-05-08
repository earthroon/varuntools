ALTER TABLE purchase_grants ADD COLUMN variant_id TEXT;
ALTER TABLE purchase_grants ADD COLUMN bundle_id TEXT;
ALTER TABLE purchase_grants ADD COLUMN entitlement_scope_json TEXT;
ALTER TABLE purchase_grants ADD COLUMN license_scope TEXT;

CREATE INDEX IF NOT EXISTS idx_purchase_grants_variant_id
ON purchase_grants(variant_id);

CREATE INDEX IF NOT EXISTS idx_purchase_grants_bundle_id
ON purchase_grants(bundle_id);

CREATE INDEX IF NOT EXISTS idx_purchase_grants_product_variant
ON purchase_grants(product_slug, variant_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_purchase_grants_order_product_entitlement
ON purchase_grants(order_id, product_slug, COALESCE(variant_id, ''), COALESCE(bundle_id, ''));
