import type { ReactNode } from 'react';
import { Topbar } from './Topbar';

interface MainLayoutProps {
    children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="min-h-screen w-full bg-page text-body overflow-x-hidden flex flex-col font-sans">
            <Topbar />

            <main className="flex-1 w-full mt-[80px] p-8 md:p-12 animate-in fade-in duration-500">
                <div className="max-w-[1440px] mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
 
