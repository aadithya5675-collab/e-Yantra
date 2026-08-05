import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, Rocket, ShieldAlert, User, Users } from 'lucide-react';
import { useThemes, useCreateTeam } from './api';
import { ThemeSelect } from './ThemeSelect';
import { useAuth } from '../auth/AuthContext';

type Step = 'role' | 'waiting' | 'theme' | 'identity';
type RoleType = 'leader' | 'member' | null;

export function OnboardingWizard() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const { data: themes, isLoading, isError, refetch } = useThemes();
  const createTeam = useCreateTeam();

  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<RoleType>(null);
  const [themeId, setThemeId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [officialId, setOfficialId] = useState('');
  const [description, setDescription] = useState('');

  const submit = () => {
    if (themeId == null || name.trim().length < 2) return;
    createTeam.mutate(
      {
        name: name.trim(),
        theme_id: themeId,
        official_eyantra_id: officialId.trim() || null,
        description: description.trim() || null,
      },
      { 
        onSuccess: async () => {
          await refreshProfile();
          navigate('/', { replace: true });
        }
      },
    );
  };

  const handleRoleSelect = (selectedRole: 'leader' | 'member') => {
    setRole(selectedRole);
    if (selectedRole === 'leader') {
      setStep('theme');
    } else {
      setStep('waiting');
    }
  };

  if (step === 'waiting') {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Loader2 className="mx-auto animate-spin text-accent mb-4" size={48} />
        <h1 className="text-2xl font-bold text-primary-text sm:text-3xl mb-2">Waiting for Team Leader</h1>
        <p className="text-secondary-text">
          Your profile has been created! Please wait for a Team Leader to select you as a member of their team from the Settings page.
        </p>
        <button 
          onClick={() => { setStep('role'); setRole(null); }}
          className="mt-8 btn-ghost"
        >
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">ARC Mission Control · Onboarding</p>
        <h1 className="mt-1 text-2xl font-bold text-primary-text sm:text-3xl">
          {step === 'role' ? 'Welcome to ARC' : 'Form your team'}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-secondary-text">
          {step === 'role' 
            ? 'Are you going to create a new team as a Team Leader, or are you joining an existing team as a Member?'
            : 'Choose exactly one e-Yantra challenge theme for your team, then set your team identity.'}
        </p>
      </header>

      {/* Step indicator */}
      {role === 'leader' && (
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
                  {s === 'theme' ? 'Choose theme' : 'Team identity'}
                </span>
                {i === 0 && <span aria-hidden className="h-px w-8 bg-hairline" />}
              </li>
            );
          })}
        </ol>
      )}

      {step === 'role' && (
        <section aria-label="Role selection" className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <button 
            onClick={() => handleRoleSelect('leader')}
            className="arc-panel p-8 flex flex-col items-center justify-center gap-4 hover:border-accent transition-colors group text-left"
          >
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users size={32} className="text-accent" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-primary-text mb-2">I am a Team Leader</h3>
              <p className="text-sm text-secondary-text">I want to create a new team, select a theme, and manage my team members.</p>
            </div>
          </button>
          
          <button 
            onClick={() => handleRoleSelect('member')}
            className="arc-panel p-8 flex flex-col items-center justify-center gap-4 hover:border-cyan-400 transition-colors group text-left"
          >
            <div className="w-16 h-16 rounded-full bg-cyan-400/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <User size={32} className="text-cyan-400" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-primary-text mb-2">I am a Team Member</h3>
              <p className="text-sm text-secondary-text">I am joining a team. My team leader will invite me after I register.</p>
            </div>
          </button>
        </section>
      )}

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
              <div className="mt-6 flex justify-between">
                <button
                  className="btn-ghost"
                  onClick={() => setStep('role')}
                >
                  <ArrowLeft size={16} /> Back
                </button>
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
        <section aria-label="Team identity">
          <div className="arc-panel max-w-2xl p-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="teamName" className="mb-1 block text-sm font-medium text-primary-text">
                  Team Name <span className="text-danger">*</span>
                </label>
                <input
                  id="teamName"
                  className="brutalist-input w-full"
                  placeholder="e.g. Apollo Rovers"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="officialId" className="mb-1 block text-sm font-medium text-primary-text">
                  Official e-Yantra Team ID <span className="text-secondary-text font-normal">(Optional)</span>
                </label>
                <input
                  id="officialId"
                  className="brutalist-input w-full"
                  placeholder="e.g. EYRC-2026-1234"
                  value={officialId}
                  onChange={(e) => setOfficialId(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="description" className="mb-1 block text-sm font-medium text-primary-text">
                  Team Description <span className="text-secondary-text font-normal">(Optional)</span>
                </label>
                <textarea
                  id="description"
                  className="brutalist-input w-full min-h-[100px] resize-y"
                  placeholder="What is your team's goal?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex max-w-2xl items-center justify-between">
            <button className="btn-ghost" onClick={() => setStep('theme')}>
              <ArrowLeft size={16} /> Back
            </button>
            <button
              className="btn-primary group"
              disabled={name.trim().length < 2 || createTeam.isPending}
              onClick={submit}
            >
              {createTeam.isPending ? (
                <><Loader2 className="animate-spin" size={16} /> Initializing...</>
              ) : (
                <>Launch Team <Rocket size={16} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></>
              )}
            </button>
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
