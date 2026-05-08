ALTER TABLE webhook_events ADD COLUMN status TEXT NOT NULL DEFAULT 'received';
ALTER TABLE webhook_events ADD COLUMN result_code TEXT;
ALTER TABLE webhook_events ADD COLUMN grant_id TEXT;
ALTER TABLE webhook_events ADD COLUMN error_message TEXT;
ALTER TABLE webhook_events ADD COLUMN received_at TEXT;
ALTER TABLE webhook_events ADD COLUMN updated_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_purchase_grants_order_product
ON purchase_grants(order_id, product_slug);

CREATE INDEX IF NOT EXISTS idx_webhook_events_status
ON webhook_events(status);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_id
ON purchase_orders(order_id);
