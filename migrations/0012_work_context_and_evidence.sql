-- Existing evidence rows remain valid; the digest covers newly captured normalized content only.
ALTER TABLE evidence_sources ADD COLUMN content_sha256 TEXT;

-- Optional context for existing work items; this is not an external execution queue.
CREATE TABLE work_item_contexts (
  work_item_id TEXT PRIMARY KEY REFERENCES work_items(id) ON DELETE RESTRICT,
  kind TEXT NOT NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE RESTRICT,
  research_artifact_id TEXT REFERENCES research_artifacts(id) ON DELETE RESTRICT,
  order_id TEXT REFERENCES orders(id) ON DELETE RESTRICT,
  CHECK (
    (kind = 'customer_followup' AND customer_id IS NOT NULL AND research_artifact_id IS NULL AND order_id IS NULL) OR
    (kind = 'content_review' AND customer_id IS NULL AND research_artifact_id IS NOT NULL AND order_id IS NULL) OR
    (kind = 'fulfillment_review' AND customer_id IS NULL AND research_artifact_id IS NULL AND order_id IS NOT NULL)
  )
);
