import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Home, User as UserIcon, Lock, Zap } from "lucide-react";
import { auth, db } from "../lib/firebase";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

// Helpper mapping function
export const usernameToEmail = (username: string) =>
  `alisonsantanadigital+${username.trim().toLowerCase()}@gmail.com`;

export function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const email = usernameToEmail(username);
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err: any) {
      console.log("Login error:", err.code, err.message);
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential" ||
        err.code === "auth/invalid-login-credentials"
      ) {
        setError("Usuário ou senha incorretos.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Muitas tentativas. Tente novamente mais tarde.");
      } else {
        setError("Erro ao fazer login. Tente novamente. (" + err.code + ")");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!username) {
      setError("Digite seu usuário no campo acima para resetar a senha.");
      return;
    }
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, usernameToEmail(username));
      setSuccess(
        "Instruções de redefinição foram enviadas para o email do administrador (alisonsantanadigital@gmail.com).",
      );
      setError("");
    } catch (err) {
      setError(
        "Erro ao solicitar redefinição. Verifique se o usuário está correto.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAutoCreateAccounts = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      // 1. Create alisonsan
      const emailAlison = usernameToEmail("alisonsan");
      try {
        const { user: user1 } = await createUserWithEmailAndPassword(
          auth,
          emailAlison,
          "alisonsan123",
        );
        await setDoc(doc(db, "users", user1.uid), {
          displayName: "Alison",
          username: "alisonsan",
          email: emailAlison,
          status: "active",
          appRole: "admin",
          preferences: {},
        });
      } catch (e: any) {
        console.error("Alison creation error:", e);
      }

      // 2. Create laysan
      const emailLaysa = usernameToEmail("laysan");
      try {
        const { user: user2 } = await createUserWithEmailAndPassword(
          auth,
          emailLaysa,
          "laysan123",
        );
        await setDoc(doc(db, "users", user2.uid), {
          displayName: "Laysa",
          username: "laysan",
          email: emailLaysa,
          status: "active",
          appRole: "user",
          preferences: {},
        });
      } catch (e: any) {
        console.error("Laysa creation error:", e);
      }

      setSuccess(
        'Contas "alisonsan" e "laysan" criadas com sucesso! Você pode fazer o login acima.',
      );
      setUsername("alisonsan");
      setPassword("alisonsan123");
    } catch (err: any) {
      console.error(err);
      setError("Erro ao criar contas automaticamente: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 mb-6">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Home className="w-7 h-7 text-slate-900" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">
          Bem-vindo à Nossa Casa
        </h1>
        <p className="text-center text-slate-500 mb-8 text-sm">
          O painel de controle financeiro da sua família.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Usuário"
            type="text"
            placeholder="Seu usuário"
            icon={<UserIcon className="w-4 h-4" />}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-rose-400 text-sm text-center">{error}</p>
          )}
          {success && (
            <p className="text-sky-600 text-sm text-center font-medium bg-sky-400/10 p-2 rounded-lg">
              {success}
            </p>
          )}

          <div className="flex items-center justify-between mt-2 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded text-sky-600 focus:ring-teal-600 w-4 h-4 border-slate-300"
              />
              <span className="text-sm text-slate-600">Lembrar-me</span>
            </label>
            <button
              onClick={handleResetPassword}
              type="button"
              className="text-sm font-medium text-sky-600 hover:text-sky-700"
            >
              Esqueci a senha
            </button>
          </div>

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Entrar
          </Button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-8">
          Ainda não tem uma conta?{" "}
          <Link
            to="/register"
            className="font-medium text-sky-600 hover:text-sky-700"
          >
            Criar agora
          </Link>
        </p>
      </div>

      <button
        onClick={handleAutoCreateAccounts}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-100 transition-colors shadow-sm"
      >
        <Zap className="w-4 h-4 text-amber-500" />
        Configurar contas "alisonsan" e "laysan" automaticamente
      </button>
    </div>
  );
}
