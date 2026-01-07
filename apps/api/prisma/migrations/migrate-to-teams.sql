-- Script de migração para adicionar suporte a times
-- Este script deve ser executado ANTES do prisma db push

-- 1. Cria enum TeamRole se não existir
DO $$ BEGIN
  CREATE TYPE "TeamRole" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Cria a tabela de times
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS teams_owner_id_idx ON teams(owner_id);

-- 3. Cria a tabela de membros
CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role "TeamRole" DEFAULT 'VIEWER',
  joined_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, user_id)
);
CREATE INDEX IF NOT EXISTS team_members_team_id_idx ON team_members(team_id);
CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON team_members(user_id);

-- 4. Cria a tabela de convites
CREATE TABLE IF NOT EXISTS team_invites (
  id TEXT PRIMARY KEY,
  email TEXT,
  token TEXT UNIQUE NOT NULL,
  role "TeamRole" DEFAULT 'VIEWER',
  expires_at TIMESTAMP(3) NOT NULL,
  used_at TIMESTAMP(3),
  max_uses INTEGER DEFAULT 1,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  invited_by_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS team_invites_team_id_idx ON team_invites(team_id);
CREATE INDEX IF NOT EXISTS team_invites_token_idx ON team_invites(token);
CREATE INDEX IF NOT EXISTS team_invites_email_idx ON team_invites(email);

-- 5. Adiciona a coluna team_id nas tabelas existentes (permite NULL inicialmente)
ALTER TABLE monitors ADD COLUMN IF NOT EXISTS team_id TEXT;
ALTER TABLE alert_channels ADD COLUMN IF NOT EXISTS team_id TEXT;
ALTER TABLE status_pages ADD COLUMN IF NOT EXISTS team_id TEXT;

-- 6. Para cada usuário, cria um time pessoal se não existir
INSERT INTO teams (id, name, slug, owner_id, created_at, updated_at)
SELECT
  'team_' || u.id,
  COALESCE(u.name, 'Meu Time'),
  'user-' || substring(u.id, 1, 20),
  u.id,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM teams WHERE owner_id = u.id
)
ON CONFLICT (slug) DO NOTHING;

-- 7. Adiciona cada usuário como ADMIN do seu time
INSERT INTO team_members (id, team_id, user_id, role, joined_at)
SELECT
  'member_' || u.id,
  t.id,
  u.id,
  'ADMIN',
  CURRENT_TIMESTAMP
FROM users u
JOIN teams t ON t.owner_id = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM team_members WHERE user_id = u.id AND team_id = t.id
)
ON CONFLICT (team_id, user_id) DO NOTHING;

-- 8. Move monitors para os times dos seus donos (usando user_id existente)
UPDATE monitors m
SET team_id = t.id
FROM teams t
WHERE t.owner_id = m.user_id
AND m.team_id IS NULL;

-- 9. Move alert_channels para os times
UPDATE alert_channels ac
SET team_id = t.id
FROM teams t
WHERE t.owner_id = ac.user_id
AND ac.team_id IS NULL;

-- 10. Move status_pages para os times
UPDATE status_pages sp
SET team_id = t.id
FROM teams t
WHERE t.owner_id = sp.user_id
AND sp.team_id IS NULL;

-- 11. Agora torna as colunas team_id NOT NULL
ALTER TABLE monitors ALTER COLUMN team_id SET NOT NULL;
ALTER TABLE alert_channels ALTER COLUMN team_id SET NOT NULL;
ALTER TABLE status_pages ALTER COLUMN team_id SET NOT NULL;

-- 12. Adiciona as foreign keys
ALTER TABLE monitors ADD CONSTRAINT monitors_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE alert_channels ADD CONSTRAINT alert_channels_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE status_pages ADD CONSTRAINT status_pages_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- 13. Cria índices para team_id
CREATE INDEX IF NOT EXISTS monitors_team_id_idx ON monitors(team_id);
CREATE INDEX IF NOT EXISTS alert_channels_team_id_idx ON alert_channels(team_id);
CREATE INDEX IF NOT EXISTS status_pages_team_id_idx ON status_pages(team_id);

-- 14. Remove a coluna user_id das tabelas (opcional, feito pelo Prisma)
-- ALTER TABLE monitors DROP COLUMN user_id;
-- ALTER TABLE alert_channels DROP COLUMN user_id;
-- ALTER TABLE status_pages DROP COLUMN user_id;
