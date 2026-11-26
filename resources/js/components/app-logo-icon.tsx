import type { ComponentProps } from 'react';

export default function AppLogoIcon(props: ComponentProps<'img'>) {
    return (
        <img
            src="/favicon.svg"
            alt="TaskMate"
            width={40}
            height={40}
            {...props}
        />
    );
}
