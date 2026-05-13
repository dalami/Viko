"use client";

import React, { useRef, useState } from "react";
import { createClient } from "../../lib/supabase";
import styles from "../dashboard/View.module.css";
import { Emprendimiento } from "../../app/(dashboard)/dashboard/DashboardClient";
import Image from "next/image";

const RUBROS = [
  "Gastronomía",
  "Deco",
  "Regalos",
  "Moda",
  "Servicios",
  "Belleza",
  "Eventos",
  "Digital",
  "Masajes",
  "Sublimados",
  "Accesorios",
  "Velas",
  "Suplementos",
  "Aromas",
  "Macrame",
];

const SLOT_LABELS = ["Producto", "Lifestyle", "Branding", "Packaging", "Promo"];

function ProLock({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1A1814, #2D2B26)",
        borderRadius: 16,
        padding: "24px",
        textAlign: "center",
        border: "1px solid rgba(201,168,76,0.3)",
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
      <p
        style={{
          color: "#C9A84C",
          fontWeight: 700,
          fontSize: 14,
          marginBottom: 4,
        }}
      >
        Función exclusiva Viko Pro
      </p>
      <p
        style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: 12,
          marginBottom: 16,
          lineHeight: 1.5,
        }}
      >
        Activá tu plan para acceder a WhatsApp, Instagram y más.
      </p>
      <button
        onClick={onUpgrade}
        style={{
          background: "#C9A84C",
          border: "none",
          borderRadius: 100,
          padding: "10px 24px",
          fontFamily: "Syne, sans-serif",
          fontWeight: 700,
          fontSize: 13,
          color: "#1A1814",
          cursor: "pointer",
        }}
      >
        Activar Viko Pro — $9.900/mes
      </button>
    </div>
  );
}

