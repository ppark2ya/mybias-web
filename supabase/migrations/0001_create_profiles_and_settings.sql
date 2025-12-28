-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  daily_ai_usage INTEGER DEFAULT 0 NOT NULL,
  last_usage_reset TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT user_settings_user_id_unique UNIQUE (user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- User settings policies
CREATE POLICY "Users can view their own settings"
  ON public.user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.user_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );

  -- Also create default user settings
  INSERT INTO public.user_settings (user_id, daily_ai_usage, last_usage_reset)
  VALUES (NEW.id, 0, NOW());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

CREATE TYPE public.job_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE IF NOT EXISTS public.generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  original_image_url TEXT NOT NULL, -- 원본 사진
  result_image_url TEXT,            -- 보정된 사진 (완료 시 업데이트)
  status public.job_status DEFAULT 'pending' NOT NULL,
  prompt TEXT,                      -- AI에 사용된 프롬프트나 옵션
  error_message TEXT,               -- 실패 시 에러 내용
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 유저 정보(이메일 등)가 변경될 때 profiles 테이블 동기화
CREATE OR REPLACE FUNCTION public.handle_update_user() 
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email,
      updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_update_user();

-- AI 사용량 증가 함수 (RPC로 호출)
CREATE OR REPLACE FUNCTION public.increment_ai_usage(row_id UUID)
RETURNS VOID AS $$
DECLARE
  _last_reset TIMESTAMPTZ;
BEGIN
  -- 현재 리셋 시간 확인
  SELECT last_usage_reset INTO _last_reset FROM public.user_settings WHERE user_id = row_id;

  -- 하루(24시간)가 지났거나 날짜가 바뀌었으면 리셋 후 1 증가
  IF _last_reset < CURRENT_DATE THEN
    UPDATE public.user_settings
    SET daily_ai_usage = 1,
        last_usage_reset = NOW(),
        updated_at = NOW()
    WHERE user_id = row_id;
  ELSE
    -- 아니면 그냥 1 증가 (동시성 안전)
    UPDATE public.user_settings
    SET daily_ai_usage = daily_ai_usage + 1,
        updated_at = NOW()
    WHERE user_id = row_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 인덱스 및 RLS
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_generations_user_id ON public.generations(user_id);

CREATE POLICY "Users can view their own generations"
  ON public.generations FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 작업 생성(요청)만 가능
CREATE POLICY "Users can create generation jobs"
  ON public.generations FOR INSERT WITH CHECK (auth.uid() = user_id);