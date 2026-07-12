# Cara pakai bundel ini

```fish
cd /home/cachymac/Projects/quran-premium
# salin isi bundel ini ke root repo (AGENTS.md + docs/)
ln -sf AGENTS.md CLAUDE.md
git add -A; and git commit -m "docs(batch-0): anchor documents + design system + prompt pack"
```

Isi:

| File | Fungsi |
|---|---|
| `AGENTS.md` | Rel untuk semua model. Daftar API Zepp yang sudah diverifikasi + pola terlarang. Symlink jadi `CLAUDE.md`. |
| `docs/PRD.md` | Spesifikasi otoritatif, keputusan terkunci, non-goals, risiko. |
| `docs/PLAN.md` | Spike S1–S5 + Batch A–P, tiap batch punya gate checklist. |
| `docs/DESIGN-SYSTEM.md` | Token warna/tipografi + matematika layar bundar + spec 12 layar dari mockup. **Ini yang bikin UI-nya benar-benar sama dengan gambar.** |
| `docs/DECISIONS.md` | D-001 (render Arab), D-002 (nama app), D-003 (audio) — masih terbuka. |
| `docs/PROMPTS.md` | Prompt siap tempel untuk glm / cc-deep / clo, per batch. |
| `docs/prompts/00-AUDIT.md` | Prompt audit (versi sempurna dari draft awal). Sesi pertama. |
| `docs/context/PROJECT-STATE.md` | Jangkar sesi. Dibaca pertama, ditulis terakhir. |
| `docs/assets/mockup-12-screens.png` | Mockup yang disetujui. |

Urutan: **Batch 0 (audit) → S1 → S2 → S3/S4/S5 → A → B → C → D → …**
Jangan mulai Batch A sebelum D-002 (nama) diputuskan, dan jangan mulai Batch G sebelum D-001
(hasil spike S2) ditulis di `DECISIONS.md`.
