

# Pontea — Marketplace Médico

## Visão Geral
Plataforma marketplace que conecta médicos, afiliados (influenciadores fitness) e pacientes. Tema escuro, mobile-first, com dados mockados inicialmente.

## Design System
- Background: `#0F172A`, Cards: `#1E293B`, Accent: `#0D9488` (teal)
- Texto branco/cinza claro, bordas sutis `#334155`
- Lucide icons, cantos arredondados, mobile-first

## Páginas

### 1. Landing Page (`/`)
- Hero com headline "A ponte entre você e seu médico", dois CTAs (Encontrar Médico → `/buscar`, Sou Médico → `/para-medicos`)
- Seção "Como Funciona" com 3 cards (Médico, Afiliado, Paciente)
- Grid de especialidades em destaque (Endocrinologia, Nutrologia, Dermatologia, Psiquiatria, Ortopedia, Nutrição)
- Footer com links

### 2. Marketplace/Busca (`/buscar`) — Página Principal
- Header com barra de busca: texto + dropdown especialidade + dropdown cidade + botão Buscar
- Sidebar desktop / filtros expansíveis mobile: especialidade, cidade, faixa de preço (slider), avaliação mínima (estrelas), tipo (presencial/online)
- Grid de cards de médicos: foto, nome, especialidade, cidade, preço BRL, estrelas, badge "Online", botão "Ver Perfil"
- Ordenação (melhor avaliado, menor/maior preço), paginação "Carregar mais"
- Captura `ref=CODIGO` em cookie (30 dias) + localStorage (`pontea_ref`)
- Query params `esp=` e `cidade=` pré-selecionam filtros

### 3. Perfil do Médico (`/dr/:slug`)
- Header com foto, nome, CRM, especialidade, cidade
- Bio, formação, experiência
- Card lateral (desktop) / sticky bottom (mobile) com preço + botão "Agendar Consulta" (link externo)
- Seção de avaliações com nota média e lista de reviews
- Captura `ref=` em cookie

### 4. Landing Médico (`/para-medicos`)
- Benefícios da plataforma
- Pricing: Básico R$149/mês, Pro R$399/mês
- CTA para cadastro

### 5. Landing Afiliado (`/para-afiliados`)
- Benefícios do programa
- Simulador de ganhos interativo (input: seguidores, taxa conversão → ganho mensal estimado)
- CTA para cadastro

### 6. Login (`/login`)
- Formulário email + senha com Supabase Auth
- Redirecionamento por role: doctor → `/dashboard/medico`, affiliate → `/dashboard/afiliado`

### 7. Cadastro Médico (`/cadastro/medico`)
- Formulário completo: nome, email, senha, CRM, UF, especialidade, cidade, telefone, valor consulta, link agenda, aceita online, bio
- `supabase.auth.signUp()` + insert na tabela `doctors`

### 8. Cadastro Afiliado (`/cadastro/afiliado`)
- Formulário: nome, email, senha, CPF/CNPJ, nicho, Instagram, seguidores
- `supabase.auth.signUp()` + insert na tabela `affiliates`

## Dados
- ~12 médicos mockados com dados realistas para visualização no marketplace
- Conexão real com Supabase será ativada posteriormente

## Estrutura de Componentes
- Layout compartilhado (Navbar + Footer) com tema escuro
- Componentes reutilizáveis: DoctorCard, StarRating, FilterSidebar, PriceSlider, SearchBar
- Hook `useReferral` para captura/persistência do código de afiliado
- Contexto de autenticação com Supabase

