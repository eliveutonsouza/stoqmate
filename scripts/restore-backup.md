# Restaurar backup do banco

Backups vêm do workflow `.github/workflows/db-backup.yml` (diário, 30 dias,
criptografado com `BACKUP_PASSPHRASE`). Backup sem teste de restauração não
vale: rode este roteiro num projeto Supabase **de teste** pelo menos uma vez
por mês.

1. Baixe o artifact `db-backup` da execução desejada (Actions → Backup do
   banco → run → Artifacts) e descompacte o `.zip`.
2. Decifre:
   ```sh
   openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
     -in stoqmate-AAAAMMDDTHHMMZ.dump.enc -out db.dump -pass env:BACKUP_PASSPHRASE
   ```
3. Confira o conteúdo sem restaurar: `pg_restore --list db.dump | head`.
4. Restaure num projeto vazio (nunca direto em produção):
   ```sh
   # schema das migrations primeiro, pra extensões/tipos existirem
   supabase db push --db-url "$DESTINO_DB_URL"
   pg_restore --data-only --disable-triggers --no-owner \
     --schema=public --schema=auth -d "$DESTINO_DB_URL" db.dump
   ```
5. Valide: login de um usuário de teste, contagem de `tenants`, `products`,
   `sales` igual à origem.
6. Arquivos do Storage (logos, fotos, avatares) **não** estão no dump —
   ficam no bucket. Para disaster recovery completo, considerar o plano Pro
   (backup diário gerenciado + PITR opcional).

Apague `db.dump` decifrado depois do teste: tem dado pessoal.
