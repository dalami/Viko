"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";
import styles from "../dashboard/View.module.css";
import type { Emprendimiento } from "../../lib/types";

interface DayStat {
  day: string;
  count: number;
}
interface MetricData {
  thisWeek: number;
  lastWeek: number;
  today: number;
  total: number;
  clicksWa: number;
  clicksIg: number;
  byDay: DayStat[];
}

function pct(a: number, b: number) {
  if (b === 0) return a > 0 ? "+100%" : "0%";
  const diff = ((a - b) / b) * 100;
  return `${diff >= 0 ? "+" : ""}${diff.toFixed(0)}%`;
}

function isUp(a: number, b: number) {
  return a >= b;
}

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function calcPerfil(emp: Emprendimiento, isPro: boolean) {
  const fotos = (emp.images ?? []).filter(Boolean).length;

  if (!isPro) {
    let score = 0;
    const items = [];
    if (emp.rubro) {
      score += 10;
    } else items.push({ msg: "Agregá tu categoría", pts: 10 });
    if (emp.tagline) {
      score += 15;
    } else items.push({ msg: "Escribí un tagline", pts: 15 });
    if (emp.descripcion) {
      score += 20;
    } else items.push({ msg: "Completá tu descripción", pts: 20 });
    if (emp.ubicacion) {
      score += 10;
    } else items.push({ msg: "Agregá tu ubicación", pts: 10 });
    if (fotos > 0) {
      score += 5;
    } else items.push({ msg: "Subí al menos 1 foto", pts: 5 });
    return { score, max: 60, items, proMsg: "Activá Pro para llegar al 100%" };
  }

  let score = 0;
  const items = [];
  if (emp.rubro) {
    score += 10;
  } else items.push({ msg: "Agregá tu categoría", pts: 10 });
  if (emp.tagline) {
    score += 15;
  } else items.push({ msg: "Escribí un tagline", pts: 15 });
  if (emp.descripcion) {
    score += 20;
  } else items.push({ msg: "Completá tu descripción", pts: 20 });
  if (emp.ubicacion) {
    score += 10;
  } else items.push({ msg: "Agregá tu ubicación", pts: 10 });

  const fotoBase = Math.min(fotos, 1) * 4;
  const fotosExtra = Math.min(Math.max(fotos - 1, 0), 4) * 4;
  score += fotoBase + fotosExtra;
  if (fotos === 0) items.push({ msg: "Subí al menos 1 foto (+4%)", pts: 4 });
  else if (fotos < 5)
    items.push({
      msg: `Subí ${5 - fotos} foto${5 - fotos > 1 ? "s" : ""} más (+${(5 - fotos) * 4}%)`,
      pts: (5 - fotos) * 4,
    });

  if (emp.whatsapp) {
    score += 12;
  } else items.push({ msg: "Agregá tu WhatsApp", pts: 12 });
  if (emp.instagram) {
    score += 8;
  } else items.push({ msg: "Agregá tu Instagram", pts: 8 });

  return { score, max: 100, items, proMsg: null };
}

