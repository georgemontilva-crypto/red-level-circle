import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { SectionBanner } from "@/components/SectionBanner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Globe, MapPin, Instagram, Twitter, Facebook,
  ExternalLink, Search, Store, Plus, X,
  CheckCircle, Star, Youtube,
} from "lucide-react";
import { DefaultBannerBg } from "@/components/DefaultBannerBg";

// ─── TikTok icon ──────────────────────────────────────────────────────────────
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
    </svg>
  );
}

// ─── Social button ────────────────────────────────────────────────────────────
function SocialBtn({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      title={label}
      className="flex items-center justify-center flex-1 py-2 rounded-xl text-sm font-semibold bg-gray-300 hover:bg-gray-200 text-black transition-colors"
    >
      {icon}
    </a>
  );
}

// ─── Ally Card ────────────────────────────────────────────────────────────────
function AllyCard({ ally }: { ally: any }) {
  const socials = [
    ally.website   && { href: ally.website.startsWith("http") ? ally.website : `https://${ally.website}`, icon: <Globe className="w-5 h-5" />,     label: "Web" },
    ally.instagram && { href: `https://instagram.com/${ally.instagram.replace("@","")}`,                  icon: <Instagram className="w-5 h-5" />, label: "Instagram" },
    ally.twitter   && { href: `https://twitter.com/${ally.twitter.replace("@","")}`,                      icon: <Twitter className="w-5 h-5" />,   label: "Twitter" },
    ally.facebook  && { href: `https://facebook.com/${ally.facebook}`,                                    icon: <Facebook className="w-5 h-5" />,  label: "Facebook" },
    ally.tiktok    && { href: `https://tiktok.com/@${ally.tiktok.replace("@","")}`,                       icon: <TikTokIcon className="w-5 h-5" />, label: "TikTok" },
  ].filter(Boolean) as { href: string; icon: React.ReactNode; label: string }[];

  const subtitle = [ally.city, ally.country].filter(Boolean).join(", ");

  return (
    <div className="w-full bg-black rounded-3xl shadow-2xl">
      {/* Banner Section */}
      <div className="relative h-48 w-full overflow-hidden rounded-3xl">
        {ally.coverImage ? (
          <img src={ally.coverImage} alt={ally.name} className="w-full h-full object-cover" />
        ) : (
          <DefaultBannerBg />
        )}
        {/* Featured badge */}
        {ally.isFeatured && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg z-10">
            <Star className="w-2.5 h-2.5 fill-black" />
            Destacado
          </div>
        )}
      </div>
      {/* Avatar / Logo - Overlapping */}
      <div className="relative px-6 pb-6">
        <div className="flex justify-center -mt-16 mb-4">
          <div className="w-32 h-32 bg-gray-400 rounded-full border-4 border-black shadow-lg overflow-hidden flex items-center justify-center">
            {ally.logo ? (
              <img src={ally.logo} alt={ally.name} className="w-full h-full object-cover" />
            ) : (
              <Store className="w-12 h-12 text-gray-600" />
            )}
          </div>
        </div>
        {/* Name and Description */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-white">{ally.name}</h1>
          </div>
          <p className="text-sm text-gray-400">{subtitle || ally.description || ""}</p>
        </div>
        {/* Social Buttons */}
        {socials.length > 0 ? (
          <div className="flex items-center gap-1.5">
            {socials.slice(0, 4).map((s, i) => (
              <SocialBtn key={i} href={s.href} icon={s.icon} label={s.label} />
            ))}
          </div>
        ) : (
          <Button className="w-full bg-gray-300 hover:bg-gray-200 text-black font-semibold py-2 rounded-full transition-colors">
            Ver aliado
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Submit Form ──────────────────────────────────────────────────────────────
function SubmitAllyForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "", description: "", website: "", country: "", city: "",
    address: "", email: "", phone: "", instagram: "", twitter: "", facebook: "", tiktok: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = trpc.allies.submit.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { name: form.name };
    if (form.description) payload.description = form.description;
    if (form.website) payload.website = form.website;
    if (form.country) payload.country = form.country;
    if (form.city) payload.city = form.city;
    if (form.address) payload.address = form.address;
    if (form.email) payload.email = form.email;
    if (form.phone) payload.phone = form.phone;
    if (form.instagram) payload.instagram = form.instagram;
    if (form.twitter) payload.twitter = form.twitter;
    if (form.facebook) payload.facebook = form.facebook;
    if (form.tiktok) payload.tiktok = form.tiktok;
    submitMutation.mutate(payload);
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const inputCls = "w-full bg-zinc-800/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/60 transition-colors";
  const labelCls = "block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1";

  if (submitted) {
    return (
      <div className="text-center py-12 px-6">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h3 className="font-orbitron font-bold text-xl text-white mb-2">¡Solicitud enviada!</h3>
        <p className="text-zinc-400 text-sm mb-6">
          Tu tienda ha sido enviada para revisión. El equipo de Red Level Circle la revisará y te contactará pronto.
        </p>
        <Button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white">
          Cerrar
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-orbitron font-bold text-lg text-white">Unirse como Aliado</h3>
          <p className="text-zinc-400 text-xs mt-0.5">Completa el formulario y el equipo revisará tu solicitud</p>
        </div>
        <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div>
        <label className={labelCls}>Nombre de la tienda *</label>
        <input required value={form.name} onChange={set("name")} placeholder="Ej: GameZone Store" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Descripción</label>
        <textarea value={form.description} onChange={set("description")} placeholder="Breve descripción de tu tienda..." rows={3}
          className={inputCls + " resize-none"} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>País</label>
          <input value={form.country} onChange={set("country")} placeholder="Ej: Colombia" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Ciudad</label>
          <input value={form.city} onChange={set("city")} placeholder="Ej: Bogotá" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Dirección</label>
        <input value={form.address} onChange={set("address")} placeholder="Dirección física (opcional)" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Sitio web</label>
        <input type="url" value={form.website} onChange={set("website")} placeholder="https://tutienda.com" className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Email de contacto</label>
          <input type="email" value={form.email} onChange={set("email")} placeholder="contacto@tienda.com" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Teléfono</label>
          <input value={form.phone} onChange={set("phone")} placeholder="+57 300 000 0000" className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Instagram</label>
          <input value={form.instagram} onChange={set("instagram")} placeholder="@usuario" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Twitter / X</label>
          <input value={form.twitter} onChange={set("twitter")} placeholder="@usuario" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Facebook</label>
          <input value={form.facebook} onChange={set("facebook")} placeholder="pagina" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>TikTok</label>
          <input value={form.tiktok} onChange={set("tiktok")} placeholder="@usuario" className={inputCls} />
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
        disabled={submitMutation.isPending}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
      >
        {submitMutation.isPending ? "Enviando..." : "Enviar solicitud"}
      </Button>
    </form>
  );
}

// ─── Main Allies Page ─────────────────────────────────────────────────────────
export function AlliesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const { data: locations } = trpc.allies.locations.useQuery();
  const { data: allies = [], isLoading } = trpc.allies.list.useQuery({
    country: country || undefined,
    city: city || undefined,
    search: search || undefined,
  });

  const featured = allies.filter((a: any) => a.isFeatured);
  const regular = allies.filter((a: any) => !a.isFeatured);

  const availableCities = country
    ? (locations?.cities ?? []).filter((c: string) =>
        allies.some((a: any) => a.country === country && a.city === c)
      )
    : (locations?.cities ?? []);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-main)" }}>
      {/* Banner */}
      <SectionBanner sectionKey="allies" height="h-48 sm:h-64 lg:h-72">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs uppercase tracking-widest text-red-400">Red Level Circle</span>
          <h1 className="font-orbitron font-black text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight drop-shadow-lg">
            ALIADOS
          </h1>
          <p className="text-zinc-300 text-sm mt-1 max-w-md">
            Directorio de tiendas y sponsors que apoyan la comunidad
          </p>
        </div>
      </SectionBanner>

      <div className="py-6 space-y-6">
        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2 flex-1">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar aliado..."
                className="w-full bg-zinc-900/80 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/60 transition-colors"
              />
            </div>

            {/* Country filter */}
            <Select value={country || "__all__"} onValueChange={v => { setCountry(v === "__all__" ? "" : v); setCity(""); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Todos los países" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los países</SelectItem>
                {(locations?.countries ?? []).map((c: string) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* City filter */}
            {availableCities.length > 0 && (
              <Select value={city || "__all__"} onValueChange={v => setCity(v === "__all__" ? "" : v)}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Todas las ciudades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas las ciudades</SelectItem>
                  {availableCities.map((c: string) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Clear filters */}
            {(country || city || search) && (
              <button
                onClick={() => { setCountry(""); setCity(""); setSearch(""); }}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors px-2"
              >
                <X className="w-3.5 h-3.5" />
                Limpiar
              </button>
            )}
          </div>

          {/* CTA */}
          <Button
            onClick={() => user ? setShowForm(true) : setShowLoginPrompt(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-2 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Ser Aliado
          </Button>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] overflow-hidden animate-pulse">
                <div className="bg-zinc-800/60" style={{ height: "160px" }} />
                <div className="p-4 pt-10 space-y-3">
                  <div className="h-4 bg-zinc-800/60 rounded w-2/3 mx-auto" />
                  <div className="h-3 bg-zinc-800/60 rounded w-1/2 mx-auto" />
                  <div className="flex gap-1.5 mt-3">
                    {[...Array(3)].map((_, j) => <div key={j} className="h-8 bg-zinc-800/60 rounded-xl flex-1" />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Featured section */}
        {!isLoading && featured.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-yellow-500" />
              <h2 className="font-orbitron font-bold text-sm text-zinc-300 uppercase tracking-wider">Aliados Destacados</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {featured.map((ally: any) => <AllyCard key={ally.id} ally={ally} />)}
            </div>
          </section>
        )}

        {/* Regular allies */}
        {!isLoading && regular.length > 0 && (
          <section>
            {featured.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Store className="w-4 h-4 text-zinc-400" />
                <h2 className="font-orbitron font-bold text-sm text-zinc-300 uppercase tracking-wider">Directorio</h2>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {regular.map((ally: any) => <AllyCard key={ally.id} ally={ally} />)}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!isLoading && allies.length === 0 && (
          <div className="text-center py-20">
            <Store className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="font-orbitron font-bold text-xl text-zinc-400 mb-2">
              {search || country || city ? "Sin resultados" : "Aún no hay aliados"}
            </h3>
            <p className="text-zinc-500 text-sm mb-6 max-w-sm mx-auto">
              {search || country || city
                ? "Prueba con otros filtros o limpia la búsqueda."
                : "Sé el primero en unirte al directorio de aliados de Red Level Circle."}
            </p>
            <Button onClick={() => setShowForm(true)} className="bg-red-600 hover:bg-red-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Ser el primer Aliado
            </Button>
          </div>
        )}
      </div>

      {/* Submit form modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl overflow-y-auto max-h-[90vh] shadow-2xl">
            <SubmitAllyForm onClose={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {/* Login required prompt */}
      {showLoginPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowLoginPrompt(false); }}
        >
          <div className="w-full max-w-sm bg-zinc-900 border border-red-900/50 rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-red-600/20 border border-red-600/40 flex items-center justify-center mx-auto mb-4">
              <Store className="w-7 h-7 text-red-400" />
            </div>
            <h3 className="font-orbitron font-bold text-white text-lg mb-2">Inicia sesión primero</h3>
            <p className="text-zinc-400 text-sm mb-6">
              Para enviar una solicitud como Aliado necesitas tener una cuenta en Red Level Circle.
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="/login"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors text-center block"
              >
                Iniciar sesión
              </a>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="w-full text-zinc-400 hover:text-white text-sm py-2 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
