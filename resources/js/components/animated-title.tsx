import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';

export function AnimatedTitleText({ text }: { text: string }) {
    const reduceMotion = useReducedMotion();
    const [visibleText, setVisibleText] = useState(text);

    useEffect(() => {
        if (reduceMotion) {
            setVisibleText(text);
            return;
        }

        setVisibleText('');
        let position = 0;
        const timer = window.setInterval(() => {
            position += 1;
            setVisibleText(text.slice(0, position));
            if (position >= text.length) window.clearInterval(timer);
        }, 28);

        return () => window.clearInterval(timer);
    }, [reduceMotion, text]);

    return <span className="relative inline-grid align-top">
        <span aria-hidden="true" className="invisible col-start-1 row-start-1">{text}</span>
        <span aria-hidden="true" className="col-start-1 row-start-1">{reduceMotion ? text : visibleText}</span>
        <span className="sr-only">{text}</span>
    </span>;
}
