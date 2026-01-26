# Guia para Adicionar Jogadores, Faces e Logos

Este guia explica como você pode adicionar novos jogadores reais ou fictícios ao jogo **Vale Futebol Manager 2026**, bem como incluir fotos (faces) e logos dos clubes. As instruções são pensadas para serem simples e claras, permitindo que você expanda o universo do jogo com facilidade.

## 1. Estrutura dos Dados

Os dados de jogadores são armazenados em `data/base_2025/players.json`. Este arquivo possui dois blocos principais:

1. **template** – define as regras gerais de geração automática de elenco (quantidade por posição, intervalos de overall, etc.). Use este modelo como fallback para clubes sem elenco específico.
2. **players** – lista de jogadores individuais. Cada objeto possui as seguintes propriedades:
   - `id`: identificador único (use o padrão `clubId_nome_sobrenome` em letras minúsculas e sem espaços).
   - `clubId`: id do clube (deve existir em `clubs.json`).
   - `name`: nome completo do jogador.
   - `pos`: posição (`GK`, `DEF`, `MID` ou `ATT`).
   - `age`: idade.
   - `overall`: nível geral (0–100). Reflita o talento atual.
   - `value`: valor de mercado em Reais. Utilize valores aproximados, de acordo com o overall.
   - `nationality`: nacionalidade (opcional).
   - `form`: forma atual (−5 a +5, opcional, use 0 como padrão).
   - `source`: utilize `"real"` para jogadores reais, `"generated"` para gerados pelo jogo ou `"custom"` para jogadores que você adicionou manualmente.

### Exemplo de entrada de jogador

```json
{
  "id": "flamengo_gabriel_barbosa",
  "clubId": "flamengo",
  "name": "Gabriel Barbosa",
  "pos": "ATT",
  "age": 29,
  "overall": 82,
  "value": 73800000,
  "nationality": "Brasil",
  "form": 0,
  "source": "real"
}
```

Para adicionar um novo jogador, basta inserir um objeto similar na lista `players` com as informações correspondentes.

## 2. Adicionando Faces (Fotos dos Jogadores)

Você pode adicionar fotos para os jogadores e exibi-las na interface do jogo. Para isso:

1. Crie a pasta `assets/images/jogadores/` caso ainda não exista.
2. Salve a imagem do jogador no formato PNG com o **mesmo nome do campo `id`** do jogador. Por exemplo:
   - Jogador com `id` `flamengo_gabriel_barbosa` → arquivo: `assets/images/jogadores/flamengo_gabriel_barbosa.png`.
3. Certifique‑se de que a imagem tenha proporção quadrada (ex.: 256×256 px). O jogo reduzirá automaticamente para tamanhos menores.

Se uma imagem não for encontrada, o jogo exibirá as iniciais do jogador como fallback.

## 3. Adicionando Logos de Clubes

Os logos dos clubes ficam em `assets/logos/` e devem seguir o nome do campo `id` do clube definido em `clubs.json`. Por exemplo:

- Clube `id` `flamengo` → logo em `assets/logos/flamengo.png`.
- Clube `id` `real_madrid` → logo em `assets/logos/real_madrid.png`.

O jogo buscará automaticamente o arquivo ao carregar a lista de clubes. Se o logo não existir, o nome do clube será exibido em formato reduzido.

## 4. Recarregando as Alterações

Após editar `players.json` ou adicionar novas imagens, basta recarregar a página do jogo no navegador para que os novos dados sejam carregados. Não é necessário recompilar ou alterar o código do jogo.

Se você estiver utilizando o jogo em um servidor (como GitHub Pages), não esqueça de fazer commit das mudanças e atualizar o repositório.

## 5. Dicas para Inserir Jogadores

- Siga o padrão de nomes e IDs para evitar conflitos com outros jogadores.
- Mantenha valores (`value`) coerentes com os overalls e idade. Jogadores jovens e talentosos possuem valores mais altos.
- Utilize a propriedade `source` como `"custom"` para marcar jogadores que você adicionou manualmente, facilitando a organização.
- Sempre revise o arquivo `players.json` após editar para garantir que seja um JSON válido (vírgulas e colchetes corretos).

Com essas orientações, você terá total liberdade para expandir o universo do **Vale Futebol Manager 2026**, adicionando suas estrelas favoritas ou criando novos talentos fictícios com identidades visuais próprias.