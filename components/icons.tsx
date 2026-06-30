import type { ReactNode } from "react";

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export function IconDoc() {
  return (
    <Svg>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4" />
      <path d="M9.5 12h5M9.5 15.5h5" />
    </Svg>
  );
}

export function IconHome() {
  return (
    <Svg>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </Svg>
  );
}

export function IconUser() {
  return (
    <Svg>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5" />
    </Svg>
  );
}

export function IconCash() {
  return (
    <Svg>
      <rect x="3" y="6.5" width="18" height="11" rx="2" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6.5 6.5v0M17.5 17.5v0" />
    </Svg>
  );
}

export function IconReceipt() {
  return (
    <Svg>
      <path d="M6 3h12v18l-2.5-1.5L13 21l-1-1.5-1 1.5-2.5-1.5L6 21z" />
      <path d="M9 8h6M9 12h6" />
    </Svg>
  );
}

export function IconClock() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Svg>
  );
}

export function IconAlert() {
  return (
    <Svg>
      <path d="M12 3.5 2.5 20h19z" />
      <path d="M12 9.5v4.5M12 17v0" />
    </Svg>
  );
}

export function IconTrend() {
  return (
    <Svg>
      <path d="M3 16.5 9.5 10l4 4L21 6.5" />
      <path d="M21 11V6.5h-4.5" />
    </Svg>
  );
}

export function IconBell() {
  return (
    <Svg>
      <path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </Svg>
  );
}

export function IconChevronDown() {
  return (
    <Svg>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  );
}

export function IconChevronLeft() {
  return (
    <Svg>
      <path d="m15 6-6 6 6 6" />
    </Svg>
  );
}

export function IconChevronRight() {
  return (
    <Svg>
      <path d="m9 6 6 6-6 6" />
    </Svg>
  );
}

export function IconCheck() {
  return (
    <Svg>
      <path d="m5 13 4 4L19 7" />
    </Svg>
  );
}

export function IconRefresh() {
  return (
    <Svg>
      <path d="M4 11.5a8 8 0 0 1 13.5-5.5L20 8" />
      <path d="M20 4v4h-4" />
      <path d="M20 12.5a8 8 0 0 1-13.5 5.5L4 16" />
      <path d="M4 20v-4h4" />
    </Svg>
  );
}

export function IconSearch() {
  return (
    <Svg>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </Svg>
  );
}

export function IconCard() {
  return (
    <Svg>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3 9.5h18" />
      <path d="M6.5 14.5h4" />
    </Svg>
  );
}

export function IconPencil() {
  return (
    <Svg>
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="m14 6 4 4" />
    </Svg>
  );
}

export function IconTrash() {
  return (
    <Svg>
      <path d="M5 7h14" />
      <path d="M9 7V4.5h6V7" />
      <path d="M7 7l1 13h8l1-13" />
      <path d="M10 11v6M14 11v6" />
    </Svg>
  );
}

export function IconPlus() {
  return (
    <Svg>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function IconX() {
  return (
    <Svg>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  );
}
