

## Plano: Renomear "Logística" para "Planejador" e remover "Supervisor Logística"

### Resumo
- Renomear o perfil `logistica` para `planejador` em todo o sistema
- Remover o perfil `supervisor_logistica` (o Planejador fica abaixo do Supervisor de Manutenção)
- Atualizar banco de dados, tipos, labels, permissões e edge functions

### Alterações

**1. Migração SQL**
- Adicionar valor `planejador` ao enum `app_role`
- Atualizar registros existentes de `logistica` → `planejador` e `supervisor_logistica` → remover/converter
- Não é possível remover valores de enum no PostgreSQL, mas os valores antigos deixam de ser usados

**2. `src/hooks/useAuth.tsx`**
- Trocar `logistica` → `planejador` no tipo `AppRole`
- Remover `supervisor_logistica` do tipo e de `SUPERVISOR_ROLES`
- Atualizar `creatableRoles`: trocar label "Logística" → "Planejador", remover "Supervisor Logística"
- Atualizar `canAccessRoute`: trocar checagem de `logistica` → `planejador`

**3. Labels em múltiplos arquivos** (AppHeader, Settings, Mechanics, MechanicFormDialog)
- Trocar `logistica: "Logística"` → `planejador: "Planejador"`
- Remover `supervisor_logistica: "Supervisor Logística"`

**4. `src/components/forms/MechanicFormDialog.tsx`**
- Atualizar o schema zod: trocar `logistica` → `planejador`, remover `supervisor_logistica`
- Atualizar lógica `isSupervisorRole` (remover checagem de `logistica`)

**5. `src/pages/Mechanics.tsx`**
- Atualizar `subordinateMap`: remover `supervisor_logistica` entry
- Atualizar labels

**6. `supabase/functions/create-user/index.ts`**
- Remover `supervisor_logistica` de `SUPERVISOR_ROLES`
- Trocar `logistica` → `planejador` em `SUBORDINATE_ROLES`

**7. `src/integrations/supabase/types.ts`**
- Atualizar tipos gerados para refletir as mudanças

**8 arquivos** serão editados + 1 migração SQL criada.

