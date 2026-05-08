
CREATE TABLE IF NOT EXISTS purchase_orders (
  order_id TEXT PRIMARY KEY,
  payment_key TEXT NOT NULL UNIQUE,
  product_slug TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL,
  buyer_email TEXT,
  raw_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS purchase_grants (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_slug TEXT NOT NULL,
  deliverable_ids_json TEXT NOT NULL,
  buyer_email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TEXT,
  max_downloads INTEGER,
  download_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(order_id) REFERENCES purchase_orders(order_id)
);

CREATE TABLE IF NOT EXISTS webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  payment_key TEXT,
  order_id TEXT,
  raw_json TEXT NOT NULL,
  processed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_purchase_grants_order_id ON purchase_grants(order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_grants_status ON purchase_grants(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_payment_key ON webhook_events(payment_key);
