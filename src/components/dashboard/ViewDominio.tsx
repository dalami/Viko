"use client";

/**
 * ViewDominio.tsx
 * Módulo nuevo — no modifica código existente.
 *
 * Panel de gestión de dominio propio para emprendedores Pro.
 * Permite ingresar su dominio, ver las instrucciones DNS y verificar.
 */

import { useState } from "react";
import styles from "./ViewDominio.module.css";
import type { Emprendimiento } from "../../lib/types";

interface Props {
  emp: Emprendimiento;
  isPro: boolean;
  onUpgrade?: () => void;
}

type Step = "idle" | "saving" | "saved" | "verifying" | "verified" | "error";

const CNAME_TARGET = "cname.vercel-dns.com";
const VIKO_HOST = "viko.com.ar";

export default function ViewDominio({ emp, isPro, onUpgrade }: Props) {
  const savedDomain =
    (
      emp as Emprendimiento & {
        custom_domain?: string;
        domain_verified?: boolean;
      }
    ).custom_domain ?? "";
  const isVerified =
    (
      emp as Emprendimiento & {
        custom_domain?: string;
        domain_verified?: boolean;
      }
    ).domain_verified ?? false;

  const [domain, setDomain] = useState(savedDomain);
  const [step, setStep] = useState<Step>(
    isVerified ? "verified" : savedDomain ? "saved" : "idle",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<"cname" | "target" | null>(null);

  function copyText(text: string, key: "cname" | "target") {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleSave() {
    if (!domain.trim()) return;
    setStep("saving");
    setMessage(null);

    const res = await fetch("/api/domain/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
    });
    const data = await res.json();

    if (data.ok) {
      setStep("saved");
      setMessage(data.warning ?? null);
    } else {
      setStep("error");
      setMessage(data.error ?? "Error al guardar el dominio.");
    }
  }

  async function handleVerify() {
    setStep("verifying");
    setMessage(null);

    const res = await fetch("/api/domain/verify", { method: "POST" });
    const data = await res.json();

    if (data.verified) {
      setStep("verified");
    } else {
      setStep("saved"); // volvemos a "guardado pero no verificado"
    }
    setMessage(data.message ?? null);
  }

  function handleReset() {
    setDomain("");
    setStep("idle");
    setMessage(null);
  }

  /* ─── Paywall si no es Pro ─── */
  if (!isPro) {
    return (
      <div className={styles.view}>
        <div className={styles.paywall}>
          <div className={styles.paywallIcon}>🌐</div>
          <h3 className={styles.paywallTitle}>Dominio Propio</h3>
          <p className={styles.paywallSub}>
            Conectá <strong>tutienda.com</strong> a tu emprendimiento.
            <br />
            Disponible en el plan <strong>Viko Pro</strong>.
          </p>
          <button className={styles.paywallBtn} onClick={() => onUpgrade?.()}>
            ⚡ Ver planes Pro
          </button>
        </div>
      </div>
    );
  }

  /* ─── Vista Pro ─── */
  return (
    <div className={styles.view}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Dominio Propio</h2>
        <p className={styles.sub}>
          Conectá tu dominio personalizado para que tu tienda sea accesible
          desde <strong>tudominio.com</strong> en lugar de{" "}
          <span className={styles.mono}>{VIKO_HOST}/emprendimiento/…</span>
        </p>
      </div>

      {/* Estado actual */}
      {step === "verified" && (
        <div className={`${styles.alert} ${styles.alertSuccess}`}>
          <span className={styles.alertIcon}>✅</span>
          <div>
            <strong>Dominio activo</strong>
            <p>
              Tu tienda es accesible desde{" "}
              <a
                href={`https://${savedDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.domainLink}
              >
                {savedDomain}
              </a>
            </p>
          </div>
          <button className={styles.resetBtn} onClick={handleReset}>
            Cambiar dominio
          </button>
        </div>
      )}

      {/* ─── Paso 1: Ingresar dominio ─── */}
      <section className={styles.section}>
        <div className={styles.stepBadge}>Paso 1</div>
        <h3 className={styles.sectionTitle}>Ingresá tu dominio</h3>
        <p className={styles.sectionSub}>
          Solo el dominio, sin <code>https://</code> ni barras. Ejemplo:{" "}
          <code>mitienda.com</code> o <code>tienda.midominio.com.ar</code>
        </p>

        <div className={styles.inputRow}>
          <input
            type="text"
            className={styles.domainInput}
            placeholder="mitienda.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value.toLowerCase().trim())}
            disabled={step === "saving" || step === "verified"}
          />
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={
              !domain.trim() ||
              step === "saving" ||
              step === "saved" ||
              step === "verifying" ||
              step === "verified"
            }
          >
            {step === "saving" ? "Guardando…" : "Guardar"}
          </button>
        </div>

        {step === "error" && message && (
          <p className={styles.errorMsg}>{message}</p>
        )}
        {step === "saved" && message && (
          <p className={styles.warningMsg}>{message}</p>
        )}
      </section>

      {/* ─── Paso 2: Configurar DNS (solo si ya guardó) ─── */}
      {(step === "saved" || step === "verifying" || step === "verified") && (
        <section className={styles.section}>
          <div className={styles.stepBadge}>Paso 2</div>
          <h3 className={styles.sectionTitle}>
            Configurá el DNS de tu dominio
          </h3>
          <p className={styles.sectionSub}>
            En el panel de tu registrador de dominios (NIC.ar, GoDaddy,
            Namecheap, etc.) agregá el siguiente registro:
          </p>

          <div className={styles.dnsTable}>
            {/* Header */}
            <div className={styles.dnsRow + " " + styles.dnsHeader}>
              <span>Tipo</span>
              <span>Nombre / Host</span>
              <span>Valor / Apunta a</span>
              <span></span>
            </div>

            {/* Fila CNAME */}
            <div className={styles.dnsRow}>
              <span className={styles.dnsBadge}>CNAME</span>
              <span className={styles.mono}>
                {domain.includes(".") && domain.split(".").length > 2
                  ? domain.split(".")[0] // subdominio
                  : "@"}
              </span>
              <span className={styles.mono}>{CNAME_TARGET}</span>
              <button
                className={styles.copyBtn}
                onClick={() => copyText(CNAME_TARGET, "target")}
              >
                {copied === "target" ? "✓ Copiado" : "Copiar"}
              </button>
            </div>
          </div>

          <div className={styles.dnsNote}>
            <span className={styles.dnsNoteIcon}>ℹ️</span>
            <span>
              Si tu registrador no acepta <code>@</code> como host para un
              CNAME, usá el nombre de dominio completo. La propagación DNS puede
              tardar hasta <strong>48 horas</strong>.
            </span>
          </div>
        </section>
      )}

      {/* ─── Paso 3: Verificar ─── */}
      {(step === "saved" || step === "verifying") && (
        <section className={styles.section}>
          <div className={styles.stepBadge}>Paso 3</div>
          <h3 className={styles.sectionTitle}>Verificá la conexión</h3>
          <p className={styles.sectionSub}>
            Una vez que configuraste el DNS, hacé clic en Verificar. Si la
            propagación todavía no terminó, volvé a intentarlo en unas horas.
          </p>

          <button
            className={styles.verifyBtn}
            onClick={handleVerify}
            disabled={step === "verifying"}
          >
            {step === "verifying" ? (
              <>
                <span className={styles.spinner} /> Verificando…
              </>
            ) : (
              "🔍 Verificar dominio"
            )}
          </button>

          {step === "saved" && message && (
            <p className={styles.infoMsg}>{message}</p>
          )}
        </section>
      )}

      {/* ─── FAQ / Ayuda ─── */}
      <section className={`${styles.section} ${styles.sectionFaq}`}>
        <h3 className={styles.sectionTitle}>Preguntas frecuentes</h3>

        <div className={styles.faqList}>
          <details className={styles.faqItem}>
            <summary className={styles.faqQ}>
              ¿Qué registrador de dominios puedo usar?
            </summary>
            <p className={styles.faqA}>
              Cualquiera: NIC.ar, GoDaddy, Namecheap, IONOS, etc. Solo necesitás
              acceso al panel de DNS para agregar el registro CNAME.
            </p>
          </details>

          <details className={styles.faqItem}>
            <summary className={styles.faqQ}>
              ¿El SSL (candado verde) se configura solo?
            </summary>
            <p className={styles.faqA}>
              Sí. Una vez que el CNAME propaga correctamente, el certificado
              HTTPS se provisiona automáticamente en minutos. No necesitás hacer
              nada más.
            </p>
          </details>

          <details className={styles.faqItem}>
            <summary className={styles.faqQ}>
              ¿Puedo usar un subdominio como <code>tienda.midominio.com</code>?
            </summary>
            <p className={styles.faqA}>
              Sí. Ingresá el subdominio completo y configurá el CNAME con el
              nombre del subdominio (ej: <code>tienda</code>) apuntando a{" "}
              <code>{CNAME_TARGET}</code>.
            </p>
          </details>

          <details className={styles.faqItem}>
            <summary className={styles.faqQ}>
              ¿Puedo cambiar el dominio después?
            </summary>
            <p className={styles.faqA}>
              Sí. Hacé clic en &quot;Cambiar dominio&quot; para ingresar uno
              nuevo. El dominio anterior dejará de funcionar.
            </p>
          </details>
        </div>
      </section>
    </div>
  );
}
