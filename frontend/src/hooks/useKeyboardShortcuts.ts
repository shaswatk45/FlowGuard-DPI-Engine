import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts() {
    const navigate = useNavigate();
    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        let gPressed = false;
        let gTimer: ReturnType<typeof setTimeout>;

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

            if (e.key === '?' && !isInput) {
                e.preventDefault();
                setShowHelp(prev => !prev);
                return;
            }

            if (e.key === 'Escape') {
                setShowHelp(false);
                return;
            }

            if (isInput) return;

            if (e.key === 'g' && !e.metaKey && !e.ctrlKey) {
                gPressed = true;
                clearTimeout(gTimer);
                gTimer = setTimeout(() => { gPressed = false; }, 800);
                return;
            }

            if (gPressed) {
                gPressed = false;
                clearTimeout(gTimer);
                if (e.key === 'u') { e.preventDefault(); navigate('/upload'); }
                if (e.key === 'd') { e.preventDefault(); navigate('/dashboard'); }
                if (e.key === 'r') { e.preventDefault(); navigate('/rules'); }
            }

            if (e.altKey && e.key === '1') { e.preventDefault(); navigate('/upload'); }
            if (e.altKey && e.key === '2') { e.preventDefault(); navigate('/rules'); }
            if (e.altKey && e.key === '3') { e.preventDefault(); navigate('/dashboard'); }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearTimeout(gTimer);
        };
    }, [navigate]);

    return { showHelp, setShowHelp };
}
