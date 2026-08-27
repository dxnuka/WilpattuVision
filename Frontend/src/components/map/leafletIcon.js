import L from 'leaflet'


export function createLeafletIcon(color, { active = false } = {}) {
  const size = active ? 26 : 20
  return L.divIcon({
    className: '',
    html: `<span style="
      display:block;
      width:${size}px;
      height:${size}px;
      border-radius:9999px;
      background:${color};
      border:2px solid #F5EFE3;
      box-shadow:0 2px 6px rgba(20,30,19,0.35);
      ${active ? 'transform:scale(1.1);' : ''}
    "></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}
