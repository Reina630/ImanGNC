import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import imanLogo from "@/assets/logo-iman.png";

export default function ForgotPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={imanLogo} alt="IMAN" className="h-14 rounded-lg" />
        </div>

        <div className="stat-card !p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Entrez votre email pour recevoir un lien de réinitialisation
            </p>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <Input type="email" placeholder="votre@email.com" className="h-11" />
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Envoyer le lien
            </button>
          </form>

          <Link
            to="/login"
            className="flex items-center justify-center gap-2 text-sm text-primary hover:underline mt-4"
          >
            <ArrowLeft className="h-4 w-4" /> Retour à la connexion
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
