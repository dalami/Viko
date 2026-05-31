"use client";

import React, { useRef, useState } from "react";
import { createClient } from "../../lib/supabase";
import styles from "../dashboard/View.module.css";
import type { Emprendimiento } from "../../lib/types";
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

const SLOT_LABELS = ["Portada", "Producto", "Marca", "Packaging", "Promo"];

// ─── ImageSlot ────────────────────────────────────────────────────────────────
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

// ─── RubroSelector ────────────────────────────────────────────────────────────
function RubroSelector({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (rubros: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const allRubros = [...RUBROS, ...selected.filter((r) => !RUBROS.includes(r))];

  function toggle(r: string) {
    if (selected.includes(r)) onChange(selected.filter((x) => x !== r));
    else if (selected.length < 3) onChange([...selected, r]);
  }

  function addCustom() {
    const val = custom.trim();
    if (!val || selected.includes(val) || selected.length >= 3) return;
    onChange([...selected, val]);
    setCustom("");
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input-field"
        style={{
          width: "100%",
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#fff",
        }}
      >
        <span style={{ color: selected.length === 0 ? "#8A8680" : "#1A1814" }}>
          {selected.length === 0
            ? "Seleccioná categorías..."
            : selected.join(", ")}
        </span>
        <span
          style={{
            fontSize: 12,
            color: "#8A8680",
            transition: "transform 0.2s",
            display: "inline-block",
            transform: open ? "rotate(180deg)" : "none",
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <>
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              background: "#fff",
              border: "1.5px solid #E8E4DC",
              borderRadius: 12,
              zIndex: 100,
              maxHeight: 280,
              overflowY: "auto",
              boxShadow: "0 8px 24px rgba(26,24,20,0.12)",
            }}
          >
            {allRubros.map((r) => {
              const isSelected = selected.includes(r);
              const disabled = !isSelected && selected.length >= 3;
              return (
                <label
                  key={r}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 16px",
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.4 : 1,
                    borderBottom: "1px solid #F5F2EC",
                    background: isSelected ? "#F5F2EC" : "transparent",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={disabled}
                    onChange={() => toggle(r)}
                    style={{
                      accentColor: "#6B7A5A",
                      width: 16,
                      height: 16,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      color: "#1A1814",
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    {r}
                  </span>
                  {isSelected && (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 11,
                        color: "#6B7A5A",
                      }}
                    >
                      ✓
                    </span>
                  )}
                </label>
              );
            })}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                cursor: selected.length >= 3 ? "not-allowed" : "pointer",
                opacity: selected.length >= 3 ? 0.4 : 1,
                borderTop: "1px solid #E8E4DC",
              }}
            >
              <span style={{ fontSize: 13, color: "#6B7A5A", fontWeight: 600 }}>
                + Otro
              </span>
              <input
                type="text"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustom()}
                placeholder="Escribí una categoría..."
                onClick={(e) => e.stopPropagation()}
                disabled={selected.length >= 3}
                style={{
                  flex: 1,
                  padding: "5px 10px",
                  borderRadius: 8,
                  border: "1px solid #E8E4DC",
                  fontSize: 12,
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  addCustom();
                }}
                disabled={!custom.trim() || selected.length >= 3}
                style={{
                  padding: "5px 10px",
                  borderRadius: 8,
                  border: "none",
                  background: "#6B7A5A",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  opacity: !custom.trim() || selected.length >= 3 ? 0.4 : 1,
                  flexShrink: 0,
                }}
              >
                Agregar
              </button>
            </label>
            <div style={{ padding: "8px 16px", background: "#FAFAF7" }}>
              <p style={{ fontSize: 11, color: "#8A8680" }}>
                {selected.length}/3 seleccionadas
                {selected.length >= 3 && " — máximo alcanzado"}
              </p>
            </div>
          </div>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 99 }}
            onClick={() => setOpen(false)}
          />
        </>
      )}
    </div>
  );
}

