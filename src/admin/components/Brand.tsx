/** Logo di halaman login admin (mengikuti tema admin) dan ikon di navigasi. */
export const AdminLogo = () => (
  <span className="smd-brand">
    <img src="/brand/logo.svg" alt="SOC Merdeka" className="smd-brand__light" />
    <img src="/brand/logo-inverse.svg" alt="" aria-hidden="true" className="smd-brand__dark" />
  </span>
)

export const AdminIcon = () => (
  <img src="/brand/icon.svg" alt="" style={{ height: 26, width: 26 }} />
)
