import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentUser } from '@/services/auth';

interface User {
    id: number;
    email: string;
    role: string;
    active: boolean;
    must_change_password: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    loginContext: (token: string, userData: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    const res = await getCurrentUser();
                    if (res.success) {
                        setUser(res.data);
                    }
                } catch (error) {
                    localStorage.removeItem('access_token');
                }
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    const loginContext = (token: string, userData: User) => {
        localStorage.setItem('access_token', token);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginContext, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
