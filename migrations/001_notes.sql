CREATE TABLE notes (
  id text PRIMARY KEY,
  title varchar(200) NOT NULL CHECK (length(trim(title)) > 0),
  description varchar(2000) NOT NULL DEFAULT '',
  content text NOT NULL CHECK (length(content) <= 100000),
  tags text[] NOT NULL DEFAULT '{}',
  position integer NOT NULL CHECK (position >= 0),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notes_position_unique UNIQUE (position) DEFERRABLE INITIALLY DEFERRED
);
CREATE TABLE data_imports (name text PRIMARY KEY, imported_at timestamptz NOT NULL DEFAULT now());
