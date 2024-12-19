declare module '*.svg'
declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.gif'
declare module '*.bmp'
declare module '*.tiff'
declare module '*.mp3'

declare namespace JSX {
  interface IntrinsicElements {
    'wc-waterfall': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & import('wc-waterfall').WaterfallProps, HTMLElement>
  }
}

interface Navigator {
  userActivation?: {
    hasBeenActive: boolean
    isActive: boolean
  }
}


type SiteConfig = {
  logo: string;
  loginLogo: string;
  copyright: string;
  title: string;
  loginTitle: string;
  version: string;
  disabledMenus: string[];
  links: { url: string; title: string }[];
  feedback: string;
  aboutUs: string;
};

interface Window {
  __SITE_CONFIG__: SiteConfig | null
}