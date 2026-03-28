import { useLocation, useNavigate } from "react-router-dom";

interface Tab {
  path: string;
  label: string;
  icon: (active: boolean) => JSX.Element;
}

const SearchIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="9.5" cy="9.5" r="6" stroke={active ? "currentColor" : "currentColor"} strokeWidth={active ? "2" : "1.5"} />
    <path d="M14 14L18 18" stroke="currentColor" strokeWidth={active ? "2" : "1.5"} strokeLinecap="round" />
  </svg>
);

const MapIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M11 2C7.686 2 5 4.686 5 8c0 5 6 12 6 12s6-7 6-12c0-3.314-2.686-6-6-6z" stroke="currentColor" strokeWidth={active ? "2" : "1.5"} />
    <circle cx="11" cy="8" r="2" stroke="currentColor" strokeWidth={active ? "2" : "1.5"} />
  </svg>
);

const SavedIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill={active ? "currentColor" : "none"}>
    <path d="M11 18.5L3.5 11C2.5 10 2 8.5 2 7.5C2 5 4 3 6.5 3C7.8 3 9 3.6 10 4.5L11 5.5L12 4.5C13 3.6 14.2 3 15.5 3C18 3 20 5 20 7.5C20 8.5 19.5 10 18.5 11L11 18.5Z" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="7" r="4" stroke="currentColor" strokeWidth={active ? "2" : "1.5"} />
    <path d="M3 20C3 16.134 6.686 13 11 13C15.314 13 19 16.134 19 20" stroke="currentColor" strokeWidth={active ? "2" : "1.5"} strokeLinecap="round" />
  </svg>
);

const TABS: Tab[] = [
  { path: "/", label: "Search", icon: (a) => <SearchIcon active={a} /> },
  { path: "/map", label: "Map", icon: (a) => <MapIcon active={a} /> },
  { path: "/saved", label: "Saved", icon: (a) => <SavedIcon active={a} /> },
  { path: "/me", label: "Profile", icon: (a) => <ProfileIcon active={a} /> },
];

export function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[768px] h-[56px] bg-ds-bg-primary border-t border-ds-border flex items-center z-20">
      {TABS.map((tab) => {
        const active = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex-1 flex flex-col items-center justify-center gap-[2px] h-full ${
              active ? "text-ds-interactive" : "text-ds-text-secondary"
            }`}
          >
            {tab.icon(active)}
            <span className={active ? "ds-tab-label-active" : "ds-tab-label"}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
