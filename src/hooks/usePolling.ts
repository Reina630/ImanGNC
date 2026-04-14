import { useEffect, useRef } from "react";

/**
 * Appelle `callback` toutes les `intervalMs` millisecondes tant que le composant
 * est monté. Le premier appel est géré par le composant lui-même ; ce hook
 * ne gère que les appels répétés.
 *
 * @param callback  Fonction à appeler périodiquement (peut changer entre les renders)
 * @param intervalMs  Délai entre les appels en ms (défaut : 20 000)
 * @param enabled  Désactiver le polling sans démonter le composant (défaut : true)
 */
export function usePolling(
  callback: () => void,
  intervalMs: number = 20_000,
  enabled: boolean = true
) {
  const savedCallback = useRef(callback);

  // Toujours garder la référence fraîche sans réinitialiser l'intervalle
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => savedCallback.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
