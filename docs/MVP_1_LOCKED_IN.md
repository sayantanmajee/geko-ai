title: "🔒 GEKO-AI ARCHITECTURE & BUSINESS LOGIC LOCKED (DO NOT CHANGE WITHOUT APPROVAL)"
number: 32
state: "open"
repository: "sayantanmajee/geko-ai"
url: "https://github.com/sayantanmajee/geko-ai/issues/32"
description: |
  # 🔒 GEKO-AI Product & Architecture Lock
  
  **STATUS:** LOCKED FOR MVP v1 DEVELOPMENT
  **Last Updated:** 2025-12-25
  
  This issue documents the **non-negotiable business logic, UX principles, and technical architecture** for GEKO-AI.  **Any change to these points requires explicit team/lead approval and must be discussed BEFORE work begins.**
  
  ---
  
  ## 📋 THE CORE LOCK (DO NOT CHANGE)
  
  ### Business Model
  - [ ] **FREE TIER (Always)**
    - All local models (Mistral, Llama2, Neural Chat, etc.) = $0 cost to user
    - All cloud free-tier models (GPT-4o-mini, Claude-Haiku, Gemini-Flash, etc.) = $0 cost to user
    - No API keys needed from user ever
    - Monthly token limits per provider's free tier
    
  - [ ] **PRO TIER ($29/month)**
    - All local models (unlimited)
    - ALL premium cloud models (GPT-4, Claude 3.5 Sonnet, Gemini Pro, etc.)
    - Unlimited token usage (except provider hard limits)
    - **NEW MODELS UNLOCKED INSTANTLY** when released (no waiting)
    - No API keys needed from user
    
  - [ ] **PAY-AS-YOU-GO**
    - All models available (local + cloud)
    - Per-token billing at 50% markup on provider costs
    - Soft limit at 80% budget, hard stop at 100%
    - No API keys needed from user
    - We charge users, we pay providers, margin is ours
  
  ### User Experience Principles
  - [ ] **Zero API Key Management**
    - Users NEVER enter OpenAI/Anthropic/Google API keys
    - Users NEVER see backend credentials
    - "Bring your own key" is explicitly REJECTED (unless different product tier later)
    - All cloud API access happens through GEKO-AI backend using company-owned keys
  
  - [ ] **One-Click Local Model Setup**
    - User clicks "Install Mistral" → App auto-downloads, auto-installs Ollama/Llama. cpp, auto-starts service
    - Zero CLI, zero config, zero manual steps
    - Health check runs automatically
    - Model ready to chat within seconds
  
  - [ ] **Automatic Upgrade Prompts**
    - Free user hits quota → "Upgrade to Pro for unlimited" banner
    - Free user tries premium model → 403 + upgrade CTA
    - PayGo user hits budget → warning + suggest Pro
    - New model launches → Pro users notified automatically
  
  ### Technical Architecture
  - [ ] **Single Source of Truth for Model Access**
    - `model_catalog` table:  All models, costs, min_plan, is_local, free_tier_limits, provider_id
    - `workspace_subscriptions` table: Tracks user's plan, billing status, budget
    - `token_usage` table: Every cloud call tracked for billing/quota
    - All decisions made here, enforced at API Gateway
  
  - [ ] **NO Direct Cloud API Calls from Client**
    - All model requests go through GEKO-AI Gateway
    - Gateway validates:  plan, quota, permissions, then routes to LibreChat or provider
    - Client never talks directly to OpenAI, Anthropic, Google APIs
    - All usage logged in `token_usage` for billing/analytics
  
  - [ ] **LibreChat is Headless Backend ONLY**
    - LibreChat handles:  model routing, conversation storage, streaming
    - GEKO-AI handles: auth, workspace, RBAC, quotas, billing, UI
    - LibreChat never exposed to end users (users talk to GEKO-AI frontend)
    - API calls to LibreChat go through GEKO-AI Gateway middleware
  
  - [ ] **API Key Custody**
    - All provider API keys stored in: 
      - Environment variables (docker/k8s)
      - Or encrypted secrets manager (Vault, AWS Secrets, etc.)
      - Never in code, never in database, never exposed to client
    - Gateway injects correct key into LibreChat request based on model/plan
  
  - [ ] **Multi-Tenancy & Isolation**
    - `tenantId` + `workspaceId` in every request
    - JWT includes both, validated at Gateway
    - No workspace can see another workspace's usage/models/members
    - All queries filtered by workspace at DB level
  
  ---
  
  ## 🚫 EXPLICITLY OUT OF SCOPE (DO NOT IMPLEMENT)
  
  - ❌ User-provided cloud API keys (blocked permanently for MVP)
  - ❌ "Bring your own model" (no custom model uploads yet)
  - ❌ Multi-region model hosting (launch on single region first)
  - ❌ Custom enterprise pricing (use free/pro/paygo only)
  - ❌ White-labeling/custom branding (later phase)
  - ❌ Webhook/third-party integrations (future)
  - ❌ Fine-tuning/training UI (future)
  
  ---
  
  ## ✅ CRITICAL CHECKLIST (Before Merging ANY PR)
  
  ### Authentication & Authorization
  - [ ] All endpoints require valid JWT with tenantId + workspaceId
  - [ ] No cross-tenant access possible
  - [ ] RBAC enforced on all model/chat/billing operations
  - [ ] Audit logs created for all sensitive actions
  
  ### Model Access & Routing
  - [ ] All model requests go through API Gateway (not direct to provider/LibreChat)
  - [ ] Model eligibility checked based on user's plan
  - [ ] Free users see only free-tier models
  - [ ] Pro users see all models instantly (including newly released)
  - [ ] PayGo users see all models (subject to budget limit)
  
  ### Usage Tracking & Billing
  - [ ] Every cloud model request logs to `token_usage` table
  - [ ] Token counts accurate (extracted from provider responses)
  - [ ] Cost to us calculated correctly (from provider pricing)
  - [ ] Cost to user calculated with markup applied
  - [ ] Quota checks happen BEFORE request hits provider
  - [ ] Soft limit warnings (80% usage) sent to workspace admin
  - [ ] Hard limit enforcement (100% budget) blocks further requests
  
  ### Local Model Management
  - [ ] One-click download/install works for all major platforms
  - [ ] Health check runs automatically post-install
  - [ ] Ollama service auto-starts on app restart
  - [ ] Model status displayed accurately in UI
  
  ### No API Key Leaks
  - [ ] No prompt asking user for provider API keys anywhere
  - [ ] No API keys in logs, errors, or responses
  - [ ] Backend keys never exposed to frontend
  - [ ] Secrets stored securely (not in . env. example, not in code)
  
  ---
  
  ## 📚 Related Documentation
  
  - **Business Model Details:** [PRODUCT_PLAN.md](./PRODUCT_PLAN.md)
  - **Architecture Decisions:** [ARCHITECTURE.md](./docs/ARCHITECTURE.md)
  - **Database Schema:** [/infra/postgres/migrations/](./infra/postgres/migrations/)
  - **API Reference:** [/docs/API.md](./docs/API.md)
  
  ---
  
  ## 🔴 IF YOU NEED TO CHANGE THIS
  
  **STOP** and create a discussion/issue:
  - [ ] Explain what needs to change and why
  - [ ] How it impacts the 30-day roadmap
  - [ ] What new risks it introduces
  - [ ] Get explicit approval before proceeding
  
  **This ensures alignment and prevents mid-sprint scope creep.**
  
  ---
  
  ## 📌 How to Use This Checklist
  
  1. **Before starting any day's work:** Read the relevant section above
  2. **Before opening a PR:** Check the "CRITICAL CHECKLIST" items
  3. **Before merging:** Ensure your code follows these principles
  4. **When adding features:** Ask "Does this fit the lock?" If not, discuss first
  
  ---
  
  **Last Sync:** 2025-12-25  
  **Locked By:** sayantanmajee  
  **Next Review:** Upon major architectural change only