function ImageSlot({
  index,
  label,
  images,
  uploading,
  onUpload,
  onRemove,
}: {
  index: number;
  label: string;
  images?: string[];
  uploading: number | null;
  onUpload: (index: number, file: File) => void;
  onRemove: (index: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imgUrl = images?.[index];
  const isUploading = uploading === index;
  return (
    <div style={{ position: "relative" }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(index, file);
          e.target.value = "";
        }}
      />
      <div
        className={`${styles.imgSlot} ${imgUrl ? styles.imgFilled : ""}`}
        onClick={() => !isUploading && inputRef.current?.click()}
      >
        {isUploading ? (
          <span style={{ fontSize: 11, color: "#6B7A5A" }}>Subiendo...</span>
        ) : imgUrl ? (
         
            <Image
              src={imgUrl}
              alt={label}
              fill
              style={{ objectFit: "cover" }}
              sizes="150px"
            />
          
        ) : (
          <>
            <span className={styles.imgPlus}>+</span>
            <span className={styles.imgLabel}>{label}</span>
          </>
        )}
      </div>
      {imgUrl && !isUploading && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(index);
          }}
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "rgba(26,24,20,0.7)",
            border: "none",
            color: "#FAFAF7",
            fontSize: 10,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default function ViewPerfil({
  emp,
  setEmp,
  userId,
}: {
  emp: Emprendimiento;
  setEmp: React.Dispatch<React.SetStateAction<Emprendimiento>>;
  userId: string;
}) {
  const supabase = createClient();
  const [uploading, setUploading] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isPro = emp.plan === "premium";

  function update(field: keyof Emprendimiento, value: string | boolean) {
    setEmp((prev) => ({ ...prev, [field]: value }));
  }

  async function handleUpgrade() {
    const res = await fetch("/api/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  async function handleImageUpload(index: number, file: File) {
    setUploading(index);
    setUploadError(null);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${emp.id}/img_${index}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("Viko")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data } = supabase.storage.from("Viko").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${new Date().getTime()}`;
      const newImages = [...(emp.images ?? ["", "", "", "", ""])];
      newImages[index] = publicUrl;
      const { error: dbErr } = await supabase
        .from("emprendimientos")
        .update({ images: newImages })
        .eq("id", emp.id);
      if (dbErr) throw dbErr;
      setEmp((prev) => ({ ...prev, images: newImages }));
    } catch (err: unknown) {
      setUploadError(
        err instanceof Error ? err.message : "Error al subir imagen",
      );
    } finally {
      setUploading(null);
    }
  }

  async function handleRemoveImage(index: number) {
    const currentImages = emp.images ?? [];
    if (!currentImages[index]) return;
    try {
      await supabase.storage
        .from("Viko")
        .remove([`${userId}/${emp.id}/img_${index}`]);
    } catch {
      /* ignorar */
    }
    const newImages = [...currentImages];
    newImages[index] = "";
    await supabase
      .from("emprendimientos")
      .update({ images: newImages })
      .eq("id", emp.id);
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
            <input
              className="input-field"
              value={emp.nombre || ""}
              onChange={(e) => update("nombre", e.target.value)}
              placeholder="Nombre de tu marca"
            />
          </div>
          <div className={styles.field}>
            <label className="field-label">Categoría</label>
            <select
              className="input-field"
              value={emp.rubro || ""}
              onChange={(e) => update("rubro", e.target.value)}
            >
              <option value="">Seleccioná</option>
              {RUBROS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className="field-label">Tagline</label>
            <input
              className="input-field"
              value={emp.tagline || ""}
              onChange={(e) => update("tagline", e.target.value)}
              placeholder="Una frase que defina tu marca"
            />
          </div>
          <div className={styles.field}>
            <label className="field-label">Ubicación</label>
            <input
              className="input-field"
              value={emp.ubicacion || ""}
              onChange={(e) => update("ubicacion", e.target.value)}
              placeholder="Ciudad, Provincia"
            />
          </div>
        </div>
        <div className={styles.field}>
          <label className="field-label">Descripción</label>
          <textarea
            className="input-field"
            value={emp.descripcion || ""}
            onChange={(e) => update("descripcion", e.target.value)}
            placeholder="Contá de qué se trata tu emprendimiento..."
          />
        </div>
      </section>

      {/* ── IMÁGENES ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Imágenes</h3>
        {uploadError && (
          <p style={{ color: "#C4664A", fontSize: 13, marginBottom: 12 }}>
            ⚠️ {uploadError}
          </p>
        )}
        {isPro ? (
          <>
            <p className={styles.sectionSub}>
              Hasta 5 fotos. Hacé clic en cada slot para subir.
            </p>
            <div className={styles.imageGrid}>
              {SLOT_LABELS.map((label, i) => (
                <ImageSlot
                  key={label}
                  index={i}
                  label={label}
                  images={emp.images}
                  uploading={uploading}
                  onUpload={handleImageUpload}
                  onRemove={handleRemoveImage}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <p className={styles.sectionSub}>
              Con el plan básico podés subir 1 foto. Activá Pro para subir hasta
              5.
            </p>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 120 }}>
                <ImageSlot
                  index={0}
                  label="Foto"
                  images={emp.images}
                  uploading={uploading}
                  onUpload={handleImageUpload}
                  onRemove={handleRemoveImage}
                />
              </div>
              <button
                onClick={handleUpgrade}
                style={{
                  marginTop: 8,
                  background: "#C9A84C",
                  border: "none",
                  borderRadius: 100,
                  padding: "8px 18px",
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 700,
                  fontSize: 12,
                  color: "#1A1814",
                  cursor: "pointer",
                }}
              >
                ⚡ Subir 5 fotos con Pro
              </button>
            </div>
          </>
        )}
      </section>

      {/* ── CONTACTO Y REDES (solo Pro) ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Contacto y redes</h3>
        {isPro ? (
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className="field-label">WhatsApp</label>
              <input
                className="input-field"
                value={emp.whatsapp || ""}
                onChange={(e) => update("whatsapp", e.target.value)}
                placeholder="5491100000000"
              />
            </div>
            <div className={styles.field}>
              <label className="field-label">Instagram (sin @)</label>
              <input
                className="input-field"
                value={emp.instagram || ""}
                onChange={(e) => update("instagram", e.target.value)}
                placeholder="tuemprendimiento"
              />
            </div>
            <div className={styles.field}>
              <label className="field-label">Email</label>
              <input
                className="input-field"
                type="email"
                value={emp.email || ""}
                onChange={(e) => update("email", e.target.value)}
                placeholder="hola@tuemprendimiento.com"
              />
            </div>
            <div className={styles.field}>
              <label className="field-label">Sitio web</label>
              <input
                className="input-field"
                value={emp.web || ""}
                onChange={(e) => update("web", e.target.value)}
                placeholder="https://tuemprendimiento.com"
              />
            </div>
          </div>
        ) : (
          <ProLock onUpgrade={handleUpgrade} />
        )}
      </section>

      {/* ── OPCIONES ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Opciones</h3>
        <div className={styles.toggleRow}>
          <div>
            <span className={styles.toggleLabel}>Envíos a todo el país</span>
            <p className={styles.toggleSub}>
              Se muestra en tu ficha del directorio
            </p>
          </div>
          <button
            type="button"
            className={`${styles.toggle} ${emp.envios ? styles.toggleOn : ""}`}
            onClick={() => update("envios", !emp.envios)}
          />
        </div>
        <div className={styles.toggleRow}>
          <div>
            <span className={styles.toggleLabel}>Visible en el directorio</span>
            <p className={styles.toggleSub}>
              Si está apagado, tu perfil queda oculto
            </p>
          </div>
          <button
            type="button"
            className={`${styles.toggle} ${emp.visible ? styles.toggleOn : ""}`}
            onClick={() => update("visible", !emp.visible)}
          />
        </div>
      </section>
    </div>
  );
}
