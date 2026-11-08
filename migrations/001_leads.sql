CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  service TEXT NOT NULL CHECK (service IN ('cleaning', 'repair', 'consultation', 'other')),
  message TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('booking', 'question', 'complaint', 'other')),
  urgency TEXT NOT NULL CHECK (urgency IN ('high', 'normal', 'low')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'won', 'lost')),
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC, id DESC);
