

# Plano: Sistema de Controle de Acesso e Gestao de Usuarios

## Resumo

Remover o cadastro publico do app, configurar jwilloliveira7@gmail.com como usuario master (admin), e criar uma tela para o admin cadastrar novos usuarios com email, senha generica e cargo. Usuarios novos precisarao trocar a senha no primeiro acesso.

---

## Etapas

### 1. Banco de dados - Tabela de roles e flag de primeiro acesso

Criar:
- Tabela `user_roles` com enum `app_role` (admin, mechanic, operator) conforme boas praticas de seguranca
- Funcao `has_role()` (security definer) para uso em RLS sem recursao
- Coluna `must_change_password` na tabela `user_roles` para controlar troca obrigatoria de senha
- Inserir o role `admin` para jwilloliveira7@gmail.com (sera vinculado ao user_id apos primeiro login)

### 2. Edge Function - Criar usuarios

Uma edge function `create-user` que:
- Recebe email, senha generica e role
- Valida que quem chama e admin (via token JWT + has_role)
- Usa a Admin API do Supabase (service_role_key) para criar o usuario via `supabase.auth.admin.createUser()`
- Insere o role na tabela `user_roles` com `must_change_password = true`
- Retorna sucesso ou erro

### 3. Tela de Login - Remover cadastro

- Remover o toggle "Criar conta" / "Fazer login" da pagina Auth
- Manter apenas o formulario de login
- Apos login, verificar se `must_change_password = true` e redirecionar para tela de troca de senha

### 4. Tela de Troca de Senha Obrigatoria

Nova pagina `/change-password` que:
- Aparece automaticamente no primeiro acesso de usuarios criados pelo admin
- Exige nova senha (minimo 6 caracteres) com confirmacao
- Atualiza a senha via `supabase.auth.updateUser({ password })`
- Marca `must_change_password = false` na tabela `user_roles`
- Redireciona para o dashboard

### 5. Gestao de Usuarios (tela admin)

Nova aba "Usuarios" na pagina de Configuracoes (ou menu lateral) visivel apenas para admins:
- Lista todos os usuarios com email e cargo
- Botao "Adicionar usuario" com formulario: email, cargo (admin/mechanic/operator)
- Senha generica gerada automaticamente (ex: `Mudar@123`)
- Botao para resetar senha de um usuario existente

### 6. Header - Botao de Logout

Adicionar dropdown no icone de usuario do AppHeader com:
- Email do usuario logado
- Cargo (badge)
- Botao "Sair" que chama `signOut()`

---

## Detalhes Tecnicos

### Estrutura do banco

```text
enum app_role: admin, mechanic, operator

user_roles
  id          uuid PK
  user_id     uuid FK -> auth.users(id) ON DELETE CASCADE
  role        app_role NOT NULL
  must_change_password boolean DEFAULT true
  UNIQUE(user_id, role)

function has_role(user_id uuid, role app_role) -> boolean
  SECURITY DEFINER, bypasses RLS
```

### Edge function `create-user`

```text
POST /create-user
Headers: Authorization: Bearer <admin_jwt>
Body: { email, password, role }

1. Verifica has_role(caller, 'admin') via service_role
2. Cria usuario via supabase.auth.admin.createUser()
3. Insere role em user_roles
4. Retorna { userId, email, role }
```

### Fluxo de primeiro acesso

```text
Login -> Verifica user_roles.must_change_password
  -> true: redireciona para /change-password
  -> false: redireciona para /dashboard
```

### Arquivos modificados/criados

| Arquivo | Acao |
|---|---|
| Migration SQL | Criar enum, tabela, funcao, seed admin |
| `supabase/functions/create-user/index.ts` | Nova edge function |
| `src/pages/Auth.tsx` | Remover signup, so login |
| `src/pages/ChangePassword.tsx` | Nova pagina de troca de senha |
| `src/pages/Settings.tsx` | Nova aba "Usuarios" (admin only) |
| `src/components/layout/AppHeader.tsx` | Dropdown com logout |
| `src/hooks/useAuth.tsx` | Adicionar role e must_change_password |
| `src/App.tsx` | Adicionar rota /change-password e protecao por role |

