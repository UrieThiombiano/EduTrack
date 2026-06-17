import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, GraduationCap, Loader2 } from 'lucide-react';
import { authService } from '../../services/api/auth.service';
import { useAuthStore } from '../../store/auth.store';
import { cn } from '../../lib/utils';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court (min 6 caractères)'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      const { accessToken, refreshToken, user } = await authService.login(values.email, values.password);
      setAuth(user, accessToken, refreshToken);
      navigate(from, { replace: true });
    } catch {
      toast.error('Identifiants incorrects. Vérifiez votre email et mot de passe.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo & titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">EduTrack</h1>
          <p className="text-muted-foreground text-sm mt-1">PUKRI · Suivi scolaire multi-tenant</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          <h2 className="text-lg font-semibold text-foreground mb-6">Connexion</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@etablissement.bf"
                {...register('email')}
                className={cn(
                  'w-full px-3 py-2 rounded-lg bg-muted border text-foreground placeholder:text-muted-foreground text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition',
                  errors.email ? 'border-red-500' : 'border-border',
                )}
              />
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={cn(
                    'w-full px-3 py-2 pr-10 rounded-lg bg-muted border text-foreground placeholder:text-muted-foreground text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition',
                    errors.password ? 'border-red-500' : 'border-border',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'w-full py-2.5 px-4 rounded-lg font-medium text-sm transition',
                'bg-primary text-primary-foreground hover:bg-primary/90',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2',
              )}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} PUKRI AI Systems · Ouagadougou, Burkina Faso
        </p>
      </div>
    </div>
  );
}
