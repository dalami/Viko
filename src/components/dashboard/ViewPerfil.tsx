"use client";

import React, { useRef, useState } from "react";
import { createClient } from "../../lib/supabase";
import styles from "../dashboard/View.module.css";
import type { Emprendimiento } from "../../lib/types";
import Image from "next/image";

const RUBROS = [
  "Gastronomía", "Deco", "Regalos", "Moda", "Servicios",
  "Belleza", "Eventos", "Digital", "Masajes", "Sublimados",
  "Accesorios", "Velas", "Suplementos", "Aromas", "Macrame",
];

const SLOT_LABELS = ["Producto", "Lifestyle", "Branding", "Packaging", "Promo"];

function ImageSlot({
  index, label, images, uploading, onUpload, onRemove,
}: {
  index: number; label: string; images?: string[];
  uploading: number | null;
  onUpload: (index: number, file: File) => void;
  onRemove: (index: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imgUrl = images?.[index];
  const isUploading = uploading === index;

  return (
    <div style={{ position: "relative" }}>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={(e) => { const file = e.target.files?.[0]; if (file) onUpload(index, file); e.target.value = ""; }}
      />
      <div className={`${styles.imgSlot} ${imgUrl ? styles.imgFilled : ""}`}
        onClick={() => !isUploading && inputRef.current?.click()}>
        {isUploading ? (
          <span style={{ fontSize: 11, color: "#6B7A5A" }}>Subiendo...</span>
        ) : imgUrl ? (
          <Image src={imgUrl} alt={label} fill style={{ objectFit: "cover" }} sizes="150px" />
        ) : (
          <><span className={styles.imgPlus}>+</span><span className={styles.imgLabel}>{label}</span></>
        )}
      </div>
      {imgUrl && !isUploading && (
        <button onClick={(e) => { e.stopPropagation(); onRemove(index); }}
          style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "rgba(26,24,20,0.7)", border: "none", color: "#FAFAF7", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          ✕
        </button>
      )}
    </div>
  );
}

export default function ViewPerfil({
  emp, setEmp, userId, onUpgrade,
}: {
  emp: Emprendimiento;
  setEmp: React.Dispatch<React.SetStateAction<Emprendimiento>>;
  userId: string;
  onUpgrade?: () => void;
}) {
  const supabase = createClient();
  const [uploading, setUploading] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const isPro = emp.plan === "premium";

  function update(field: keyof Emprendimiento, value: string | boolean) {
    setEmp((prev) => ({ ...prev, [field]: value }));
  }

  async function updateMedioPago(field: keyof Emprendimiento, value: string | boolean) {
    setEmp((prev) => ({ ...prev, [field]: value }));
    const upd: Record<string, string | boolean> = { [field]: value };
    if (field === "transferencia_activa" && value === false) {
      upd.transferencia_cbu = "";
      setEmp((prev) => ({ ...prev, transferencia_cbu: "" }));
    }
    await supabase.from("emprendimientos").update(upd).eq("id", emp.id);
  }

  async function handleImageUpload(index: number, file: File) {
    setUploading(index);
    setUploadError(null);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${emp.id}/img_${index}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("Viko").upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data } = supabase.storage.from("Viko").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      const newImages = [...(emp.images ?? ["", "", "", "", ""])];
      newImages[index] = publicUrl;
      const { error: dbErr } = await supabase.from("emprendimientos").update({ images: newImages }).eq("id", emp.id);
      if (dbErr) throw dbErr;
      setEmp((prev) => ({ ...prev, images: newImages }));
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Error al subir imagen");
    } finally {
      setUploading(null);
    }
  }

  async function handleRemoveImage(index: number) {
    const currentImages = emp.images ?? [];
    if (!currentImages[index]) return;
    try { await supabase.storage.from("Viko").remove([`${userId}/${emp.id}/img_${index}`]); } catch { /* ignorar */ }
    const newImages = [...currentImages];
    newImages[index] = "";
    await supabase.from("emprendimientos").update({ images: newImages }).eq("id", emp.id);
    setEmp((prev) => ({ ...prev, images: newImages }));
  }

  return (
    <div className={styles.view}>

      {/* ── INFORMACIÓN BÁSICA ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Información del emprendimiento</h3>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className="field-label">Nombre</label>
            <input className="input-field" value={emp.nombre || ""} onChange={(e) => update("nombre", e.target.value)} placeholder="Nombre de tu marca" />
          </div>
          <div className={styles.field}>
            <label className="field-label">Categoría</label>
            <select className="input-field" value={emp.rubro || ""} onChange={(e) => update("rubro", e.target.value)}>
              <option value="">Seleccioná</option>
              {RUBROS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className="field-label">Tagline</label>
            <input className="input-field" value={emp.tagline || ""} onChange={(e) => update("tagline", e.target.value)} placeholder="Una frase que defina tu marca" />
          </div>
          <div className={styles.field}>
            <label className="field-label">Ubicación</label>
            <input className="input-field" value={emp.ubicacion || ""} onChange={(e) => update("ubicacion", e.target.value)} placeholder="Ciudad, Provincia" />
          </div>
        </div>
        <div className={styles.field}>
          <label className="field-label">Descripción</label>
          <textarea className="input-field" value={emp.descripcion || ""} onChange={(e) => update("descripcion", e.target.value)} placeholder="Contá de qué se trata tu emprendimiento..." />
        </div>
      </section>

      {/* ── IMÁGENES ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Imágenes</h3>
        {uploadError && <p style={{ color: "#C4664A", fontSize: 13, marginBottom: 12 }}>⚠️ {uploadError}</p>}
        {isPro ? (
          <>
            <p className={styles.sectionSub}>Hasta 5 fotos. Hacé clic en cada slot para subir.</p>
            <div className={styles.imageGrid}>
              {SLOT_LABELS.map((label, i) => (
                <ImageSlot key={label} index={i} label={label} images={emp.images}
                  uploading={uploading} onUpload={handleImageUpload} onRemove={handleRemoveImage} />
              ))}
            </div>
          </>
        ) : (
          <>
            <p className={styles.sectionSub}>Con el plan básico podés subir 1 foto. Activá Pro para subir hasta 5.</p>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 120 }}>
                <ImageSlot index={0} label="Foto" images={emp.images}
                  uploading={uploading} onUpload={handleImageUpload} onRemove={handleRemoveImage} />
              </div>
              <button onClick={() => onUpgrade?.()} style={{
                marginTop: 8, background: "#C9A84C", border: "none", borderRadius: 100,
                padding: "8px 18px", fontFamily: "Syne, sans-serif",
                fontWeight: 700, fontSize: 12, color: "#1A1814", cursor: "pointer",
              }}>
                ⚡ Subir 5 fotos con Pro
              </button>
            </div>
          </>
        )}
      </section>

      {/* ── CONTACTO Y REDES ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Contacto y redes</h3>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className="field-label">WhatsApp</label>
            <input className="input-field" value={emp.whatsapp || ""} onChange={(e) => update("whatsapp", e.target.value)} placeholder="5491100000000" />
          </div>
          <div className={styles.field}>
            <label className="field-label">Instagram (sin @)</label>
            <input className="input-field" value={emp.instagram || ""} onChange={(e) => update("instagram", e.target.value)} placeholder="tuemprendimiento" />
          </div>
          <div className={styles.field}>
            <label className="field-label">Email</label>
            <input className="input-field" type="email" value={emp.email || ""} onChange={(e) => update("email", e.target.value)} placeholder="hola@tuemprendimiento.com" />
          </div>
          <div className={styles.field}>
            <label className="field-label">Sitio web</label>
            <input className="input-field" value={emp.web || ""} onChange={(e) => update("web", e.target.value)} placeholder="https://tuemprendimiento.com" />
          </div>
        </div>
      </section>

      {/* ── MEDIOS DE PAGO ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Medios de pago</h3>
        <p className={styles.sectionSub}>Elegí qué métodos de pago ofrecés a tus clientes.</p>

        {/* MercadoPago */}
        <div className={styles.toggleRow}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>💳</span>
            <div>
              <span className={styles.toggleLabel}>MercadoPago</span>
              <p className={styles.toggleSub}>
                {emp.mp_connected ? "✅ Cuenta conectada" : "Conectá tu cuenta para recibir pagos online"}
              </p>
            </div>
          </div>
          {!emp.mp_connected ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input className="input-field" placeholder="Pegá tu Access Token de MercadoPago"
                onBlur={async (e) => {
                  if (!e.target.value) return;
                  await updateMedioPago("mp_access_token", e.target.value);
                  await updateMedioPago("mp_connected", true);
                }}
              />
              <p style={{ fontSize: 11, color: "#8A8680" }}>
                Encontralo en mercadopago.com/developers → Tu app → Credenciales de producción
              </p>
            </div>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 700, color: "#6B7A5A", background: "rgba(107,122,90,0.1)", padding: "6px 14px", borderRadius: 100 }}>
              Activo ✓
            </span>
          )}
        </div>

        {/* Transferencia */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div className={styles.toggleRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>🏦</span>
              <div>
                <span className={styles.toggleLabel}>Transferencia bancaria</span>
                <p className={styles.toggleSub}>CBU o Alias para transferencias</p>
              </div>
            </div>
            <button type="button"
              className={`${styles.toggle} ${emp.transferencia_activa ? styles.toggleOn : ""}`}
              onClick={() => updateMedioPago("transferencia_activa", !emp.transferencia_activa)} />
          </div>
          {emp.transferencia_activa && (
            <div className={styles.field} style={{ marginTop: 8, marginLeft: 30 }}>
              <label className="field-label">CBU o Alias</label>
              <input className="input-field" value={emp.transferencia_cbu || ""}
                onChange={(e) => update("transferencia_cbu", e.target.value)}
                placeholder="Ej: mi.alias o 0000003100012345678901" maxLength={22}
                onBlur={(e) => updateMedioPago("transferencia_cbu", e.target.value)} />
            </div>
          )}
        </div>

        {/* Efectivo */}
        <div className={styles.toggleRow}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>💵</span>
            <div>
              <span className={styles.toggleLabel}>Efectivo</span>
              <p className={styles.toggleSub}>El cliente paga al recibir o retirar</p>
            </div>
          </div>
          <button type="button"
            className={`${styles.toggle} ${emp.efectivo_activo ? styles.toggleOn : ""}`}
            onClick={() => updateMedioPago("efectivo_activo", !emp.efectivo_activo)} />
        </div>
      </section>

      {/* ── OPCIONES ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Opciones</h3>
        <div className={styles.toggleRow}>
          <div>
            <span className={styles.toggleLabel}>Envíos a todo el país</span>
            <p className={styles.toggleSub}>Se muestra en tu ficha del directorio</p>
          </div>
          <button type="button"
            className={`${styles.toggle} ${emp.envios ? styles.toggleOn : ""}`}
            onClick={() => update("envios", !emp.envios)} />
        </div>
        <div className={styles.toggleRow}>
          <div>
            <span className={styles.toggleLabel}>Visible en el directorio</span>
            <p className={styles.toggleSub}>Si está apagado, tu perfil queda oculto</p>
          </div>
          <button type="button"
            className={`${styles.toggle} ${emp.visible ? styles.toggleOn : ""}`}
            onClick={() => update("visible", !emp.visible)} />
        </div>
      </section>
    </div>
  );
}