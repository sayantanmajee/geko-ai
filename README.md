# SaaS Web Browser - Cloud-First, Multi-Tenant AI

A production-grade, cloud-first platform built with TypeScript, Pino, Passport, Postgres, and Turbo.

## Architecture
Services (Turbo Monorepo) ├── auth-service (OAuth + JWT) ├── ai-gateway (Request routing) ├── memory-service (Tenant-scoped storage) └── [More services...]

Shared └── @shared-types (Types, Logger, Errors)