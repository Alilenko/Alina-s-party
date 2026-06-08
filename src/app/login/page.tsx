"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Eye, EyeOff } from "lucide-react";

type LoginGuest = { name: string; slug: string };

export default function LoginPage() {
  const router = useRouter();
  const [guests, setGuests] = useState<LoginGuest[]>([]);
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/guests/login-list")
      .then((r) => r.json())
      .then((data) => setGuests(data.guests || []));
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Помилка входу");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Помилка з'єднання");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 pb-8">
      <div className="mb-8 text-center">
        <Sparkles className="mx-auto mb-4 text-party-gold" size={32} />
        <h1 className="party-title text-3xl font-bold text-party-gold-light">
          Alina&apos;s Party
        </h1>
        <p className="mt-2 text-sm text-party-cream/60">Свято починається тут</p>
      </div>

      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm space-y-4"
        suppressHydrationWarning
      >
        <div>
          <label className="mb-2 block text-xs font-medium tracking-wider text-party-gold/70">
            ХТО ТИ?
          </label>
          <select
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="party-input appearance-none"
            autoComplete="username"
            required
            suppressHydrationWarning
          >
            <option value="" disabled>
              Обери своє ім&apos;я
            </option>
            {guests.map((p) => (
              <option key={p.slug} value={p.slug} className="bg-party-bg">
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium tracking-wider text-party-gold/70">
            ПАРОЛЬ
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="party-input pr-12"
              placeholder="Введи пароль"
              autoComplete="current-password"
              required
              suppressHydrationWarning
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-party-gold/60 transition-colors hover:text-party-gold"
              aria-label={showPassword ? "Сховати пароль" : "Показати пароль"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-center text-sm text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="party-btn w-full py-4 text-sm font-semibold tracking-widest disabled:opacity-50"
        >
          {loading ? "ВХІД..." : "УВІЙТИ"}
        </button>
      </form>

      <p className="mt-8 text-center text-xs text-party-cream/40">
        У кожного гостя свій пароль — запитай у Аліни
      </p>
    </div>
  );
}
