/**
 * Seed Migration:  Model Catalog
 * 
 * Inserts all available AI models
 * 
 * Idempotent:   Safe to run multiple times
 * Uses ON CONFLICT to skip if already exists
 */

INSERT INTO model_catalog (
  modelId, provider, displayName, description,
  costPer1mInputTokens, costPer1mOutputTokens,
  minPlan, isLocal, isFreeTier, freeTierTokensPerMonth,
  releasedAt
) VALUES
-- FREE-TIER MODELS (No cost)
('gpt-4o-mini', 'openai', 'GPT-4o Mini', 'Fast, cost-effective model.  Good for most tasks.',
  0.00015, 0.0006, 'free', false, true, 1000000, '2024-07-18'),

('claude-haiku', 'anthropic', 'Claude 3 Haiku', 'Fast, small model. Great for quick summaries.',
  0.00008, 0.0004, 'free', false, true, 500000, '2024-03-04'),

('gemini-1.5-flash', 'google', 'Gemini 1.5 Flash', 'Google fast, efficient model.',
  0.0375, 0.15, 'free', false, true, 2000000, '2024-05-15'),

('mistral-7b', 'ollama', 'Mistral 7B', 'Open-source local model.  Always free on your device.',
  0, 0, 'free', true, true, NULL, '2024-02-26'),

('llama2', 'ollama', 'Llama 2 7B', 'Meta open model. Free to run locally.',
  0, 0, 'free', true, true, NULL, '2023-07-18'),

-- PREMIUM MODELS (Pro tier only)
('gpt-4', 'openai', 'GPT-4', 'Most capable model. Excellent reasoning.',
  0.03, 0.06, 'pro', false, false, NULL, '2023-03-14'),

('gpt-4-turbo', 'openai', 'GPT-4 Turbo', 'Faster GPT-4 with larger context window.',
  0.01, 0.03, 'pro', false, false, NULL, '2023-11-06'),

('claude-3-5-sonnet', 'anthropic', 'Claude 3.5 Sonnet', 'Excellent balance of capability and speed.',
  0.003, 0.015, 'pro', false, false, NULL, '2024-06-20'),

('claude-3-opus', 'anthropic', 'Claude 3 Opus', 'Most capable Claude model.',
  0.015, 0.075, 'pro', false, false, NULL, '2024-03-04'),

('gemini-2-pro', 'google', 'Gemini 2.0 Pro', 'Latest Google model.  Multimodal capable.',
  0.0075, 0.03, 'pro', false, false, NULL, '2024-12-19')
ON CONFLICT (modelId) DO NOTHING;

-- Insert into model_pricing (current pricing)
INSERT INTO model_pricing (modelId, costPer1mInputTokens, costPer1mOutputTokens, markupPercentage)
SELECT modelId, costPer1mInputTokens, costPer1mOutputTokens, 50
FROM model_catalog
ON CONFLICT (modelId, effectiveFrom) DO NOTHING;