/**
 * /apply/ally
 * Página oculta de solicitud para unirse como Aliado (tienda/marca).
 * Solo accesible por botón directo desde Allies.tsx o el menú de Aliados.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { ChevronLeft, CheckCircle, Shield, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

const inputCls = "w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors";
const labelCls = "block text-xs font-mono text-muted-foreground tracking-widest mb-1.5";

export default function AllyApply() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", website: "", country: "", city: "",
    address: "", email: "", phone: "", instagram: "", twitter: "",
    facebook: "", tiktok: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submitMutation = trpc.allies.submit.useMutation({
    onSuccess: () => {
      toast.success("¡Solicitud enviada! El equipo te contactará pronto.");
      setSubmitted(true);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { name: form.name };
    if (form.description) payload.description = form.description;
    if (form.website)     payload.website = form.website;
    if (form.country)     payload.country = form.country;
    if (form.city)        payload.city = form.city;
    if (form.address)     payload.address = form.address;
    if (form.email)       payload.email = form.email;
    if (form.phone)       payload.phone = form.phone;
    if (form.instagram)   payload.instagram = form.instagram;
    if (form.twitter)     payload.twitter = form.twitter;
    if (form.facebook)    payload.facebook = form.facebook;
    if (form.tiktok)      payload.tiktok = form.tiktok;
    submitMutation.mutate(payload);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4 px-6">
        <Shield className="w-16 h-16 text-red-500" />
        <h1 className="font-orbitron font-bold text-2xl text-white text-center">Inicia sesión primero</h1>
        <p className="text-muted-foreground text-center text-sm">Necesitas una cuenta de Red Level Circle para aplicar como Aliado.</p>
        <button onClick={() => navigate("/login")} className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-orbitron font-bold tracking-widest text-sm transition-colors">
          IR AL LOGIN
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="font-orbitron font-bold text-2xl text-white">¡Solicitud enviada!</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Tu tienda ha sido enviada para revisión. El equipo de Red Level Circle la revisará y te contactará pronto.
          </p>
          <button onClick={() => navigate("/allies")} className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-orbitron font-bold tracking-widest text-sm transition-colors">
            VER DIRECTORIO DE ALIADOS
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => window.history.back()} className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="font-orbitron font-bold text-sm text-white tracking-widest">UNIRSE COMO ALIADO</h1>
          <p className="text-xs text-muted-foreground">Red Level Circle</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="rounded-xl border border-border bg-card/50 p-5 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <Store className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="font-orbitron font-bold text-sm text-white">Datos de tu tienda</h2>
                <p className="text-xs text-muted-foreground">Completa el formulario y el equipo revisará tu solicitud</p>
              </div>
            </div>

            <div>
              <label className={labelCls}>NOMBRE DE LA TIENDA *</label>
              <input required value={form.name} onChange={set("name")} placeholder="Ej: GameZone Store" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>DESCRIPCIÓN</label>
              <textarea value={form.description} onChange={set("description")} placeholder="Breve descripción de tu tienda..." rows={3}
                className={inputCls + " resize-none"} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>PAÍS</label>
                <input value={form.country} onChange={set("country")} placeholder="Ej: Colombia" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>CIUDAD</label>
                <input value={form.city} onChange={set("city")} placeholder="Ej: Bogotá" className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>DIRECCIÓN</label>
              <input value={form.address} onChange={set("address")} placeholder="Dirección física (opcional)" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>SITIO WEB</label>
              <input type="url" value={form.website} onChange={set("website")} placeholder="https://tutienda.com" className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>EMAIL DE CONTACTO</label>
                <input type="email" value={form.email} onChange={set("email")} placeholder="contacto@tienda.com" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>TELÉFONO</label>
                <input value={form.phone} onChange={set("phone")} placeholder="+57 300 000 0000" className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>REDES SOCIALES</label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { key: "instagram", placeholder: "@usuario" },
                  { key: "twitter",   placeholder: "@usuario" },
                  { key: "facebook",  placeholder: "pagina" },
                  { key: "tiktok",    placeholder: "@usuario" },
                ] as const).map(({ key, placeholder }) => (
                  <div key={key}>
                    <label className="block text-[10px] font-mono text-muted-foreground tracking-widest mb-1 capitalize">{key}</label>
                    <input value={form[key]} onChange={set(key)} placeholder={placeholder} className={inputCls} />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-red-900/40 bg-red-950/20 px-4 py-3 text-xs text-zinc-400 leading-relaxed">
              <p className="font-semibold text-red-400 mb-1 uppercase tracking-wider font-mono text-[10px]">Acuerdo de colaboración</p>
              Al unirte como Aliado de Red Level Circle aceptas un acuerdo de <strong className="text-zinc-200">trueque</strong>: nosotros te brindamos visibilidad en nuestro directorio público y canales de comunidad, y tú nos aportas mensualmente un producto relacionado con tu tienda.
            </div>

            {submitMutation.error && (
              <p className="text-red-400 text-xs">{submitMutation.error.message}</p>
            )}

            <Button
              type="submit"
              disabled={submitMutation.isPending || !form.name.trim()}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-orbitron font-bold tracking-widest"
            >
              {submitMutation.isPending ? "Enviando..." : "ENVIAR SOLICITUD"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
