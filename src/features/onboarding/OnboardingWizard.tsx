import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, Rocket, ShieldAlert } from 'lucide-react';
import { useThemes, useCreateTeam } from './api';
import { ThemeSelect } from './ThemeSelect';

type Step = 'theme' | 'identity';

export function OnboardingWizard() {
  const navigate = useNavigate();
  const { data: themes, isLoading, isError, refetch } = useThemes();
  const createTeam = useCreateTeam();

  const [step, setStep] = useState<Step>('theme');
  const [themeId, setThemeId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [officialId, setOfficialId] = useState('');
  const [description, setDescription] = useState('');

  const submit = () => {
    if (themeId == null || name.trim().length < 2) return;
    createTeam.mutate(
      {
        name: name.trim(),
        theme_id: themeId, // one scalar id
        official_eyantra_id: officialId.trim() || null,
        description: description.trim() || null,
      },
      { onSuccess: () => navigate('/', { replace: true }) },
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">ARC Mission Control · Onboarding</p>
        <h1 className="mt-1 text-2xl font-bold text-primary-text sm:text-3xl">Form your team</h1>
        <p className="mt-2 max-w-2xl text-sm text-secondary-text">
          Choose <strong className="text-primary-text">exactly one</strong> e-Yantra challenge theme for your team,
          then set your team identity. Your theme locks once an admin verifies the roster.
        </p>
      </header>

      {/* Step indicator */}
      <ol className="mb-8 flex items-center gap-3 text-sm" aria-label="Onboarding steps">
        {(['theme', 'identity'] as Step[]).map((s, i) => {
          const active = step === s;
          const done = step === 'identity' && s === 'theme';
          return (
            <li key={s} className="flex items-center gap-3">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold"
                style={{
                  borderColor: active || done ? 'var(--accent-color)' : 'var(--hairline)',
                  background: active || done ? 'var(--accent-color)' : 'transparent',
                  color: active || done ? '#04121a' : 'var(--text-muted)',
                }}
              >
                {i + 1}
              </span>
              <span className={active ? 'text-primary-text' : 'text-muted-text'}>
                {s === 'theme' ? 'Choose one theme' : 'Team identity'}
              </span>
              {i === 0 && <span aria-hidden className="h-px w-8 bg-hairline" />}
            </li>
          );
        })}
      </ol>

      {step === 'theme' && (
        <section aria-label="Theme selection">
          {isLoading && (
            <div className="flex items-center gap-2 py-16 text-secondary-text">
              <Loader2 className="animate-spin" size={18} /> Loading themes…
            </div>
          )}
          {isError && (
            <div className="arc-panel flex flex-col items-start gap-3 p-6">
              <p className="flex items-center gap-2 text-danger"><ShieldAlert size={18} /> Couldn’t load themes.</p>
              <button className="btn-ghost" onClick={() => refetch()}>Retry</button>
            </div>
          )}
          {themes && themes.length === 0 && (
            <div className="arc-panel p-6 text-secondary-text">No themes are available yet. Check back soon.</div>
          )}
          {themes && themes.length > 0 && (
            <>
              <ThemeSelect themes={themes} value={themeId} onChange={setThemeId} />
              <div className="mt-6 flex justify-end">
                <button
                  className="btn-primary"
                  disabled={themeId == null}
                  onClick={() => setStep('identity')}
                >
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {step === 'identity' && (
        <section aria-label="Team identity" className="max-w-xl">
          <div className="arc-panel space-y-4 p-6">
            <div>
              <label htmlFor="team-name" className="mb-1 block text-sm font-medium text-primary-text">Team name</label>
              <input
                id="team-name"
                className="field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Orbital Vanguard"
                maxLength={120}
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="official-id" className="mb-1 block text-sm font-medium text-primary-text">
                Official e-Yantra team ID <span className="text-muted-text">(optional)</span>
              </label>
              <input
                id="official-id"
                className="field"
                value={officialId}
                onChange={(e) => setOfficialId(e.target.value)}
                placeholder="If assigned by e-Yantra"
                maxLength={64}
              />
              <p className="mt-1 text-xs text-muted-text">An admin can mark this verified later.</p>
            </div>
            <div>
              <label htmlFor="team-desc" className="mb-1 block text-sm font-medium text-primary-text">
                Short description <span className="text-muted-text">(optional)</span>
              </label>
              <textarea
                id="team-desc"
                className="field min-h-24"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
              />
            </div>

            <p className="rounded-md border border-hairline bg-page/40 p-3 text-xs text-secondary-text">
              A permanent ARC code (e.g. <span className="font-mono text-accent">ARC-2026-014</span>) is generated
              automatically. Your ARC code and your single chosen theme cannot change after the roster is locked.
            </p>

            {createTeam.isError && (
              <p className="flex items-center gap-2 text-sm text-danger" role="alert">
                <ShieldAlert size={16} />
                {createTeam.error.message}
              </p>
            )}

            <div className="flex items-center justify-between pt-2">
              <button className="btn-ghost" onClick={() => setStep('theme')} disabled={createTeam.isPending}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn-primary" onClick={submit} disabled={createTeam.isPending || name.trim().length < 2}>
                {createTeam.isPending ? <Loader2 className="animate-spin" size={16} /> : <Rocket size={16} />}
                Create team
              </button>
            </div>
          </div>
        </section>
      )}

      <p className="mt-10 text-center text-xs text-muted-text">
        ARC Mission Control is an internal club platform of the Aviation &amp; Robotics Club — not the official
        IIT Bombay / e-Yantra portal.
      </p>
    </div>
  );
}
