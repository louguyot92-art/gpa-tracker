import { useState, useRef } from 'react';
import type { GradeEntry } from '../types';
import { GRADE_SCALE } from '../lib/grades';
import { supabase } from '../lib/supabase';

interface Props {
  scale: GradeEntry[] | null;
  onChange: (scale: GradeEntry[] | null) => void;
  lang: 'fr' | 'en';
}

const LETTERS = ['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','E'];
const DEFAULT_GPA: Record<string, number> = Object.fromEntries(
  GRADE_SCALE.map(e => [e.letter, e.gpa])
);

export function GradeScaleEditor({ scale, onChange, lang }: Props) {
  const active = scale && scale.length > 0;

  const [rows, setRows] = useState<GradeEntry[]>(() =>
    active ? [...scale].sort((a, b) => b.min - a.min)
           : GRADE_SCALE.map(e => ({ ...e }))
  );
  const [useCustom, setUseCustom] = useState(active ?? false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [parseSuccess, setParseSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleToggle() {
    const next = !useCustom;
    setUseCustom(next);
    onChange(next ? rows : null);
  }

  function handleChange(index: number, field: keyof GradeEntry, value: string) {
    const sorted = [...rows].sort((a, b) => b.min - a.min);
    const realIndex = rows.indexOf(sorted[index]);
    const updated = rows.map((r, i) => {
      if (i !== realIndex) return r;
      if (field === 'letter') return { ...r, letter: value };
      const num = parseFloat(value);
      if (isNaN(num)) return r;
      return { ...r, [field]: num };
    });
    setRows(updated);
    onChange(updated);
  }

  function handleReset() {
    const reset = GRADE_SCALE.map(e => ({ ...e }));
    setRows(reset);
    onChange(reset);
    setParseSuccess(false);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError('');
    setParseSuccess(false);
    setParsing(true);

    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      // Limit: 4.5 MB (base64 adds ~33%, Supabase functions limit ~6MB)
      if (file.size > 4.5 * 1024 * 1024) {
        throw new Error(lang === 'fr'
          ? 'Fichier trop lourd (max 4.5 Mo). Compresse l\'image ou réduis sa résolution.'
          : 'File too large (max 4.5 MB). Compress the image or reduce its resolution.');
      }

      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Data = btoa(binary);
      const mediaType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

      // 45-second timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45_000);

      const session = await supabase.auth.getSession();
      const jwt = session.data.session?.access_token;

      const projectUrl = 'https://qddscdrmxjiwcmkcairx.supabase.co';
      const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkZHNjZHJteGppd2Nta2NhaXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMTUxMjYsImV4cCI6MjA5Mjc5MTEyNn0.2CdW1cZMQNVTNEnn5TJuhL26Cgtcp5JkzFumQXMma9Y';

      let res: Response;
      try {
        res = await fetch(`${projectUrl}/functions/v1/parse-grade-scale`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt ?? anonKey}`,
            'apikey': anonKey,
          },
          body: JSON.stringify({ data: base64Data, mediaType }),
          signal: controller.signal,
        });
      } catch (fetchErr) {
        if ((fetchErr as Error).name === 'AbortError') {
          throw new Error(lang === 'fr'
            ? 'Délai dépassé (45s). Essaie avec une image plus petite.'
            : 'Timeout (45s). Try with a smaller image.');
        }
        throw fetchErr;
      } finally {
        clearTimeout(timeout);
      }

      const json = await res.json();

      if (!res.ok) {
        if (json?.error?.includes('ANTHROPIC_API_KEY')) {
          throw new Error(lang === 'fr'
            ? 'Clé API Anthropic manquante. Ajoute ANTHROPIC_API_KEY dans Supabase → Settings → Edge Functions → Secrets.'
            : 'Missing Anthropic API key. Add ANTHROPIC_API_KEY in Supabase → Settings → Edge Functions → Secrets.');
        }
        throw new Error(json?.error ?? `HTTP ${res.status}`);
      }

      if (!json?.scale || !Array.isArray(json.scale) || json.scale.length === 0) {
        throw new Error(lang === 'fr'
          ? 'Aucune grille détectée dans le fichier. Essaie avec une image plus nette.'
          : 'No grading scale detected. Try with a clearer image.');
      }

      const sorted = (json.scale as GradeEntry[]).sort((a, b) => b.min - a.min);
      setRows(sorted);
      setUseCustom(true);
      onChange(sorted);
      setParseSuccess(true);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : String(err));
    } finally {
      setParsing(false);
    }
  }

  const sorted = [...rows].sort((a, b) => b.min - a.min);

  return (
    <div>
      {/* Import button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
        padding: '12px 14px',
        background: 'var(--accent-light)',
        border: '1px solid #bfdbfe',
        borderRadius: 'var(--radius)',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--accent)' }}>
            {lang === 'fr' ? 'Importer une photo ou un PDF' : 'Import a photo or PDF'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
            {lang === 'fr'
              ? 'Prends en photo la grille de ton prof — Claude la lira automatiquement'
              : 'Take a photo of your prof\'s grading scale — Claude will read it automatically'}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={parsing}
          style={{ flexShrink: 0 }}
        >
          {parsing ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block', fontSize: 16 }}>↻</span>
              {lang === 'fr' ? 'Analyse…' : 'Analysing…'}
            </span>
          ) : (
            lang === 'fr' ? 'Choisir un fichier' : 'Choose file'
          )}
        </button>
      </div>

      {parseError && (
        <div style={{
          background: 'var(--danger-light)',
          color: 'var(--danger)',
          padding: '10px 14px',
          borderRadius: 'var(--radius)',
          fontSize: 13,
          marginBottom: 12,
        }}>
          {parseError}
        </div>
      )}

      {parseSuccess && (
        <div style={{
          background: 'var(--success-light)',
          color: 'var(--success)',
          padding: '10px 14px',
          borderRadius: 'var(--radius)',
          fontSize: 13,
          marginBottom: 12,
        }}>
          {lang === 'fr' ? 'Grille extraite avec succès — vérifie les valeurs ci-dessous.' : 'Scale extracted successfully — review the values below.'}
        </div>
      )}

      {/* Toggle + reset */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
          <input
            type="checkbox"
            checked={useCustom}
            onChange={handleToggle}
            style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
          />
          {lang === 'fr' ? 'Grille personnalisée pour ce cours' : 'Custom grading scale for this course'}
        </label>
        {useCustom && (
          <button className="btn btn-ghost btn-sm" onClick={handleReset} style={{ fontSize: 12 }}>
            {lang === 'fr' ? 'Réinitialiser (HEC)' : 'Reset to HEC default'}
          </button>
        )}
      </div>

      {useCustom && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '70px 1fr 1fr 36px',
            background: 'var(--surface2)',
            padding: '6px 10px',
            borderBottom: '1px solid var(--border)',
          }}>
            {['Lettre', 'Min %', 'GPA', ''].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
            ))}
          </div>

          {sorted.map((row, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '70px 1fr 1fr 36px',
                borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none',
                alignItems: 'center',
              }}
            >
              <div style={{ padding: '4px 10px' }}>
                <select
                  className="input"
                  value={row.letter}
                  onChange={e => handleChange(i, 'letter', e.target.value)}
                  style={{ padding: '4px 6px', fontSize: 13, fontFamily: 'DM Mono, monospace', fontWeight: 500 }}
                >
                  {LETTERS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div style={{ padding: '4px 8px' }}>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={row.min}
                  onChange={e => handleChange(i, 'min', e.target.value)}
                  style={{ padding: '4px 8px', fontSize: 13, fontFamily: 'DM Mono, monospace' }}
                />
              </div>
              <div style={{ padding: '4px 8px' }}>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={4.3}
                  step={0.1}
                  value={row.gpa}
                  onChange={e => handleChange(i, 'gpa', e.target.value)}
                  style={{ padding: '4px 8px', fontSize: 13, fontFamily: 'DM Mono, monospace' }}
                />
              </div>
              <div style={{ padding: '4px 4px', display: 'flex', justifyContent: 'center' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 12, color: 'var(--danger)', padding: '2px 6px' }}
                  onClick={() => {
                    const updated = rows.filter(r => r !== row);
                    setRows(updated);
                    onChange(updated);
                  }}
                >✕</button>
              </div>
            </div>
          ))}

          <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border)', background: 'var(--surface2)' }}>
            <button
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 13 }}
              onClick={() => {
                const minVals = rows.map(r => r.min);
                const lowestMin = minVals.length > 0 ? Math.max(0, Math.min(...minVals) - 5) : 50;
                const updated = [...rows, { letter: 'C', min: lowestMin, gpa: DEFAULT_GPA['C'] ?? 2.0 }];
                setRows(updated);
                onChange(updated);
              }}
            >
              + {lang === 'fr' ? 'Ajouter une ligne' : 'Add row'}
            </button>
          </div>
        </div>
      )}

      {!useCustom && (
        <div style={{ fontSize: 13, color: 'var(--text3)', padding: '8px 0' }}>
          {lang === 'fr'
            ? 'Grille HEC par défaut utilisée (A+ = 92%, A = 86%…)'
            : 'Using HEC default scale (A+ = 92%, A = 86%…)'}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
