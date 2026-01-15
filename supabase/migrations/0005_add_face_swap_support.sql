-- Add columns for two-stage face swap processing
-- stage: 1 = IDM-VTON, 2 = Face Swap
-- parent_id: Links stage 2 prediction to stage 1
-- original_image_url: R2 URL to original image (for face swap source)

ALTER TABLE image_generations 
ADD COLUMN IF NOT EXISTS stage INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS parent_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS original_image_url TEXT DEFAULT NULL;

-- Create index for efficient parent-child lookups
CREATE INDEX IF NOT EXISTS idx_image_generations_parent_id ON image_generations(parent_id);
CREATE INDEX IF NOT EXISTS idx_image_generations_stage ON image_generations(stage);
