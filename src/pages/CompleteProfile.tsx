import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { showLoading, dismissToast, showSuccess, showError } from '@/utils/toast';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';

const CompleteProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const toastId = showLoading('Saving your profile...');
    const { error } = await supabase
      .from('profiles')
      .update({ first_name: firstName, last_name: lastName })
      .eq('id', user.id);

    dismissToast(toastId);
    if (error) {
      showError('Could not save your profile. Please try again.');
    } else {
      showSuccess('Profile saved successfully!');
      navigate('/app', { replace: true });
    }
  };

  return (
    <div className="min-h-screen main-gradient p-4 flex flex-col items-center justify-center">
      <motion.div
        className="w-full max-w-sm"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Card className="glass-card">
          <CardHeader className="text-center">
            <div className="inline-block p-4 bg-primary/10 rounded-full mb-4 mx-auto w-fit">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold text-primary">One Last Step</CardTitle>
            <CardDescription>Please tell us your name to complete your profile.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g., John"
                  required
                  className="bg-white/50 dark:bg-black/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g., Doe"
                  required
                  className="bg-white/50 dark:bg-black/20"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full gradient-button">
                Save and Continue
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default CompleteProfile;