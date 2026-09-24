CREATE TABLE note_history (
  revision_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id text NOT NULL,
  note_id text NOT NULL,
  operation text NOT NULL CHECK (operation IN ('baseline','create','update','delete')),
  snapshot jsonb NOT NULL,
  actor text NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX note_history_lookup ON note_history(project_id, note_id, revision_id DESC);
INSERT INTO note_history(project_id,note_id,operation,snapshot,actor)
SELECT project_id,id,'baseline',to_jsonb(notes),'migration' FROM notes;

CREATE FUNCTION record_note_history() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (to_jsonb(OLD) - 'position') = (to_jsonb(NEW) - 'position') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    INSERT INTO note_history(project_id,note_id,operation,snapshot,actor)
    VALUES(OLD.project_id,OLD.id,'delete',to_jsonb(OLD),COALESCE(NULLIF(current_setting('app.actor',true),''),'local-ui-or-database'));
    RETURN OLD;
  END IF;
  INSERT INTO note_history(project_id,note_id,operation,snapshot,actor)
  VALUES(NEW.project_id,NEW.id,CASE WHEN TG_OP='INSERT' THEN 'create' ELSE 'update' END,to_jsonb(NEW),COALESCE(NULLIF(current_setting('app.actor',true),''),'local-ui-or-database'));
  RETURN NEW;
END;
$$;
CREATE TRIGGER notes_history AFTER INSERT OR UPDATE OR DELETE ON notes
FOR EACH ROW EXECUTE FUNCTION record_note_history();

CREATE TABLE mcp_requests (
  actor text NOT NULL,
  request_id text NOT NULL,
  fingerprint text NOT NULL,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(actor,request_id)
);
CREATE TABLE mcp_deletion_plans (
  token text PRIMARY KEY,
  actor text NOT NULL,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  targets jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);
