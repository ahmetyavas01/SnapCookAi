-- Device Subscriptions Table
CREATE TABLE IF NOT EXISTS device_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'weekly', 'monthly')),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  purchase_token TEXT,
  original_transaction_id TEXT,
  
  -- Indexes for performance
  CONSTRAINT unique_active_device_subscription UNIQUE (device_id, is_active) 
    DEFERRABLE INITIALLY DEFERRED
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_device_subscriptions_device_id ON device_subscriptions(device_id);
CREATE INDEX IF NOT EXISTS idx_device_subscriptions_is_active ON device_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_device_subscriptions_expires_at ON device_subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_device_subscriptions_user_id ON device_subscriptions(user_id);

-- Subscription Logs Table (for audit trail)
CREATE TABLE IF NOT EXISTS subscription_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'renewed', 'cancelled', 'expired', 'restored')),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'weekly', 'monthly')),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for logs
CREATE INDEX IF NOT EXISTS idx_subscription_logs_device_id ON subscription_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_subscription_logs_created_at ON subscription_logs(created_at);

-- Device Usage Stats Table (for tracking API usage)
CREATE TABLE IF NOT EXISTS device_usage_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  recipe_generations INTEGER DEFAULT 0,
  vision_scans INTEGER DEFAULT 0,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'weekly', 'monthly')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate daily records
  UNIQUE(device_id, date)
);

-- Indexes for usage stats
CREATE INDEX IF NOT EXISTS idx_device_usage_stats_device_id ON device_usage_stats(device_id);
CREATE INDEX IF NOT EXISTS idx_device_usage_stats_date ON device_usage_stats(date);

-- RLS (Row Level Security) Policies
ALTER TABLE device_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_usage_stats ENABLE ROW LEVEL SECURITY;

-- Policy for device_subscriptions (allow all operations for now, can be restricted later)
CREATE POLICY "Allow all operations on device_subscriptions" ON device_subscriptions
  FOR ALL USING (true) WITH CHECK (true);

-- Policy for subscription_logs (read-only for most operations)
CREATE POLICY "Allow all operations on subscription_logs" ON subscription_logs
  FOR ALL USING (true) WITH CHECK (true);

-- Policy for device_usage_stats
CREATE POLICY "Allow all operations on device_usage_stats" ON device_usage_stats
  FOR ALL USING (true) WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_device_subscriptions_updated_at 
  BEFORE UPDATE ON device_subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_usage_stats_updated_at 
  BEFORE UPDATE ON device_usage_stats 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically expire subscriptions
CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS void AS $$
BEGIN
  -- Deactivate expired subscriptions
  UPDATE device_subscriptions 
  SET is_active = false, updated_at = NOW()
  WHERE is_active = true 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
    
  -- Log expired subscriptions
  INSERT INTO subscription_logs (device_id, user_id, action, plan_type, details)
  SELECT 
    device_id, 
    user_id, 
    'expired', 
    plan_type,
    jsonb_build_object('expired_at', expires_at)
  FROM device_subscriptions 
  WHERE is_active = false 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW()
    AND updated_at > NOW() - INTERVAL '1 minute'; -- Only recently expired
END;
$$ language 'plpgsql';

-- Function to get subscription status for a device
CREATE OR REPLACE FUNCTION get_device_subscription_status(p_device_id TEXT)
RETURNS TABLE (
  is_active BOOLEAN,
  plan_type TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ds.is_active,
    ds.plan_type,
    ds.expires_at,
    CASE 
      WHEN ds.expires_at IS NULL THEN NULL
      ELSE EXTRACT(DAY FROM (ds.expires_at - NOW()))::INTEGER
    END as days_remaining
  FROM device_subscriptions ds
  WHERE ds.device_id = p_device_id
    AND ds.is_active = true
  ORDER BY ds.created_at DESC
  LIMIT 1;
END;
$$ language 'plpgsql';

-- Function to create or update usage stats
CREATE OR REPLACE FUNCTION update_device_usage(
  p_device_id TEXT,
  p_user_id UUID DEFAULT NULL,
  p_recipe_generations INTEGER DEFAULT 0,
  p_vision_scans INTEGER DEFAULT 0,
  p_plan_type TEXT DEFAULT 'free'
)
RETURNS void AS $$
BEGIN
  INSERT INTO device_usage_stats (
    device_id, 
    user_id, 
    date, 
    recipe_generations, 
    vision_scans, 
    plan_type
  )
  VALUES (
    p_device_id, 
    p_user_id, 
    CURRENT_DATE, 
    p_recipe_generations, 
    p_vision_scans, 
    p_plan_type
  )
  ON CONFLICT (device_id, date) 
  DO UPDATE SET
    recipe_generations = device_usage_stats.recipe_generations + p_recipe_generations,
    vision_scans = device_usage_stats.vision_scans + p_vision_scans,
    plan_type = p_plan_type,
    updated_at = NOW();
END;
$$ language 'plpgsql';

-- Create a scheduled job to expire subscriptions (if pg_cron is available)
-- SELECT cron.schedule('expire-subscriptions', '0 * * * *', 'SELECT expire_subscriptions();');

-- Sample data for testing (remove in production)
-- INSERT INTO device_subscriptions (device_id, plan_type, is_active, expires_at) 
-- VALUES 
--   ('test_device_1', 'monthly', true, NOW() + INTERVAL '30 days'),
--   ('test_device_2', 'weekly', true, NOW() + INTERVAL '7 days'),
--   ('test_device_3', 'free', true, NULL); 