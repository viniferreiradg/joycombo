# Contexto do projeto: Joycombo

## O que é

Landing page do **Joycombo** (joycombo.com.br), estúdio de design do Vini Ferreira que vende marca, site e posts de Instagram em combos com preço aberto. Página única, com um objetivo: levar o visitante ao WhatsApp. O brief completo está em `joycombo-site-brief.md` (Downloads do Vini).

## Stack (a mesma do portfólio viniferreira.com.br)

- **Next.js 16.2** (App Router, React 19.2, TypeScript, webpack). Essa versão tem mudanças grandes: consulte `node_modules/next/dist/docs/` antes de escrever código. O antigo `middleware.ts` agora é `src/proxy.ts`.
- **Payload CMS v3** embutido no app. Painel em `/admin`, API em `/api`. Tema do painel copiado do portfólio (`src/app/(payload)/custom.css`), com a marca do Joycombo e ícones pixel no menu.
- **Banco:** Postgres em produção (`DATABASE_URI=postgresql://...`). Sem `DATABASE_URI`, usa um arquivo SQLite local (`joycombo.db`), para rodar no computador sem instalar nada. O adaptador é escolhido em `payload.config.ts`.
- **Tailwind CSS v4.** Cores, fontes e o "pixel" ficam como tokens em `src/app/globals.css` (`--color-accent`, `--font-title` etc.).
- **pixelarticons** para os ícones (`import { Whatsapp } from 'pixelarticons/react'`).
- `package.json` tem `"type": "module"`: o CLI do Payload (`payload run`, `generate:importmap`) precisa disso.

## Rodar no computador

```
npm install
npm run seed     # planos, serviços e FAQ do brief (não duplica se rodar de novo)
npm run dev
```

No primeiro acesso a `/admin`, o Payload pede para criar o usuário.

## Onde fica cada coisa no painel

- **Site > Landing page:** todos os textos, separados em abas (Topo, Seções, Planos, Contato, Jogo, Rodapé). Campo vazio volta para o texto padrão, que fica em `src/content/defaults.ts`.
- **Site > Configurações:** WhatsApp (vale para todos os botões), Instagram, e-mail, CNPJ, SEO e os IDs de rastreamento.
- **Site > Política de Privacidade:** texto da página `/politica-de-privacidade`. Vazio, mostra a política padrão do código.
- **Planos > Planos / Serviços avulsos:** o "De" e a economia de cada combo são calculados somando os preços dos serviços avulsos incluídos (`src/lib/plans.ts`). O título de cada card é montado pela aba: o primeiro é o serviço base (SITE / MARCA) e os outros dizem o que acrescentam (+ MARCA, + INSTA, + NOME), usando o "Nome curto" dos serviços. Os itens nunca se repetem: cada card mostra "Tudo de Site + Marca, mais:" e só os itens do serviço novo. O "Nome do plano" do admin vale para a mensagem do WhatsApp e os eventos. Plano ou serviço sem preço aparece como "Sob consulta" (o plano com Criação de nome).
- **Conteúdo:** Projetos (portfólio), Antes e depois, Clientes, Depoimentos e Perguntas frequentes. Tudo tem a caixa "Publicado". Seções sem nenhum item publicado somem do site (só publicar com autorização do cliente).
- **Contatos > Contatos do formulário:** cópia de quem enviou o formulário, com a origem da visita (UTM, gclid, fbclid) e a versão da tabela de preços.

## Comportamentos importantes

