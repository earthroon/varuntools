CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  received_at TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN (
      'new',
      'triaged',
      'in-progress',
      'waiting-reply',
      'closed',
      'spam'
    )),

  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN (
      'low',
      'normal',
      'high',
      'urgent'
    )),

  category TEXT NOT NULL,
  nickname TEXT,
  email TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  related_product_slug TEXT,
  source_path TEXT,
  source_url TEXT,

  client_fingerprint TEXT,
  user_agent TEXT,
  ip_hash TEXT,

  payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inquiry_events (
  id TEXT PRIMARY KEY,
  inquiry_id TEXT NOT NULL,

  created_at TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'received',
    'validated',
    'stored',
    'status-changed',
    'priority-changed',
    'note-added',
    'marked-spam',
    'closed'
  )),
  note TEXT,
  actor TEXT,

  metadata_json TEXT,

  FOREIGN KEY (inquiry_id)
    REFERENCES inquiries(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_inquiries_status
  ON inquiries(status);

CREATE INDEX IF NOT EXISTS idx_inquiries_priority
  ON inquiries(priority);

CREATE INDEX IF NOT EXISTS idx_inquiries_category
  ON inquiries(category);

CREATE INDEX IF NOT EXISTS idx_inquiries_created_at
  ON inquiries(created_at);

CREATE INDEX IF NOT EXISTS idx_inquiry_events_inquiry_id
  ON inquiry_events(inquiry_id);
