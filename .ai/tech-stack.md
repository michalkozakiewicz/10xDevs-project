Frontend - Astro z React dla komponentów interaktywnych:

- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Backend - Supabase jako kompleksowe rozwiązanie backendowe:

- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników

AI - Komunikacja z modelami przez usługę Openrouter.ai:

- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszta
- Pozwala na ustawianie limitów finansowych na klucze API

CI/CD i Hosting:

- Github Actions do tworzenia pipeline'ów CI/CD
- DigitalOcean do hostowania aplikacji za pośrednictwem obrazu docker

Testing - Kompleksowe narzędzia do zapewnienia jakości:

- Vitest v2 jako framework do testów jednostkowych i integracyjnych
  - Szybki, kompatybilny z Vite/Astro, wbudowane mocking
  - Doskonała integracja z TypeScript
  - Watch mode i pokrycie kodu out-of-the-box
- Playwright v1.48 do testów end-to-end (E2E)
  - Multi-browser support (Chrome, Firefox, Safari)
  - Auto-wait dla stabilnych testów
  - Parallel execution dla szybszego wykonywania
  - Trace viewer do debugowania
- Testing Library v16 do testowania komponentów React
  - Best practices dla testowania UI
  - Accessibility-first approach
  - User-centric testing patterns
- Supertest v7 do testowania API endpoints
  - HTTP assertions
  - Integracja z Vitest
- Lighthouse CI + k6 do testów wydajności
  - Core Web Vitals monitoring
  - Load testing i stress testing
- OWASP ZAP do testów bezpieczeństwa
  - Automatyczne skanowanie luk bezpieczeństwa
  - OWASP Top 10 compliance
