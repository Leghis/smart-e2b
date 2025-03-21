import { Sandbox } from '@e2b/code-interpreter';
import { McpError } from "@modelcontextprotocol/sdk/types.js";
import { withRedirectedStdout } from '../utils/stdoutRedirect.js';
import { withPipeErrorHandling } from '../utils/errorHandling.js';

// MCP Error Codes (JSON-RPC 2.0 standard)
const ErrorCodes = {
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603,
  ServerError: -32000 // Erreur serveur générique
};

// Cache pour les sessions sandbox
const sandboxCache = new Map<string, { sandbox: Sandbox, lastUsed: number }>();

// Nettoyage périodique des sandbox inutilisées (après 30 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [id, { sandbox, lastUsed }] of sandboxCache.entries()) {
    if (now - lastUsed > 30 * 60 * 1000) {
      console.error(`Closing unused JavaScript sandbox ${id}`);
      try {
        // Dans la nouvelle version, on utilise kill() au lieu de destroy()
        sandbox.kill && sandbox.kill();
      } catch (err) {
        console.error("Error while closing sandbox:", err);
      }
      sandboxCache.delete(id);
    }
  }
}, 60 * 1000); // Vérifier toutes les minutes

/**
 * Exécute du code JavaScript dans un sandbox E2B
 */
export async function executeJavaScript(args: { code: string, timeout?: number, sandboxId?: string }) {
  const { code, timeout = 180000, sandboxId = 'default-js' } = args; // 3 minutes par défaut

  try {
    // Utiliser withPipeErrorHandling pour gérer les erreurs EPIPE
    return await withPipeErrorHandling(async () => {
      // Utiliser withRedirectedStdout pour éviter que les messages de débogage d'E2B 
      // n'interfèrent avec le protocole JSON-RPC
      return await withRedirectedStdout(async () => {
        // Récupérer ou créer un sandbox
        let sandboxEntry = sandboxCache.get(sandboxId);
        
        if (!sandboxEntry) {
          console.error(`Creating new JavaScript sandbox with ID: ${sandboxId}`);
          const sandbox = await Sandbox.create({ 
            apiKey: process.env.E2B_API_KEY,
            // Augmenter le délai d'expiration du sandbox à 1 heure
            timeoutMs: 60 * 60 * 1000 // 1 heure
          });
          
          sandboxEntry = { sandbox, lastUsed: Date.now() };
          sandboxCache.set(sandboxId, sandboxEntry);
        } else {
          sandboxEntry.lastUsed = Date.now();
          
          // Actualiser le délai d'expiration du sandbox
          if (sandboxEntry.sandbox.setTimeout) {
            await sandboxEntry.sandbox.setTimeout(60 * 60 * 1000); // 1 heure
          }
        }

        // Communiquer à l'utilisateur que nous exécutons son code avec un timeout
        console.error(`Exécution du code JavaScript avec un timeout de ${timeout/1000} secondes...`);

        // Créer une variable pour suivre si l'exécution a été interrompue
        let executionInterrupted = false;
        
        // Variable pour stocker le résultat
        let result;
        
        // Ajouter une surveillance pour interrompre l'exécution si elle prend trop de temps
        const timeoutId = setTimeout(() => {
          executionInterrupted = true;
          console.error(`Exécution interrompue après ${timeout/1000} secondes.`);
          
          // Ne pas tuer le sandbox, car cela pourrait causer des problèmes
          // avec les autres opérations en cours. À la place, on va juste retourner
          // un message d'erreur.
        }, timeout);
        
        try {
          // Exécuter le code
          result = await sandboxEntry.sandbox.runCode(code, { language: 'javascript' });
          
          // Annuler le timeout puisque nous avons terminé
          clearTimeout(timeoutId);
          
          // Si l'exécution a été interrompue, on retourne un message d'erreur
          if (executionInterrupted) {
            console.error("Arrêt de l'exécution après timeout");
            return {
              toolResult: {
                logs: {
                  stdout: [""],
                  stderr: [`Exécution interrompue après ${timeout/1000} secondes. Le code était trop long à exécuter.`]
                },
                error: `Timeout après ${timeout/1000} secondes d'exécution`
              }
            };
          }
          
          // Sinon, on retourne le résultat normal
          return { 
            toolResult: {
              logs: result.logs,
              error: result.error || null
            }
          };
        } catch (error) {
          // Annuler le timeout en cas d'erreur
          clearTimeout(timeoutId);
          
          // Si l'exécution a été interrompue, on retourne un message d'erreur
          if (executionInterrupted) {
            console.error("Arrêt de l'exécution après timeout");
            return {
              toolResult: {
                logs: {
                  stdout: [""],
                  stderr: [`Exécution interrompue après ${timeout/1000} secondes. Le code était trop long à exécuter.`]
                },
                error: `Timeout après ${timeout/1000} secondes d'exécution`
              }
            };
          }
          
          // Relancer l'erreur
          throw error;
        }
      });
    }, {
      toolResult: {
        logs: {
          stdout: [""],
          stderr: ["Connexion interrompue. Le client s'est déconnecté pendant l'exécution du code."]
        },
        error: "Connexion interrompue"
      }
    });
  } catch (error) {
    console.error("JavaScript execution error:", error);
    throw new McpError(
      ErrorCodes.InternalError,
      typeof error === "object" && error !== null && "message" in error
        ? String(error.message)
        : "Failed to execute JavaScript code"
    );
  }
}