// ─── ViewPerfil ───────────────────────────────────────────────────────────────
export default function ViewPerfil({
  emp,
  setEmp,
  userId,
  onUpgrade,
}: {
  emp: Emprendimiento;
  setEmp: React.Dispatch<React.SetStateAction<Emprendimiento>>;
  userId: string;
  onUpgrade?: () => void;
}) {
  const supabase = createClient();
  const [uploading, setUploading] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [heroUploading, setHeroUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const isPro = emp.plan === "premium";

  function update(field: keyof Emprendimiento, value: string | boolean) {
    setEmp((prev) => ({ ...prev, [field]: value }));
  }

  async function save(field: keyof Emprendimiento, value: string | boolean) {
    await supabase
      .from("emprendimientos")
      .update({ [field]: value })
      .eq("id", emp.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function updateMedioPago(
    field: keyof Emprendimiento,
    value: string | boolean,
  ) {
    setEmp((prev) => ({ ...prev, [field]: value }));
    const upd: Record<string, string | boolean> = { [field]: value };
    if (field === "transferencia_activa" && value === false) {
      upd.transferencia_cbu = "";
      setEmp((prev) => ({ ...prev, transferencia_cbu: "" }));
    }
    await supabase.from("emprendimientos").update(upd).eq("id", emp.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleHeroUpload(file: File) {
    setHeroUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${emp.id}/hero.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("Viko")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data } = supabase.storage.from("Viko").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      await supabase
        .from("emprendimientos")
        .update({ hero_imagen: publicUrl })
        .eq("id", emp.id);
      setEmp((prev) => ({ ...prev, hero_imagen: publicUrl }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setHeroUploading(false);
    }
  }

  async function handleRemoveHero() {
    await supabase
      .from("emprendimientos")
      .update({ hero_imagen: null })
      .eq("id", emp.id);
    setEmp((prev) => ({ ...prev, hero_imagen: undefined }));
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
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      const newImages = [...(emp.images ?? ["", "", "", "", ""])];
      newImages[index] = publicUrl;
      const { error: dbErr } = await supabase
        .from("emprendimientos")
        .update({ images: newImages })
        .eq("id", emp.id);
      if (dbErr) throw dbErr;
      setEmp((prev) => ({ ...prev, images: newImages }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
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
      {/* Toast autoguardado */}
      {saved && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "#1A1814",
            color: "#FAFAF7",
            padding: "10px 20px",
            borderRadius: 100,
            fontSize: 13,
            fontWeight: 600,
            zIndex: 999,
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          ✓ Guardado
        </div>
      )}

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
              onBlur={(e) => save("nombre", e.target.value)}
              placeholder="Nombre de tu marca"
              required
            />
          </div>
          <div className={styles.field}>
            <label className="field-label">Ubicación</label>
            <input
              className="input-field"
              value={emp.ubicacion || ""}
              onChange={(e) => update("ubicacion", e.target.value)}
              onBlur={(e) => save("ubicacion", e.target.value)}
              placeholder="Ciudad, Provincia"
              required
            />
          </div>
          <div className={styles.field}>
            <label className="field-label">Tagline</label>
            <input
              className="input-field"
              value={emp.tagline || ""}
              onChange={(e) => update("tagline", e.target.value)}
              onBlur={(e) => save("tagline", e.target.value)}
              placeholder="Una frase que defina tu marca"
            />
          </div>
          <div className={styles.field}>
            <label className="field-label">Categorías (hasta 3)</label>
            <RubroSelector
              selected={emp.rubros ?? (emp.rubro ? [emp.rubro] : [])}
              onChange={(rubros) => {
                setEmp((prev) => ({ ...prev, rubros }));
                supabase
                  .from("emprendimientos")
                  .update({ rubros })
                  .eq("id", emp.id)
                  .then(() => {
                    setSaved(true);
                    setTimeout(() => setSaved(false), 2000);
                  });
              }}
            />
            {(emp.rubros ?? []).length === 0 && (
              <p style={{ fontSize: 11, color: "#C4664A", marginTop: 6 }}>
                Seleccioná al menos una categoría
              </p>
            )}
          </div>
        </div>
        <div className={styles.field} style={{ marginTop: 16 }}>
          <label className="field-label">Descripción</label>
          <textarea
            className="input-field"
            value={emp.descripcion || ""}
            onChange={(e) => update("descripcion", e.target.value)}
            onBlur={(e) => save("descripcion", e.target.value)}
            placeholder="Contá de qué se trata tu emprendimiento..."
          />
        </div>
      </section>

      {/* ── BANNER DE TIENDA ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Banner de tienda</h3>
        <p className={styles.sectionSub}>
          Personalizá el banner principal que ven tus clientes al entrar a tu
          tienda.
        </p>

        <div className={styles.field} style={{ marginBottom: 20 }}>
          <label className="field-label">
            Título del banner{" "}
            <span style={{ fontSize: 11, color: "#8A8680", fontWeight: 400 }}>
              (opcional — si no ponés nada usa el nombre de tu marca)
            </span>
          </label>
          <input
            className="input-field"
            value={emp.hero_titulo || ""}
            onChange={(e) =>
              update("hero_titulo" as keyof Emprendimiento, e.target.value)
            }
            onBlur={async (e) => {
              await supabase
                .from("emprendimientos")
                .update({ hero_titulo: e.target.value || null })
                .eq("id", emp.id);
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }}
            placeholder={emp.nombre || "El título que aparece en el banner"}
          />
        </div>

        <div className={styles.field}>
          <label className="field-label">
            Imagen de fondo del banner{" "}
            <span style={{ fontSize: 11, color: "#8A8680", fontWeight: 400 }}>
              (recomendado: 1600 × 900 px)
            </span>
          </label>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <input
                id="hero-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleHeroUpload(file);
                  e.target.value = "";
                }}
              />
              <div
                onClick={() =>
                  !heroUploading &&
                  document.getElementById("hero-upload")?.click()
                }
                style={{
                  width: 200,
                  height: 112,
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "#F5F2EC",
                  border: emp.hero_imagen
                    ? "1.5px solid #C8D0BC"
                    : "1.5px dashed #C8D0BC",
                  cursor: "pointer",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {heroUploading ? (
                  <span style={{ fontSize: 12, color: "#8A8680" }}>
                    Subiendo...
                  </span>
                ) : emp.hero_imagen ? (
                  <Image
                    src={emp.hero_imagen}
                    alt="Hero"
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="200px"
                  />
                ) : (
                  <>
                    <span style={{ fontSize: 28 }}>🖼️</span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#8A8680",
                        textAlign: "center",
                        lineHeight: 1.4,
                      }}
                    >
                      Subir imagen
                      <br />
                      de banner
                    </span>
                  </>
                )}
              </div>
              {emp.hero_imagen && !heroUploading && (
                <button
                  onClick={handleRemoveHero}
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
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
            <div style={{ paddingTop: 4 }}>
              <p
                style={{
                  fontSize: 13,
                  color: "#1A1814",
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                Imagen de fondo
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "#8A8680",
                  lineHeight: 1.6,
                  marginBottom: 10,
                }}
              >
                Aparece como fondo del banner en tu tienda.
                <br />
                Si no subís una, se usa la primera foto de tu galería.
              </p>
              <p style={{ fontSize: 11, color: "#8A8680" }}>
                JPG, PNG o WEBP · Máx. 5MB
              </p>
            </div>
          </div>
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
            <p
              style={{
                fontSize: 11,
                color: "#888",
                marginTop: -8,
                marginBottom: 12,
              }}
            >
              Tamaño recomendado: 1200 × 675 px (horizontal 16:9)
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
            <p
              style={{
                fontSize: 11,
                color: "#888",
                marginTop: -8,
                marginBottom: 12,
              }}
            >
              Tamaño recomendado: 1200 × 675 px (horizontal 16:9)
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
                onClick={() => onUpgrade?.()}
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

      {/* ── CONTACTO Y REDES ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Contacto y redes</h3>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className="field-label">WhatsApp</label>
            <input
              className="input-field"
              value={emp.whatsapp || ""}
              onChange={(e) => update("whatsapp", e.target.value)}
              onBlur={(e) => save("whatsapp", e.target.value)}
              placeholder="5491100000000"
              required
            />
          </div>
          <div className={styles.field}>
            <label className="field-label">Instagram (sin @)</label>
            <input
              className="input-field"
              value={emp.instagram || ""}
              onChange={(e) => update("instagram", e.target.value)}
              onBlur={(e) => save("instagram", e.target.value)}
              placeholder="tuemprendimiento"
              required
            />
          </div>
          <div className={styles.field}>
            <label className="field-label">Email</label>
            <input
              className="input-field"
              type="email"
              value={emp.email || ""}
              onChange={(e) => update("email", e.target.value)}
              onBlur={(e) => save("email", e.target.value)}
              placeholder="hola@tuemprendimiento.com"
              required
            />
          </div>
          <div className={styles.field}>
            <label className="field-label">Sitio web</label>
            <input
              className="input-field"
              value={emp.web || ""}
              onChange={(e) => update("web", e.target.value)}
              onBlur={(e) => save("web", e.target.value)}
              placeholder="https://tuemprendimiento.com"
            />
          </div>
        </div>
      </section>

      {/* ── MEDIOS DE PAGO ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Medios de pago</h3>
        <p className={styles.sectionSub}>
          Elegí qué métodos de pago ofrecés a tus clientes.
        </p>

        <div className={styles.toggleRow}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>💳</span>
            <div>
              <span className={styles.toggleLabel}>MercadoPago</span>
              <p className={styles.toggleSub}>
                {emp.mp_connected
                  ? "✅ Cuenta conectada"
                  : "Vinculá tu cuenta para recibir pagos online"}
              </p>
            </div>
          </div>
          {!emp.mp_connected ? (
            <a
              href="/api/mp/connect"
              style={{
                background: "#009EE3",
                color: "#fff",
                border: "none",
                borderRadius: 100,
                padding: "8px 18px",
                fontFamily: "Syne, sans-serif",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              💳 Vincular MercadoPago
            </a>
          ) : (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#6B7A5A",
                background: "rgba(107,122,90,0.1)",
                padding: "6px 14px",
                borderRadius: 100,
              }}
            >
              Activo ✓
            </span>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div className={styles.toggleRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>🏦</span>
              <div>
                <span className={styles.toggleLabel}>
                  Transferencia bancaria
                </span>
                <p className={styles.toggleSub}>
                  CBU o Alias para transferencias
                </p>
              </div>
            </div>
            <button
              type="button"
              className={`${styles.toggle} ${emp.transferencia_activa ? styles.toggleOn : ""}`}
              onClick={() =>
                updateMedioPago(
                  "transferencia_activa",
                  !emp.transferencia_activa,
                )
              }
            />
          </div>
          {emp.transferencia_activa && (
            <div
              className={styles.field}
              style={{ marginTop: 8, marginLeft: 30 }}
            >
              <label className="field-label">CBU o Alias</label>
              <input
                className="input-field"
                value={emp.transferencia_cbu || ""}
                onChange={(e) => update("transferencia_cbu", e.target.value)}
                placeholder="Ej: mi.alias o 0000003100012345678901"
                maxLength={22}
                onBlur={(e) =>
                  updateMedioPago("transferencia_cbu", e.target.value)
                }
              />
            </div>
          )}
        </div>

        <div className={styles.toggleRow}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>💵</span>
            <div>
              <span className={styles.toggleLabel}>Efectivo</span>
              <p className={styles.toggleSub}>
                El cliente paga al recibir o retirar
              </p>
            </div>
          </div>
          <button
            type="button"
            className={`${styles.toggle} ${emp.efectivo_activo ? styles.toggleOn : ""}`}
            onClick={() =>
              updateMedioPago("efectivo_activo", !emp.efectivo_activo)
            }
          />
        </div>
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
            onClick={() => {
              const newVal = !emp.envios;
              update("envios", newVal);
              save("envios", newVal);
            }}
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
            onClick={() => {
              const newVal = !emp.visible;
              update("visible", newVal);
              save("visible", newVal);
            }}
          />
        </div>
      </section>
    </div>
  );
}
