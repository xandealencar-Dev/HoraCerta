# ⏰ Hora Certa

Sistema web de controle de ponto desenvolvido para registrar jornadas de trabalho, calcular banco de horas, acompanhar carga horária mensal e gerar relatórios de forma simples e intuitiva.

## 📖 Sobre o projeto

O **Hora Certa** foi desenvolvido para auxiliar funcionários e empresas no acompanhamento da jornada de trabalho. O sistema permite registrar entradas e saídas, calcular automaticamente o saldo de horas e estimar descontos com base no salário informado pelo usuário.

O projeto foi criado com foco em organização, usabilidade e precisão nos cálculos de jornada.

---

## ✨ Funcionalidades

- 🔐 Login e autenticação de usuários
- 👤 Cadastro de usuários
- ⏰ Registro de ponto
  - Entrada
  - Saída para almoço
  - Retorno do almoço
  - Saída final
- 📊 Dashboard com resumo das horas trabalhadas
- 📈 Banco de horas
- 💰 Estimativa de descontos automáticos
- 👨‍💼 Cadastro de salário
- 🕒 Cadastro de carga horária mensal
- 📅 Controle da folha no período de 25 a 25
- 📄 Geração de relatório em PDF *(em desenvolvimento)*
- 📱 Interface responsiva
- ☁️ Armazenamento em banco de dados Supabase

---

## 🖥️ Demonstração

> Adicione aqui imagens ou GIFs do sistema.

### Login

<img width="627" height="788" alt="image" src="https://github.com/user-attachments/assets/0d6d24c5-b2fc-4294-a894-cf4b3cef5dcb" />


### Dashboard

<img width="1562" height="907" alt="image" src="https://github.com/user-attachments/assets/d20787a3-83bb-486b-99fb-4b56f5a93bde" />


### Registro de Ponto

<img width="1566" height="910" alt="image" src="https://github.com/user-attachments/assets/26da1c83-815c-4c14-b5ab-7a409e37b3c0" />



### Perfil

<img width="1567" height="900" alt="image" src="https://github.com/user-attachments/assets/0d9a66a0-1c76-4404-928e-72643fecd075" />



---

## 🚀 Tecnologias utilizadas

### Front-end

- HTML5
- CSS3
- JavaScript
- React
- Vite

### Back-end

- Supabase

### Banco de Dados

- PostgreSQL (Supabase)

### Ferramentas

- Git
- GitHub
- VS Code

---

## 📂 Estrutura do projeto

```text
Hora-Certa
│
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── utils/
│   └── App.jsx
│
├── package.json
├── vite.config.js
└── README.md
```

---

## ⚙️ Como executar o projeto

### Clone o repositório

```bash
git clone https://github.com/xandealencar-Dev/Hora-Certa.git
```

Entre na pasta

```bash
cd Hora-Certa
```

Instale as dependências

```bash
npm install
```

Inicie o projeto

```bash
npm run dev
```

---

## 🗄️ Banco de Dados

O projeto utiliza **Supabase** como banco de dados.

Principais tabelas:

- usuarios
- registros_ponto

---

## 📊 Funcionalidades do Dashboard

O Dashboard apresenta:

- Saldo acumulado
- Horas trabalhadas
- Horas restantes
- Banco de horas
- Salário informado
- Desconto estimado
- Salário líquido estimado
- Indicadores de desempenho da jornada

---

## 🧮 Regras de cálculo

O sistema realiza automaticamente:

- Cálculo das horas trabalhadas por dia
- Cálculo do saldo diário
- Banco de horas
- Horas positivas
- Horas negativas
- Horas extras
- Horas restantes
- Desconto por atrasos
- Valor da hora
- Valor do minuto
- Estimativa de desconto salarial

Todos os cálculos são baseados na carga horária mensal cadastrada pelo usuário.

---

## 📅 Fechamento da folha

O sistema considera o período:

**25 de um mês até 25 do mês seguinte**

Todo o banco de horas e os relatórios são calculados utilizando esse intervalo.

---

## 📈 Melhorias planejadas

- [x] Relatório mensal em PDF
- [ ] Exportação para Excel
- [ ] Dashboard administrativo
- [ ] Cadastro de empresas
- [ ] Cadastro de departamentos
- [ ] Gestão de equipes
- [ ] Notificações automáticas
- [ ] Banco de horas avançado
- [ ] Filtro por período
- [ ] Tema escuro
- [ ] Aplicativo mobile

---

## 💡 Objetivo

Este projeto foi desenvolvido com o objetivo de aprimorar conhecimentos em desenvolvimento web, integração com banco de dados e construção de aplicações completas para gestão de jornada de trabalho.

---

## 👨‍💻 Autor

**Alexandre Alencar**

GitHub:
https://github.com/SEU-USUARIO

LinkedIn:
https://linkedin.com/in/SEU-LINK

---

## 📄 Licença

Este projeto está licenciado sob a licença MIT.
