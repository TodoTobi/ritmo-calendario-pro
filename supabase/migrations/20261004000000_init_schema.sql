-- ============================================================================
-- RITMO — ESQUEMA MAESTRO DE PRODUCCIÓN (SUPABASE POSTGRESQL 16)
-- Migración Inicial: 20261004000000_init_schema.sql
-- ============================================================================

-- Habilitar extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TIPOS ENUMERADOS (DOMINIOS SEMÁNTICOS)
DO $$ BEGIN
    CREATE TYPE event_tier AS ENUM ('tier_1', 'tier_2', 'tier_3');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_color AS ENUM ('red', 'orange', 'blue', 'green', 'yellow', 'purple');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'rescheduled', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE alert_cadence AS ENUM ('7_days', '3_days', '2_days', '24_hours', '2_hours');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE alert_status AS ENUM ('scheduled', 'quiet_suppressed', 'dispatched', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLA DE PERFIL DE USUARIO SOBERANO (MONOUSUARIO)
CREATE TABLE IF NOT EXISTS users_profile (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    username TEXT NOT NULL UNIQUE DEFAULT 'lucas_ritmo',
    full_name TEXT NOT NULL DEFAULT 'Lucas',
    timezone TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
    telegram_chat_id BIGINT UNIQUE,
    google_refresh_token TEXT,
    google_token_expiry TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. TABLA DE EVENTOS Y BLOQUES DE CALENDARIO
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    tier event_tier NOT NULL DEFAULT 'tier_3',
    color event_color NOT NULL DEFAULT 'orange',
    is_inamovible BOOLEAN GENERATED ALWAYS AS (tier = 'tier_1') STORED,
    difficulty_score SMALLINT CHECK (difficulty_score BETWEEN 1 AND 5),
    classroom_coursework_id TEXT UNIQUE,
    created_from TEXT DEFAULT 'web' CHECK (created_from IN ('web', 'telegram_voice', 'telegram_ocr', 'classroom_sync', 'template')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_time_order CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_tier ON events(tier);
CREATE INDEX IF NOT EXISTS idx_events_date_start ON events(event_date, start_time);

-- 4. TABLA DE TAREAS Y ENTREGAS PENDIENTES
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT,
    status task_status NOT NULL DEFAULT 'pending',
    priority_tier event_tier NOT NULL DEFAULT 'tier_2',
    due_date TIMESTAMPTZ,
    difficulty_score SMALLINT CHECK (difficulty_score BETWEEN 1 AND 5),
    linked_event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
    classroom_coursework_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- 5. TABLA DE PLANTILLAS DE RUTINA FIJA (TIER 1 Y RECURRENTES)
CREATE TABLE IF NOT EXISTS routine_templates (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Domingo, 6=Sábado
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    tier event_tier NOT NULL DEFAULT 'tier_1',
    color event_color NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT chk_template_time_order CHECK (end_time > start_time)
);

-- 6. TABLA DE SINCRONIZACIÓN CON GOOGLE CLASSROOM
CREATE TABLE IF NOT EXISTS classroom_sync (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    course_id TEXT NOT NULL,
    course_name TEXT NOT NULL,
    coursework_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    alternate_link TEXT,
    state TEXT NOT NULL,
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_classroom_coursework ON classroom_sync(coursework_id);

-- 7. TABLA DEL ANOTADOR HÍBRIDO (NOTAS DIARIAS Y BACKLOG)
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    content_markdown TEXT NOT NULL,
    category_tag TEXT NOT NULL DEFAULT '#general',
    linked_date DATE,
    linked_event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    synced_to_drive BOOLEAN NOT NULL DEFAULT false,
    drive_file_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notes_tag ON notes(category_tag);
CREATE INDEX IF NOT EXISTS idx_notes_linked_date ON notes(linked_date);

-- 8. TABLA DE COLA DE ALERTAS Y SMART QUIET WINDOWS
CREATE TABLE IF NOT EXISTS alerts_queue (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    cadence alert_cadence NOT NULL,
    scheduled_for TIMESTAMPTZ NOT NULL,
    status alert_status NOT NULL DEFAULT 'scheduled',
    suppressed_until TIMESTAMPTZ,
    dispatched_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_alerts_pending ON alerts_queue(status, scheduled_for) WHERE status = 'scheduled';

-- 9. TABLA DE PROPUESTAS DE REPROGRAMACIÓN (HUMAN-IN-THE-LOOP)
CREATE TABLE IF NOT EXISTS reschedule_proposals (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    source_event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    detected_overflow_reason TEXT NOT NULL,
    scenarios_json JSONB NOT NULL,
    selected_scenario TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMPTZ
);

-- 10. TABLA DE CONVERSACIONES Y AUDIOS DE TELEGRAM
CREATE TABLE IF NOT EXISTS telegram_conversations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    chat_id BIGINT NOT NULL,
    message_id BIGINT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    intent_detected TEXT,
    media_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_telegram_chat ON telegram_conversations(chat_id, created_at DESC);

-- 11. TABLA DE AUDITORÍA DE ACCIONES CRÍTICAS
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_state JSONB,
    new_state JSONB,
    performed_by TEXT NOT NULL DEFAULT 'lucas_ritmo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 12. DISPARADORES PARA TIMESTAMPS AUTOMÁTICOS
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_users_profile ON users_profile;
CREATE TRIGGER set_timestamp_users_profile
BEFORE UPDATE ON users_profile
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_events ON events;
CREATE TRIGGER set_timestamp_events
BEFORE UPDATE ON events
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_tasks ON tasks;
CREATE TRIGGER set_timestamp_tasks
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_notes ON notes;
CREATE TRIGGER set_timestamp_notes
BEFORE UPDATE ON notes
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- ============================================================================
-- 13. FUNCIÓN TRANSACCIONAL DE APLICACIÓN DE REPROGRAMACIÓN (RPC)
-- ============================================================================

CREATE OR REPLACE FUNCTION apply_reschedule_scenario(
    p_proposal_id TEXT,
    p_scenario_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_proposal RECORD;
    v_events_to_update JSONB;
    v_item JSONB;
BEGIN
    SELECT * INTO v_proposal 
    FROM reschedule_proposals 
    WHERE id = p_proposal_id AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Propuesta no encontrada o ya resuelta' USING ERRCODE = 'P0002';
    END IF;

    v_events_to_update := v_proposal.scenarios_json->p_scenario_key->'updates';

    IF v_events_to_update IS NOT NULL THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(v_events_to_update)
        LOOP
            UPDATE events
            SET event_date = (v_item->>'newDate')::DATE,
                start_time = (v_item->>'newStartTime')::TIME,
                end_time = (v_item->>'newEndTime')::TIME,
                updated_at = now()
            WHERE id = (v_item->>'eventId');
        END LOOP;
    END IF;

    UPDATE reschedule_proposals
    SET status = 'applied',
        selected_scenario = p_scenario_key,
        resolved_at = now()
    WHERE id = p_proposal_id;

    RETURN jsonb_build_object('success', true, 'applied_scenario', p_scenario_key);
END;
$$;

-- ============================================================================
-- 14. SEGURIDAD Y POLÍTICAS ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE reschedule_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de bypass para service_role, anon y monousuario
DROP POLICY IF EXISTS "Acceso total monousuario en events" ON events;
CREATE POLICY "Acceso total monousuario en events" ON events
    FOR ALL USING (
        coalesce((current_setting('request.headers', true)::json->>'x-ritmo-token'), '') = 'rtm_sec_a8f9c2d1e04b789123456789abcdef'
        OR auth.role() = 'service_role'
        OR auth.role() = 'anon'
    );

DROP POLICY IF EXISTS "Acceso total monousuario en notes" ON notes;
CREATE POLICY "Acceso total monousuario en notes" ON notes
    FOR ALL USING (
        coalesce((current_setting('request.headers', true)::json->>'x-ritmo-token'), '') = 'rtm_sec_a8f9c2d1e04b789123456789abcdef'
        OR auth.role() = 'service_role'
        OR auth.role() = 'anon'
    );

DROP POLICY IF EXISTS "Acceso total monousuario en tasks" ON tasks;
CREATE POLICY "Acceso total monousuario en tasks" ON tasks
    FOR ALL USING (
        coalesce((current_setting('request.headers', true)::json->>'x-ritmo-token'), '') = 'rtm_sec_a8f9c2d1e04b789123456789abcdef'
        OR auth.role() = 'service_role'
        OR auth.role() = 'anon'
    );

DROP POLICY IF EXISTS "Acceso total monousuario en alerts" ON alerts_queue;
CREATE POLICY "Acceso total monousuario en alerts" ON alerts_queue
    FOR ALL USING (
        coalesce((current_setting('request.headers', true)::json->>'x-ritmo-token'), '') = 'rtm_sec_a8f9c2d1e04b789123456789abcdef'
        OR auth.role() = 'service_role'
        OR auth.role() = 'anon'
    );

DROP POLICY IF EXISTS "Acceso total monousuario en templates" ON routine_templates;
CREATE POLICY "Acceso total monousuario en templates" ON routine_templates
    FOR ALL USING (
        auth.role() = 'service_role' OR auth.role() = 'anon'
    );

DROP POLICY IF EXISTS "Acceso total monousuario en profiles" ON users_profile;
CREATE POLICY "Acceso total monousuario en profiles" ON users_profile
    FOR ALL USING (
        auth.role() = 'service_role' OR auth.role() = 'anon'
    );

DROP POLICY IF EXISTS "Acceso total monousuario en classroom" ON classroom_sync;
CREATE POLICY "Acceso total monousuario en classroom" ON classroom_sync
    FOR ALL USING (
        auth.role() = 'service_role' OR auth.role() = 'anon'
    );

DROP POLICY IF EXISTS "Acceso total monousuario en proposals" ON reschedule_proposals;
CREATE POLICY "Acceso total monousuario en proposals" ON reschedule_proposals
    FOR ALL USING (
        auth.role() = 'service_role' OR auth.role() = 'anon'
    );

DROP POLICY IF EXISTS "Acceso total monousuario en telegram" ON telegram_conversations;
CREATE POLICY "Acceso total monousuario en telegram" ON telegram_conversations
    FOR ALL USING (
        auth.role() = 'service_role' OR auth.role() = 'anon'
    );

DROP POLICY IF EXISTS "Acceso total monousuario en audit" ON audit_logs;
CREATE POLICY "Acceso total monousuario en audit" ON audit_logs
    FOR ALL USING (
        auth.role() = 'service_role' OR auth.role() = 'anon'
    );
