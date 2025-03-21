/**
 * Utilitaires pour la gestion des erreurs
 */

/**
 * Vérifie si une erreur est une erreur de tuyau cassé (EPIPE)
 * Ces erreurs se produisent lorsque le destinataire a fermé la connexion
 */
export function isPipeError(error: any): boolean {
  return (
    error && 
    (error.code === 'EPIPE' || 
     error.code === 'ERR_STREAM_DESTROYED' ||
     (typeof error.message === 'string' && error.message.includes('write EPIPE')))
  );
}

/**
 * Gère les erreurs de pipe de manière silencieuse
 * @param error L'erreur à gérer
 * @param defaultValue Valeur par défaut à retourner
 */
export function handlePipeErrorSilently<T>(error: any, defaultValue: T): T {
  if (isPipeError(error)) {
    console.error("Connexion interrompue (EPIPE), client probablement déconnecté");
    // Pour les erreurs de pipe, nous retournons simplement la valeur par défaut
    return defaultValue;
  }
  
  // Pour les autres erreurs, nous les relançons
  throw error;
}

/**
 * Wrapper pour les fonctions qui peuvent générer des erreurs EPIPE
 * @param fn Fonction à exécuter
 * @param defaultValue Valeur par défaut à retourner en cas d'erreur EPIPE
 */
export async function withPipeErrorHandling<T>(fn: () => Promise<T>, defaultValue: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    return handlePipeErrorSilently(error, defaultValue);
  }
}
