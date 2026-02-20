import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ size = 24, className = '', text = 'Loading...' }) => {
    return (
        <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
            <Loader2 size={size} className="animate-spin text-blue-600 mb-3" />
            {text && <p className="text-slate-500 text-sm font-medium animate-pulse">{text}</p>}
        </div>
    );
};

export default Loader;
