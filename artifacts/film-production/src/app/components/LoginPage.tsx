import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Film, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import filmProductionBg from 'figma:asset/f19de0fb04c3fca4ddd18f92caa376736107284c.png';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('producer');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    setLoading(false);
    if (signInError) {
      setError(signInError);
      return;
    }
    onLogin();
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <img src={filmProductionBg} alt="Film production" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white px-12 w-full">
          <Film className="w-20 h-20 mb-6" />
          <h1 className="text-4xl mb-4 text-center">Film Production Management</h1>
          <p className="text-xl text-center opacity-90">Track budgets, manage expenses, deliver on time</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-6">
            <Film className="w-12 h-12 mx-auto mb-3 text-[#1E3A8A]" />
            <h1 className="text-2xl text-gray-900">FilmBudget Pro</h1>
            <p className="text-sm text-gray-600 mt-1">Production Management</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="mb-6 md:mb-8">
              <h2 className="text-2xl md:text-3xl mb-2">Welcome Back</h2>
              <p className="text-sm md:text-base text-gray-600">Sign in to manage your film projects</p>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="producer">Producer</SelectItem>
                    <SelectItem value="accounts">Accounts</SelectItem>
                    <SelectItem value="production-manager">Production Manager</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
