"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Mantendo o seu Supabase pro Chat continuar funcionando
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://urpuiznydrlwmaqhdids.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "sb_publishable_9G6JUKnfZ1mekk7qUKdTQA_TXbARtR0";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function CFODashboard() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    // Carrega mensagens iniciais do chat
    supabase
      .from("chat")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data }) => setMessages(data || []));

    // Realtime do Chat
    const channel = supabase
      .channel("chat-room")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat" },
        (payload) => {
          setMessages((msgs) => [...msgs, payload.new]);
        }
      )
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, []);

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    await supabase.from("chat").insert({ user: user || "Visitante", text: chatInput });
    setChatInput("");
  };

  // 🚀 AQUI ESTÁ A MÁGICA DO LOGIN BÁSICO:
  const handleLogin = () => {
    setLoading(true);
    setError(null);

    // Dando um delay de 1 segundo só pra parecer que tá processando pesado (estilo Vale do Silício)
    setTimeout(() => {
      if (user.toLowerCase() === "gustavo" && pass === "admin2024") {
        window.location.href = "/cockpit";
      } else {
        setError("Acesso negado. ID ou Senha incorretos.");
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0f1c" }}>
      <div className="card login-card" style={{ width: 380, padding: 32, background: "rgba(20,30,50,0.95)", borderRadius: 24, boxShadow: "0 8px 32px #0006" }}>
        <div className="login-logo" style={{ textAlign: "center", marginBottom: 24 }}>
          <i data-lucide="cpu" style={{ fontSize: 44, color: "#00bfff" }}></i>
          <h1 style={{ fontWeight: 700, fontSize: 32, color: "#fff" }}>BG <span style={{ color: "#00bfff" }}>TECH</span></h1>
        </div>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <span className="login-badge" style={{ background: "#1a2336", color: "#00bfff", padding: "6px 18px", borderRadius: 12, fontWeight: 500 }}>
            <i data-lucide="shield-check" style={{ fontSize: 16, marginRight: 4 }}></i> Acesso Restrito CFO
          </span>
        </div>
        <div className="login-field" style={{ marginBottom: 16 }}>
          <input
            type="text"
            value={user}
            onChange={e => setUser(e.target.value)}
            className="login-input"
            placeholder="ID de Acesso (ex: gustavo)"
            autoComplete="username"
            style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #222", fontSize: 16, background: "#111", color: "#fff" }}
          />
        </div>
        <div className="login-field" style={{ marginBottom: 32 }}>
          <input
            type="password"
            value={pass}
            onChange={e => setPass(e.target.value)}
            className="login-input"
            placeholder="Senha do Cofre"
            autoComplete="current-password"
            style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #222", fontSize: 16, background: "#111", color: "#fff" }}
          />
        </div>
        <button
          className="btn-primary"
          style={{ width: "100%", padding: "18px", fontSize: 16, justifyContent: "center", background: loading ? "#222" : "#00bfff", color: "#fff", borderRadius: 8, border: "none", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", transition: "all 0.3s" }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Descriptografando..." : "Destrancar Sistema"}
        </button>
        {error && <div style={{ color: "#ff4d4f", marginTop: 24, textAlign: "center", fontWeight: 500 }}>{error}</div>}
        
        {/* Chat sincronizado */}
        <div style={{ marginTop: 40, background: "#181f2a", borderRadius: 16, padding: 24, maxWidth: 420 }}>
          <h2 style={{ color: "#00bfff", fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Chat dos Sócios</h2>
          <div style={{ maxHeight: 180, overflowY: "auto", marginBottom: 16, background: "#222", borderRadius: 8, padding: 12 }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ marginBottom: 8, color: msg.user === user ? "#00bfff" : "#fff" }}>
                <b>{msg.user}:</b> {msg.text}
              </div>
            ))}
          </div>
          <div style={{ display: "flex" }}>
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Digite sua mensagem..."
              style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #333", fontSize: 15, background: "#111", color: "#fff" }}
            />
            <button
              onClick={sendMessage}
              style={{ marginLeft: 8, background: "#00bfff", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 600, cursor: "pointer" }}
            >Enviar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