function ProLock({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1A1814, #2D2B26)",
        borderRadius: 16,
        padding: "32px 24px",
        textAlign: "center",
        border: "1px solid rgba(201,168,76,0.3)",
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 10 }}>📊</div>
      <p
        style={{
          color: "#C9A84C",
          fontWeight: 700,
          fontSize: 15,
          marginBottom: 6,
        }}
      >
        Métricas — Viko Pro
      </p>
      <p
        style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: 13,
          marginBottom: 20,
          lineHeight: 1.6,
        }}
      >
        Conocé cuántas personas visitan tu ficha, hacen clic en WhatsApp e
        Instagram cada semana.
      </p>
      <button
        onClick={onUpgrade}
        style={{
          background: "#C9A84C",
          border: "none",
          borderRadius: 100,
          padding: "11px 28px",
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

export default function ViewMetricas({
  empId,
  isPro,
  emp,
  onUpgrade,
}: {
  empId: number;
  isPro: boolean;
  emp: Emprendimiento;
  onUpgrade?: () => void;
}) {
  const [data, setData] = useState<MetricData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPro) return;

    async function load() {
      const supabase = createClient();
      const now = new Date();
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      const startOfThisWeek = new Date(now);
      startOfThisWeek.setDate(now.getDate() - 6);
      startOfThisWeek.setHours(0, 0, 0, 0);
      const startOfLastWeek = new Date(startOfThisWeek);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

      const { data: visitas } = await supabase
        .from("visitas")
        .select("created_at, source, type")
        .eq("emprendimiento_id", empId)
        .gte("created_at", startOfLastWeek.toISOString())
        .order("created_at", { ascending: true });

      if (!visitas) {
        setLoading(false);
        return;
      }

      const thisWeekStart = startOfThisWeek.getTime();
      const lastWeekStart = startOfLastWeek.getTime();
      const todayStart = startOfToday.getTime();

      let thisWeek = 0,
        lastWeek = 0,
        today = 0,
        clicksWa = 0,
        clicksIg = 0;
      const dayCounts: Record<string, number> = {};

      visitas.forEach((v) => {
        const t = new Date(v.created_at).getTime();
        if (t >= thisWeekStart) {
          if (v.type === "pageview") {
            thisWeek++;
            const label = DAY_LABELS[new Date(v.created_at).getDay()];
            dayCounts[label] = (dayCounts[label] || 0) + 1;
          }
          if (v.type === "click" && v.source === "whatsapp") clicksWa++;
          if (v.type === "click" && v.source === "instagram") clicksIg++;
        } else if (t >= lastWeekStart && v.type === "pageview") lastWeek++;
        if (t >= todayStart && v.type === "pageview") today++;
      });

      const byDay: DayStat[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const label = DAY_LABELS[d.getDay()];
        byDay.push({ day: label, count: dayCounts[label] || 0 });
      }

      const { count: total } = await supabase
        .from("visitas")
        .select("*", { count: "exact", head: true })
        .eq("emprendimiento_id", empId)
        .eq("type", "pageview");

      setData({
        thisWeek,
        lastWeek,
        today,
        total: total ?? 0,
        clicksWa,
        clicksIg,
        byDay,
      });
      setLoading(false);
    }

    load();
  }, [empId, isPro]);

  const perfil = calcPerfil(emp, isPro);
  const barColor =
    perfil.score >= 80 ? "#6B7A5A" : perfil.score >= 50 ? "#C9A84C" : "#C4664A";

  const PerfilSection = (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>Perfil completado</h3>
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 13, color: "#7A756A" }}>
            {perfil.score}% de {perfil.max}%
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: barColor }}>
            {perfil.score >= perfil.max
              ? "✅ Completo"
              : `Faltan ${perfil.max - perfil.score}%`}
          </span>
        </div>
        <div
          style={{
            height: 8,
            background: "#EDE8DC",
            borderRadius: 100,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 100,
              background: barColor,
              width: `${(perfil.score / perfil.max) * 100}%`,
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </div>

      {perfil.items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {perfil.items.map((item) => (
            <div
              key={item.msg}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: "#F5F0E8",
                borderRadius: 10,
                border: "1px solid rgba(26,24,20,0.08)",
              }}
            >
              <span style={{ fontSize: 13, color: "#1A1814" }}>
                ⚠️ {item.msg}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7A5A" }}>
                +{item.pts}%
              </span>
            </div>
          ))}
        </div>
      )}

      {perfil.proMsg && (
        <div
          style={{
            marginTop: 12,
            padding: "12px 16px",
            background: "rgba(201,168,76,0.08)",
            borderRadius: 10,
            border: "1px solid rgba(201,168,76,0.25)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 13, color: "#C9A84C", fontWeight: 600 }}>
            ⚡ {perfil.proMsg}
          </span>
          <button
            onClick={() => onUpgrade?.()}
            style={{
              background: "#C9A84C",
              border: "none",
              borderRadius: 100,
              padding: "6px 14px",
              fontFamily: "Syne, sans-serif",
              fontWeight: 700,
              fontSize: 11,
              color: "#1A1814",
              cursor: "pointer",
            }}
          >
            Activar Pro
          </button>
        </div>
      )}
    </section>
  );

  if (!isPro) {
    return (
      <div className={styles.view}>
        {PerfilSection}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Métricas de visitas</h3>
          <ProLock onUpgrade={() => onUpgrade?.()} />
        </section>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.view}>
        {PerfilSection}
        <div
          className={styles.section}
          style={{ textAlign: "center", padding: 48 }}
        >
          <p style={{ color: "#7A756A", fontSize: 14 }}>Cargando métricas...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const maxDay = Math.max(...data.byDay.map((d) => d.count), 1);
  const stats = [
    {
      label: "Visitas esta semana",
      value: data.thisWeek.toString(),
      delta: pct(data.thisWeek, data.lastWeek),
      up: isUp(data.thisWeek, data.lastWeek),
    },
    {
      label: "Visitas hoy",
      value: data.today.toString(),
      delta: "hoy",
      up: true,
    },
    {
      label: "Clics en WhatsApp",
      value: data.clicksWa.toString(),
      delta: "esta semana",
      up: true,
    },
    {
      label: "Clics en Instagram",
      value: data.clicksIg.toString(),
      delta: "esta semana",
      up: true,
    },
  ];

  return (
    <div className={styles.view}>
      {PerfilSection}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Resumen de la semana</h3>
        <div className={styles.metricsGrid}>
          {stats.map((s) => (
            <div key={s.label} className={styles.metricCard}>
              <p className={styles.metricLabel}>{s.label}</p>
              <p className={styles.metricValue}>{s.value}</p>
              <p
                className={`${styles.metricDelta} ${s.up ? styles.deltaUp : styles.deltaDown}`}
              >
                {s.delta}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Visitas últimos 7 días</h3>
        <div className={styles.chartArea}>
          <div className={styles.barChart}>
            {data.byDay.map((b, i) => {
              const isToday = i === data.byDay.length - 1;
              const height = Math.max((b.count / maxDay) * 100, 4);
              return (
                <div key={b.day} className={styles.barWrap}>
                  <span
                    style={{ fontSize: 10, color: "#7A756A", marginBottom: 4 }}
                  >
                    {b.count > 0 ? b.count : ""}
                  </span>
                  <div
                    className={`${styles.bar} ${isToday ? styles.barActive : ""}`}
                    style={{ height: `${height}px` }}
                  />
                  <span className={styles.barDay}>{b.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Total histórico</h3>
        <div
          className={styles.metricsGrid}
          style={{ gridTemplateColumns: "1fr 1fr" }}
        >
          <div className={styles.metricCard}>
            <p className={styles.metricLabel}>Visitas totales</p>
            <p className={styles.metricValue}>{data.total}</p>
            <p className={`${styles.metricDelta} ${styles.deltaUp}`}>
              acumulado
            </p>
          </div>
          <div className={styles.metricCard}>
            <p className={styles.metricLabel}>Semana anterior</p>
            <p className={styles.metricValue}>{data.lastWeek}</p>
            <p
              className={`${styles.metricDelta} ${isUp(data.thisWeek, data.lastWeek) ? styles.deltaUp : styles.deltaDown}`}
            >
              {pct(data.thisWeek, data.lastWeek)} vs esta semana
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