- **WhatsApp:** todo botão passa por `src/components/WhatsAppLink.tsx`, que monta o `wa.me` com a mensagem do contexto e dispara a conversão.
- **Rastreamento** (`src/lib/tracking.ts`): Pixel da Meta e tag do Google (GA4 + Google Ads) só carregam depois do "Aceitar" no banner de cookies, e só se os IDs estiverem preenchidos em Configurações. Eventos: `whatsapp_click` (com `origem` e `plano`), `plano_clique`, `generate_lead`, `planos_aba`, `jogo_inicio`, `jogo_cupom`. Na Meta: `Contact`, `Lead` e `PlanoClique`. As conversões do Google Ads usam os rótulos cadastrados em Configurações. UTM, gclid e fbclid ficam guardados na sessão e vão junto nos eventos e no formulário.
- **Teste A/B do preço:** Landing page > Planos > "Como mostrar o preço". Em "Teste A/B", cada visitante é sorteado uma vez (preço aberto ou "a partir de") e fica sempre na mesma versão. As duas versões vão no HTML e um script no `<head>` escolhe antes de a página aparecer (`layout.tsx`), sem piscar. A versão vai junto em todos os eventos (`variante_preco`).
- **Jogo** (`src/components/game/`): seção só com o jogo, largura total da tela. Pontuação: 50 pontos por asteroide e cupom aos 750 (os dois valores ficam em Landing page > Jogo). O código só é baixado quando a seção chega perto da tela. O botão flutuante de WhatsApp some enquanto o jogo está visível, e o botão de resgatar o cupom só aceita clique 0,8 s depois da vitória.
- **Depoimentos** (`src/components/sections/TestimonialsCarousel.tsx`): no desktop, o mesmo efeito do carrossel "Soluções" dos cases do portfólio: a seção trava e o scroll anda os cards na horizontal (ativo cheio, vizinhos apagados). O conteúdo fica num bloco compacto centralizado na tela, para não sobrar espaço preto (o problema apontado nos ajustes v2). No celular e com "reduzir movimento", carrossel simples com snap, setas e deslizar. Sem foto, o avatar é um pixel gerado a partir do nome. Depoimentos com a caixa "Exemplo (fictício)" só aparecem no ambiente de teste, nunca no site publicado (filtro em `src/lib/data.ts`). O seed cria 5 de exemplo.
- **Cache:** a home é estática e revalida a cada 60 s. Cada "Salvar" no painel chama `POST /revalidate` (com `REVALIDATE_SECRET`) e atualiza na hora.

## Pendências (material do brief)

- ~~Fonte Joycombo Sora Bold~~: instalada em `src/fonts/` (woff2 gerado do `.ttf` em `/font`). As letras pixel estão direto no arquivo; o `ss01` dele é o original do Sora (troca I, J, P, R...), por isso NÃO é ativado nos títulos. Versão 1.1 (`font/joycombo-sora-bold.ttf`): as letras acentuadas de N, E e A (Ê, Ã, Ñ...) ganharam a mesma largura das letras pixel, que tinham ficado com a largura do Sora original, e o til/caron do Ñ/Ň foram centralizados. A v1 está guardada em `font/joycombo-sora-bold-v1-original.ttf`. Depois de mexer no .ttf, gerar o woff2 de novo com fontTools (`flavor = 'woff2'`).
- Vídeos do hero (horizontal e vertical) e capas: enviar em Landing page > Topo. Enquanto não houver vídeo, o topo mostra um padrão com a nave.
- Foto do Vini, casos de antes e depois, projetos, logos de clientes e depoimentos (com autorização).
- Confirmar o número de WhatsApp, o e-mail, o valor do cupom do jogo e a decisão do desconto à vista nos combos (o texto da forma de pagamento é editável).

## Cuidados

- Em desenvolvimento com SQLite, mudar o `defaultValue` de um campo (ex: textos de `src/content/defaults.ts`) com o servidor rodando pode dar erro de índice "already exists". É só reiniciar o `npm run dev`.
- Seleção de texto: preta com texto branco; dentro de blocos com a classe `on-dark` (fundo preto), verde com texto preto.

- Comentários no código e mensagens de commit em português.
- CTAs sempre literais (dizem o que acontece ao clicar). "Press start" só no jogo.
- Copy: sem travessão, sem "não é X, é Y", no máximo uma referência gamer por seção e informação crítica sempre literal (regras do brief).
- Verde (`#DCFF01`) sempre como fundo com texto preto.
