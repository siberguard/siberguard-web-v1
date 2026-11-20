## Ringkasan

<!-- Apa yang berubah dan kenapa. -->

## Cara menguji

<!-- Langkah singkat untuk reviewer, atau apa yang dicek di staging. -->

## Checklist

- [ ] CI hijau (lint, typecheck, unit test, build & e2e)
- [ ] Ada tes untuk perubahan ini (perbaikan bug → tes yang mereproduksi bug-nya)
- [ ] PR rilis `development → main`: fitur sudah dicek di staging
- [ ] Tidak ada rahasia, kredensial, atau data pelanggan di diff
- [ ] Menyentuh `public/brand` / `scripts/brand`: `pnpm brand:compare` LULUS
