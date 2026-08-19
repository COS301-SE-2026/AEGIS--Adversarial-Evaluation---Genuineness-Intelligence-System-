-- Run manually against Supabase. Do NOT run via `alembic upgrade head`.
CREATE TABLE candidate_response_metrics (
    candidate_response_id   INTEGER PRIMARY KEY REFERENCES candidate_responses(response_id),
    candidate_assessment_id INTEGER NOT NULL REFERENCES candidate_assessments(candidate_assess_id),
    active_time_ms          BIGINT NOT NULL DEFAULT 0,
    unique_keys_count       INTEGER NOT NULL DEFAULT 0,
    chars_alnum             INTEGER NOT NULL DEFAULT 0,
    chars_special           INTEGER NOT NULL DEFAULT 0,
    backspace_count         INTEGER NOT NULL DEFAULT 0,
    copy_event_count        INTEGER NOT NULL DEFAULT 0,
    paste_event_count       INTEGER NOT NULL DEFAULT 0,
    paste_char_count        INTEGER NOT NULL DEFAULT 0,
    focus_loss_count        INTEGER NOT NULL DEFAULT 0,
    focus_loss_time_ms      BIGINT NOT NULL DEFAULT 0,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_candidate_response_metrics_candidate_assessment_id
    ON candidate_response_metrics (candidate_assessment_id);
