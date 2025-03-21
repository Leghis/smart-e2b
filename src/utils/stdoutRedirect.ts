/**
 * Utilitaire pour rediriger temporairement stdout vers stderr
 * Utilisé pour empêcher les messages de débogage d'interférer avec le protocole JSON-RPC
 */

// Module external pour intercepter stdout
import { Transform, Writable } from 'stream';
import { isPipeError } from './errorHandling.js';

// Sauvegarde des streams originaux
let originalStdoutWrite: Function | null = null;
let originalStderrWrite: Function | null = null;
let isHooked = false;

/**
 * Classe qui filtre le stdout pour n'autoriser que les messages JSON valides
 */
class JsonFilter extends Transform {
  private buffer: string = '';

  constructor() {
    super({
      objectMode: false,
      decodeStrings: false,
      encoding: 'utf8'
    });
  }

  _transform(chunk: string | Buffer, encoding: string, callback: Function) {
    let text = typeof chunk === 'string' ? chunk : chunk.toString();
    
    // Essayer de voir si c'est du JSON valide ou si ça commence par { ou [
    if ((text.trim().startsWith('{') || text.trim().startsWith('[')) && 
        text.trim().endsWith('}') || text.trim().endsWith(']')) {
      try {
        // Vérifier si c'est du JSON valide
        JSON.parse(text);
        this.push(text);
      } catch (e) {
        // Ce n'est pas un JSON valide, rediriger vers stderr
        process.stderr.write(text);
      }
    } else {
      // Ce n'est pas un JSON, rediriger vers stderr
      process.stderr.write(text);
    }
    
    callback();
  }
}

/**
 * Installe le hook global pour rediriger tout stdout non-JSON vers stderr
 */
export function hookStdout() {
  if (isHooked) return;
  
  // Sauvegarder les fonctions d'écriture originales
  originalStdoutWrite = process.stdout.write;
  originalStderrWrite = process.stderr.write;
  
  // Créer un nouveau filtre
  const jsonFilter = new JsonFilter();
  
  // Hook stdout.write pour rediriger vers notre filtre
  (process.stdout as any).write = function(chunk: string | Buffer, encoding?: string, callback?: Function) {
    try {
      // Si c'est une chaîne qui ne ressemble pas à du JSON, rediriger vers stderr
      if (typeof chunk === 'string') {
        if (!chunk.trim().startsWith('{') && !chunk.trim().startsWith('[')) {
          return (process.stderr as any).write(chunk, encoding, callback);
        }
        
        // Vérifier s'il s'agit de debug output contenant "Creating" 
        if (chunk.includes('Creating') || chunk.includes('new')) {
          return (process.stderr as any).write(chunk, encoding, callback);
        }

        // Pour toutes les autres chaînes, essayer de voir si c'est du JSON
        try {
          // Ne tester que si la chaîne ressemble à du JSON complet
          if ((chunk.trim().startsWith('{') && chunk.trim().endsWith('}')) || 
              (chunk.trim().startsWith('[') && chunk.trim().endsWith(']'))) {
            JSON.parse(chunk);
            // C'est du JSON valide, laisser passer vers stdout
            return originalStdoutWrite!.apply(process.stdout, [chunk, encoding, callback]);
          } else {
            // Pas un JSON complet, rediriger vers stderr
            return (process.stderr as any).write(chunk, encoding, callback);
          }
        } catch (e) {
          // Erreur de parsing, rediriger vers stderr
          return (process.stderr as any).write(chunk, encoding, callback);
        }
      }
      
      // Pour les Buffers et autres types, essayer quand même d'intercepter le contenu
      try {
        const text = chunk.toString('utf8');
        if (text.includes('Creating') || !text.trim().startsWith('{') && !text.trim().startsWith('[')) {
          return (process.stderr as any).write(chunk, encoding, callback);
        }
      } catch (e) {
        // Ignorer les erreurs
      }
      
      // Pour tout autre cas, laisser passer vers stdout
      return originalStdoutWrite!.apply(process.stdout, [chunk, encoding, callback]);
    } catch (error) {
      // Si l'erreur est une erreur de pipe, la gérer silencieusement
      if (isPipeError(error)) {
        console.error("Connexion interrompue pendant l'écriture sur stdout (ignoré)");
        // Retourner true pour simuler le succès
        return true;
      }
      
      // Pour les autres erreurs, les relancer
      throw error;
    }
  };
  
  // Faire de même pour stderr pour éviter les erreurs EPIPE
  (process.stderr as any).write = function(chunk: string | Buffer, encoding?: string, callback?: Function) {
    try {
      return originalStderrWrite!.apply(process.stderr, [chunk, encoding, callback]);
    } catch (error) {
      // Si l'erreur est une erreur de pipe, la gérer silencieusement
      if (isPipeError(error)) {
        // Ne rien faire, juste simuler le succès
        return true;
      }
      
      // Pour les autres erreurs, les relancer
      throw error;
    }
  };
  
  isHooked = true;
  console.error('Stdout redirection installed');
}

/**
 * Enlève le hook global
 */
export function unhookStdout() {
  if (!isHooked) return;
  
  // Restaurer les fonctions d'écriture originales
  process.stdout.write = originalStdoutWrite as any;
  process.stderr.write = originalStderrWrite as any;
  
  originalStdoutWrite = null;
  originalStderrWrite = null;
  isHooked = false;
  console.error('Stdout redirection removed');
}

/**
 * Exécute une fonction asynchrone en redirigeant temporairement stdout vers stderr
 * @param fn La fonction à exécuter
 * @returns Le résultat de l'exécution de la fonction
 */
export async function withRedirectedStdout<T>(fn: () => Promise<T>): Promise<T> {
  // Nous utilisons déjà le hook global maintenant
  try {
    // Exécute la fonction
    return await fn();
  } catch (error) {
    // En cas d'erreur, la propager
    throw error;
  }
}
