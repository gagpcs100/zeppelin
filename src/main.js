import { startApp } from "./app.js";

startApp().catch((error) => {
  console.error("Erro ao iniciar o projeto:", error);

  document.body.innerHTML = `
    <div style="font-family: Arial; padding: 24px; color: white; background: #7a1111; min-height: 100vh;">
      <h1>Erro ao iniciar o TP2 Zeppelin</h1>
      <p>Copie o texto abaixo e me mande:</p>
      <pre style="white-space: pre-wrap; background: rgba(0,0,0,0.35); padding: 16px; border-radius: 8px;">
${error.stack || error.message || error}
      </pre>
    </div>
  `;
});
