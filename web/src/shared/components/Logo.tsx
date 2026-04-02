import logoSrc from '../../assets/logo.png';

interface LogoProps {
  size?: number;
}

export function Logo({ size = 40 }: LogoProps) {
  return (
    <img
      src={logoSrc}
      width={size}
      height={size}
      alt="Folio logo"
      style={{ objectFit: 'contain' }}
    />
  );
}
