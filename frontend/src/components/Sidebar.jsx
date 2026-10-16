import { HomeIcon, BarIcon, PieIcon, BoxIcon, MoonIcon, GearIcon } from "./Icons.jsx";

const items = [
  { icon: HomeIcon, label: "Home", active: true },
  { icon: BarIcon, label: "Reports" },
  { icon: PieIcon, label: "Insights" },
  { icon: BoxIcon, label: "Archive" },
  { icon: MoonIcon, label: "Theme" },
  { icon: GearIcon, label: "Settings" },
];

export default function Sidebar() {
  return (
    <nav className="sidebar" aria-label="Main">
      <div className="logo">UI</div>
      <ul>
        {items.map(({ icon: Icon, label, active }) => (
          <li key={label}>
            <button className={active ? "nav-btn active" : "nav-btn"} aria-label={label} title={label}>
              <Icon />
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
