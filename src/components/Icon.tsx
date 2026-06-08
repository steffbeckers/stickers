import React from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

interface IconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  fill?: string;
}

export function Icon({ name, size = 24, strokeWidth = 2, color = '#0f1712', fill = 'none' }: IconProps) {
  const p = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const svg = { width: size, height: size, viewBox: '0 0 24 24' };

  switch (name) {
    case 'home': return <Svg {...svg}><G {...p}><Path d="M3 10.5 12 3l9 7.5"/><Path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/></G></Svg>;
    case 'album': return <Svg {...svg}><G {...p}><Rect x="4" y="3" width="16" height="18" rx="2"/><Path d="M8 3v18"/><Path d="M12 8h4M12 12h4"/></G></Svg>;
    case 'scan': return <Svg {...svg}><G {...p}><Path d="M3 8V6a2 2 0 0 1 2-2h2M17 4h2a2 2 0 0 1 2 2v2M21 16v2a2 2 0 0 1-2 2h-2M7 20H5a2 2 0 0 1-2-2v-2"/><Circle cx="12" cy="12" r="3.2"/></G></Svg>;
    case 'stats': return <Svg {...svg}><G {...p}><Path d="M5 21V10M12 21V4M19 21v-7"/></G></Svg>;
    case 'search': return <Svg {...svg}><G {...p}><Circle cx="11" cy="11" r="7"/><Path d="m20 20-3.2-3.2"/></G></Svg>;
    case 'chevron': return <Svg {...svg}><G {...p}><Path d="m9 6 6 6-6 6"/></G></Svg>;
    case 'chevron-down': return <Svg {...svg}><G {...p}><Path d="m6 9 6 6 6-6"/></G></Svg>;
    case 'back': return <Svg {...svg}><G {...p}><Path d="m15 6-6 6 6 6"/></G></Svg>;
    case 'check': return <Svg {...svg}><G {...p}><Path d="m4 12.5 5 5L20 6.5"/></G></Svg>;
    case 'plus': return <Svg {...svg}><G {...p}><Path d="M12 5v14M5 12h14"/></G></Svg>;
    case 'minus': return <Svg {...svg}><G {...p}><Path d="M5 12h14"/></G></Svg>;
    case 'x': return <Svg {...svg}><G {...p}><Path d="M6 6l12 12M18 6 6 18"/></G></Svg>;
    case 'swap': return <Svg {...svg}><G {...p}><Path d="M7 4 3 8l4 4"/><Path d="M3 8h13a4 4 0 0 1 4 4"/><Path d="m17 20 4-4-4-4"/><Path d="M21 16H8a4 4 0 0 1-4-4"/></G></Svg>;
    case 'star': return <Svg {...svg}><G strokeWidth={strokeWidth} stroke={color} strokeLinecap="round" strokeLinejoin="round"><Path d="m12 3 2.6 5.5 6 .9-4.3 4.2 1 6L12 17l-5.3 2.6 1-6L3.4 9.4l6-.9z" fill={fill}/></G></Svg>;
    case 'lock': return <Svg {...svg}><G {...p}><Rect x="5" y="11" width="14" height="9" rx="2"/><Path d="M8 11V8a4 4 0 0 1 8 0v3"/></G></Svg>;
    case 'bolt': return <Svg {...svg}><G strokeWidth={strokeWidth} stroke={color} strokeLinecap="round" strokeLinejoin="round"><Path d="M13 3 4 14h6l-1 7 9-11h-6z" fill={fill}/></G></Svg>;
    case 'flash': return <Svg {...svg}><G {...p}><Path d="M7 2h10l-1 7h4l-9 13 2-9H6z"/></G></Svg>;
    case 'flash-off': return <Svg {...svg}><G {...p}><Path d="M7 2h10l-1 7h4l-9 13 2-9H6z"/><Path d="M3 3l18 18"/></G></Svg>;
    case 'pin': return <Svg {...svg}><G {...p}><Path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11Z"/><Circle cx="12" cy="10" r="2.4"/></G></Svg>;
    case 'share': return <Svg {...svg}><G {...p}><Circle cx="6" cy="12" r="2.4"/><Circle cx="17" cy="6" r="2.4"/><Circle cx="17" cy="18" r="2.4"/><Path d="m8.2 11 6.6-3.6M8.2 13l6.6 3.6"/></G></Svg>;
    case 'sparkle': return <Svg {...svg}><G strokeWidth={strokeWidth} stroke={color} strokeLinecap="round" strokeLinejoin="round"><Path d="M12 4c.6 3.4 1.6 4.4 5 5-3.4.6-4.4 1.6-5 5-.6-3.4-1.6-4.4-5-5 3.4-.6 4.4-1.6 5-5Z" fill={fill}/></G></Svg>;
    case 'gift': return <Svg {...svg}><G {...p}><Rect x="3" y="8" width="18" height="5" rx="1"/><Path d="M5 13v8h14v-8M12 8v13"/><Path d="M12 8S10.5 3 8 3a2.5 2.5 0 0 0 0 5zM12 8s1.5-5 4-5a2.5 2.5 0 0 1 0 5z"/></G></Svg>;
    default: return <Svg {...svg}><G {...p}><Path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0"/></G></Svg>;
  }
}
