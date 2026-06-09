import React, { forwardRef } from 'react';
import '@/LiquidGlass//LiquidGlass.css';

const LiquidGlass = forwardRef(({ children, style, ...props }, ref) => {
  return (
    <div 
      className="liquid-glass-box" 
      ref={ref}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
});

export default LiquidGlass;