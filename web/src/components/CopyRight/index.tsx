import './index.css'
export default function CopyRight() {
  const siteConfig = window.__SITE_CONFIG__
  return (
    <div className="copyright">
      <ul className="mb-3">
        {siteConfig?.links.map((link, index) => (
          <li key={index}>
            <a target="_blank" rel="noopener noreferrer" href={link.url}>
              {link.title}
            </a>
            {index < siteConfig.links.length - 1 && <span> | </span>}
          </li>
        ))}
      </ul>
      <p>{siteConfig?.copyright}</p>
    </div>
  )
}
