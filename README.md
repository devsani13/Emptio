# Emptio

Uma aplicação web desenvolvida para gerenciamento de compras, controle de catálogo e histórico de carrinhos. O **Emptio** oferece uma interface intuitiva, suporte a perfis de usuários comuns e acesso especial para moderadores gerenciarem o catálogo.

## Integrantes do Grupo

| Nome | E-mail | 
| ----- | ----- | 
| **Ana Laura Martins de Oliveira** | `analoliveira@unisantos.br` | 
| **Dennis de Oliveira Monteiro** | `dmonteiro@unisantos.br` | 
| **Samuel Martins Passos da Silva** | `samuelmartins@unisantos.br` | 
| 

## Sobre o Projeto

O **Emptio** tem como principal objetivo simplificar o acompanhamento de listas de compras e gerenciamento de produtos.

### Funcionalidades Principais:

* **Autenticação Segura:** Cadastro de novos usuários e login com criptografia (*SHA-256*) para senhas.

* **Painel do Moderador (`admin`):** Permite adicionar, editar e remover itens do catálogo padrão de produtos.

* **Gerenciamento de Carrinho:** Adição de produtos com seleção rápida por combobox, cálculo automático de subtotal e total com formatação de moeda em tempo real ($R\$ 0,00$).

* **Histórico de Compras:** Salve e consulte carrinhos finalizados a qualquer momento.

* **Filtro em Tempo Real:** Pesquisa dinâmica por nome de produtos e itens no histórico.

* **Edição de Perfil:** Alteração de dados cadastrais e senha.

## Tecnologias Utilizadas

* **HTML5 & CSS3**

* **JavaScript (ES6+)** / **TypeScript** (Orientação a Objetos, Manipulação da DOM e LocalStorage/SessionStorage)

* **Bootstrap 6 (Alpha)** (Componentes visuais e layout responsivo)

## Configuração e Execução

Como a aplicação é estática e roda diretamente no navegador utilizando `localStorage` para a persistência de dados, não é necessária a instalação de dependências.

### Pré-requisitos

* Um navegador web (Google Chrome, Mozilla Firefox, Microsoft Edge, Opera, Safari, etc.).

* Opcional: Extensão **Live Server** no VS Code.

### 🚀 Como executar o software

1. **Clonar o Repositório**

   ```
   git clone https://github.com/devsani13/emptio.git
   
   ```

2. **Navegar até a pasta do projeto**

   ```
   cd Emptio
   
   ```

3. **Abrir a Aplicação**

   * **Opção 1 (Direto no navegador):** Dê um duplo clique no arquivo `indexlogin.html`.

   * **Opção 2 (Com Live Server no VS Code):**

     1. Abra a pasta do projeto no VS Code.

     2. Clique com o botão direito no arquivo `indexlogin.html`.

     3. Selecione **"Open with Live Server"**.

## Credenciais de Acesso (Testes)

* **Moderador (Painel Admin):**

  * **Usuário:** `admin`

  * **Senha:** `123`

* **Usuário Comum:**

  * Cadastre-se na tela inicial através do formulário de registro.