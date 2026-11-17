// ==========================================
// CADASTRO DE USUÁRIO
// ==========================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", function (event) {

        event.preventDefault();

        // Pega os valores digitados
        const novoNome = document.getElementById("registerName").value.trim();
        const novoUsuario = document.getElementById("registerUsername").value.trim();
        const novaSenha = document.getElementById("registerPassword").value.trim();

        // Verifica se os campos estão preenchidos
        if (!novoNome || !novoUsuario || !novaSenha) {
            alert("Preencha todos os campos!");
            return;
        }

        // Cria o usuário
        const usuario = new Usuarios(
            novoNome,
            novoUsuario,
            novaSenha
        );

        // Acessa o banco de usuários
        const db = new UsuariosDB();

        // Verifica se o usuário já existe
        if (db.usuarioExiste(novoUsuario)) {
            alert("Esse nome de usuário já está sendo utilizado!");
            return;
        }

        // Salva o usuário
        hashSenhaAsync(novaSenha).then(hash => {
            usuario.senha = hash;
            if (!db.salvarUsuarios(usuario)) {
                alert("Não foi possível salvar o usuário.");
                return;
            }

            alert("Usuário cadastrado com sucesso!");
            registerForm.reset();

            // Muda para a tela de login automaticamente
            const loginFormEl = document.getElementById("loginForm");
            const registerFormEl = document.getElementById("registerForm");

            if (loginFormEl && registerFormEl) {
                registerFormEl.hidden = true;
                loginFormEl.hidden = false;
            }
        }).catch(erro => {
            console.error("Não foi possível proteger a senha:", erro);
            alert("Não foi possível cadastrar o usuário.");
        });

    });

}


// ==========================================
// LOGIN
// ==========================================

// ==========================================
// LOGIN
// ==========================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", function(event) {

        event.preventDefault();

        // Pega os dados digitados
        const usuario = document.getElementById("username").value.trim();
        const senha = document.getElementById("password").value.trim();

        if (!usuario || !senha) {
            alert("Preencha usuário e senha!");
            return;
        }

        // ==========================================
        // CREDENCIAIS PRÉ-DEFINIDAS DO MODERADOR
        // ==========================================
        
        const MODERADOR_USER = "admin";
        const MODERADOR_SENHA = "123";

        if (usuario === MODERADOR_USER && senha === MODERADOR_SENHA) {
            alert("Login de Moderador realizado com sucesso!");

            sessionStorage.setItem("usuarioLogado", JSON.stringify({
                nomeusuario: "Administrador",
                usuario: MODERADOR_USER,
                tipo: "moderador"
            }));

            // Redireciona para o painel exclusivo do moderador
            window.location.href = "moderador.html";
            return;
        }
        // ==========================================

        // Acessa o banco de usuários normal para os demais clientes
        const db = new UsuariosDB();

        db.verificarLoginSeguro(usuario, senha).then(usuarioLogin => {
            if (usuarioLogin) {
                alert("Login realizado com sucesso!");

                sessionStorage.setItem("usuarioLogado", JSON.stringify({
                    nomeusuario: usuarioLogin.nomeusuario,
                    usuario: usuarioLogin.usuario,
                    tipo: "comum"
                }));

                // Redireciona para a página padrão do usuário
                window.location.href = "index.html";
            } else {
                alert("Usuário ou senha incorretos!");
            }
        }).catch(erro => {
            console.error("Não foi possível verificar o login:", erro);
            alert("Não foi possível realizar o login.");
        });

    });

}