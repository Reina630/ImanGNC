import { User, Bell, Shield, Palette, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

const sections = [
  {
    icon: User, title: "Profil",
    fields: [
      { label: "Nom complet", value: "Amadou Diallo", type: "text" },
      { label: "Email", value: "amadou@iman.com", type: "email" },
      { label: "Poste", value: "xxxx", type: "text" },
    ],
  },
  {
    icon: Bell, title: "Notifications",
    toggles: [
      { label: "Nouveaux partages", enabled: true },
      { label: "Commentaires", enabled: true },
      { label: "Mises à jour système", enabled: false },
    ],
  },
];

export default function SettingsPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground text-sm">Gérez votre compte et préférences</p>
      </div>

      {/* Profile */}
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-5">
          <User className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Profil</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sections[0].fields!.map((f) => (
            <div key={f.label}>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{f.label}</label>
              <Input type={f.type} defaultValue={f.value} className="h-10" />
            </div>
          ))}
        </div>
        <button className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          Sauvegarder
        </button>
      </div>

      {/* Notifications */}
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Notifications</h3>
        </div>
        <div className="space-y-4">
          {sections[1].toggles!.map((t) => (
            <div key={t.label} className="flex items-center justify-between">
              <span className="text-sm">{t.label}</span>
              <button
                className={`w-10 h-6 rounded-full transition-colors ${
                  t.enabled ? "bg-primary" : "bg-muted"
                } relative`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-primary-foreground transition-transform ${
                    t.enabled ? "left-5" : "left-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Sécurité</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Mot de passe actuel</label>
            <Input type="password" placeholder="••••••••" className="h-10 max-w-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Nouveau mot de passe</label>
            <Input type="password" placeholder="••••••••" className="h-10 max-w-sm" />
          </div>
          <button className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
            Changer le mot de passe
          </button>
        </div>
      </div>
    </motion.div>
  );
}
