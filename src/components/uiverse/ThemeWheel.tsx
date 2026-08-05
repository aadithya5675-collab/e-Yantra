import './ThemeWheel.css';

interface ThemeWheelProps {
  value: string;
  onChange: (value: string) => void;
}

const themes = [
  { id: '1', num: '01', label: 'LQ' },
  { id: '2', num: '02', label: 'KD' },
  { id: '3', num: '03', label: 'SC' },
  { id: '4', num: '04', label: 'HE' },
  { id: '5', num: '05', label: 'NV' },
  { id: '6', num: '06', label: 'EB' },
  { id: '7', num: '07', label: 'PB' },
];

export function ThemeWheel({ value, onChange }: ThemeWheelProps) {
  const selectedIndex = themes.findIndex(t => t.id === value);
  const safeIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const handleNext = () => {
    const nextIndex = (safeIndex + 1) % themes.length;
    onChange(themes[nextIndex].id);
  };

  return (
    <div className="wheel-selector scale-50 sm:scale-[0.55] transform origin-top-right md:origin-center">
      <div className="hint-pop">Click Next</div>
      <div className="radio-input">
        <div className="glass-overlay"></div>

        {themes.map((theme, i) => {
          const isActive = i === safeIndex;
          
          // Calculate shortest path rotation
          let diff = i - safeIndex;
          if (diff > themes.length / 2) diff -= themes.length;
          if (diff < -themes.length / 2) diff += themes.length;

          const rotation = diff * 30; // 30 degrees per item
          
          return (
            <label 
              key={theme.id}
              className={`wheel-label ${isActive ? 'active' : ''}`}
              style={{ 
                transform: `rotate(${rotation}deg) ${isActive ? 'translateX(12px)' : ''}`,
                opacity: isActive ? 1 : Math.max(0.15, 1 - Math.abs(diff) * 0.3),
                zIndex: isActive ? 10 : 5
              }}
            >
              <span className="label">{theme.label}</span>
            </label>
          );
        })}
        
        {/* Invisible trigger to advance the wheel */}
        <div 
          className="absolute inset-0 z-[100] cursor-pointer" 
          onClick={handleNext}
          title="Click to cycle themes"
        />
      </div>
    </div>
  );
}
