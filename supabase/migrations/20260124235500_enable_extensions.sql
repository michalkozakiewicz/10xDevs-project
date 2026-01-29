-- ============================================
-- Migration: 20260124235500_enable_extensions
-- Description: Włączenie wymaganych rozszerzeń PostgreSQL
-- Extensions: pgvector
--
-- Purpose: Włącza rozszerzenie pgvector wymagane do przechowywania
-- wektorów embedding dla funkcjonalności AI w aplikacji BucketEstimate.
-- ============================================

-- Włączenie rozszerzenia pgvector dla obsługi wektorów embedding
-- Wymagane dla kolumny embedding w tabeli cards
-- Model text-embedding-3-small generuje wektory o wymiarze 1536
create extension if not exists vector;
