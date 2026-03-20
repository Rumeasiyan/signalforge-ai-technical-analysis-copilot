import { SignUp } from '@clerk/nextjs';
import { AuthShell } from '@/components/auth-shell';

export default function SignUpPage() {
    return (
        <AuthShell mode="sign-up">
            <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
        </AuthShell>
    );
}
