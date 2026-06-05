-- Supabase SQL Schema for Social Media Scheduler

-- 1. Connected Accounts Table
-- Stores OAuth tokens for users' social media accounts.
CREATE TABLE connected_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Assuming you have an auth.users table or a custom users table
    platform VARCHAR(50) NOT NULL, -- 'instagram', 'tiktok', 'youtube', 'twitter'
    platform_account_id VARCHAR(255), -- The ID of the account on the respective platform
    handle VARCHAR(255), -- E.g., @girish_creates
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, platform)
);

-- 2. Scheduled Posts Table
-- Stores the posts that are scheduled to go out.
CREATE TABLE scheduled_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    clip_id VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'posted', 'failed', 'draft'
    caption TEXT,
    media_url TEXT, -- Link to the video file in Supabase Storage or S3
    thumbnail_url TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_connected_accounts_modtime
BEFORE UPDATE ON connected_accounts
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_scheduled_posts_modtime
BEFORE UPDATE ON scheduled_posts
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- RLS (Row Level Security) Policies
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Note: Replace 'auth.uid()' with your specific auth scheme if not using standard Supabase Auth.
CREATE POLICY "Users can manage their own connected accounts" 
ON connected_accounts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own scheduled posts" 
ON scheduled_posts FOR ALL USING (auth.uid() = user_id);
