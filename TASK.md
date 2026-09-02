# Текущая задача

## Mode

PHASE 4: INTEGRATION ARCHITECTURE / IMPLEMENTATION CONTRACT ONLY.

## Scope

- [x] Проанализировать существующий проект и stack.
- [x] Определить locked Hero boundaries.
- [x] Провести audit installed skills/agents/plugins.
- [x] Прочитать instructions релевантных skills.
- [x] Создать root documentation.
- [x] Перечитать документы и проверить отсутствие противоречий.
- [x] Проанализировать 12 предоставленных reference URL через браузер.
- [x] Создать `REFERENCE_MATRIX.md`, `DESIGN_DIRECTION.md`, `MOTION_DIRECTION.md`, `LANDING_STORYBOARD.md`.
- [x] Показать результаты и остановиться до approval на Phase 4/implementation.
- [x] Проверить фактическую механику `100000px` Hero runway.
- [x] Сравнить integration approaches и motion dependencies без установки.
- [x] Подготовить implementation tokens, product-fidelity contract и Phase 4 proposal.
- [x] Обновить reference verification status и user-story/UI-state layers.

## Запрещено

Не писать UI, не создавать sections, не менять Hero, не устанавливать dependencies, не реализовывать animation, не коммитить/пушить/публиковать и не переходить к implementation без approval.

## Audit outcome

Проект React/Vite/TypeScript сохранён. Hero определён как React + Three.js + GLSL system с native scroll/pointer motion. Locked и shared-impact boundaries записаны в `AGENTS.md` и `PROJECT.md`. Выявлен architecture gate: контент нельзя безопасно интегрировать после 100000px runway до согласования стратегии сохранения Hero.

## Stop condition

После отчёта Phase 4 остановиться. Не начинать implementation и не менять Hero без отдельного approval.
