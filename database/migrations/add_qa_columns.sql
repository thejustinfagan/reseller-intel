-- Add QA review columns to companies table
ALTER TABLE companies ADD COLUMN qa_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN qa_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN qa_flag_note TEXT;
ALTER TABLE companies ADD COLUMN qa_reviewed_at TIMESTAMP;
