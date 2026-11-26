import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 32 32" role="img" aria-label="TaskMate" xmlns="http://www.w3.org/2000/svg">
            <rect className="fill-[#2B7132] dark:fill-[#337B3C]" width="32" height="32" rx="8" />
            <path d="M8.5 9.5H21M14.75 9.5V24" fill="none" stroke="#FCFAF3" strokeWidth="4.2" strokeLinecap="round" />
            <path d="M19.4 21l2.8 2.8 4.8-6" fill="none" stroke="#E5A812" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
