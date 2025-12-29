-- Create image_generation_status enum
CREATE TYPE public.image_generation_status AS ENUM (
  'pending',
  'processing',
  'succeeded',
  'failed',
  'canceled'
);

-- Create image_generations table for tracking Replicate AI predictions
CREATE TABLE IF NOT EXISTS public.image_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  prediction_id TEXT NOT NULL UNIQUE, -- Replicate prediction ID
  status public.image_generation_status DEFAULT 'pending' NOT NULL,
  input_image_url TEXT, -- Original image URL (optional, for reference)
  output_image_url TEXT, -- R2 stored image URL
  replicate_output_url TEXT, -- Original Replicate output URL
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.image_generations ENABLE ROW LEVEL SECURITY;

-- Users can view their own generations
CREATE POLICY "Users can view their own image generations"
  ON public.image_generations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert (from Cloudflare Functions)
-- No RLS policy needed for INSERT as service_role bypasses RLS

-- Service role can update (from webhook)
-- No RLS policy needed for UPDATE as service_role bypasses RLS

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_image_generations_user_id ON public.image_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_image_generations_prediction_id ON public.image_generations(prediction_id);
CREATE INDEX IF NOT EXISTS idx_image_generations_status ON public.image_generations(status);
CREATE INDEX IF NOT EXISTS idx_image_generations_created_at ON public.image_generations(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER image_generations_updated_at
  BEFORE UPDATE ON public.image_generations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
