CREATE TABLE projects (
 id text PRIMARY KEY,
 title varchar(200) NOT NULL CHECK(length(trim(title)) > 0),
 description varchar(2000) NOT NULL DEFAULT '',
 version integer NOT NULL DEFAULT 1 CHECK(version > 0),
 created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO projects(id,title) VALUES ('interview-copilot','Interview Copilot');
ALTER TABLE notes ADD COLUMN project_id text REFERENCES projects(id) ON DELETE CASCADE;
UPDATE notes SET project_id='interview-copilot';
ALTER TABLE notes ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE notes DROP CONSTRAINT notes_position_unique;
ALTER TABLE notes ADD CONSTRAINT notes_project_position_unique UNIQUE(project_id,position) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE app_settings (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 selected_project_id text REFERENCES projects(id) ON DELETE SET NULL
);
INSERT INTO app_settings(selected_project_id) VALUES ('interview-copilot');
