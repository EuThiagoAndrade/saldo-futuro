// Ícones SVG próprios (D7 do ciclo 004): 24 px, traço em currentColor. São decorativos por
// padrão (aria-hidden); um botão só com ícone recebe nome acessível no próprio botão.

import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;

function Icone({ children, ...props }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconeInicio = (p: Props) => (
  <Icone {...p}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 9.5V20h13V9.5" />
    <path d="M10 20v-5h4v5" />
  </Icone>
);

export const IconeLancamentos = (p: Props) => (
  <Icone {...p}>
    <path d="M8 6h12M8 12h12M8 18h12" />
    <path d="M4 6h.01M4 12h.01M4 18h.01" />
  </Icone>
);

export const IconeAtivos = (p: Props) => (
  <Icone {...p}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M3 12h18" />
  </Icone>
);

export const IconeBenchmarks = (p: Props) => (
  <Icone {...p}>
    <path d="M4 20V4" />
    <path d="M4 20h16" />
    <path d="m7 15 4-4 3 3 5-6" />
  </Icone>
);

export const IconeMais = (p: Props) => (
  <Icone {...p}>
    <circle cx="5" cy="12" r="1.25" />
    <circle cx="12" cy="12" r="1.25" />
    <circle cx="19" cy="12" r="1.25" />
  </Icone>
);

export const IconeTransferencias = (p: Props) => (
  <Icone {...p}>
    <path d="M4 8h14l-3-3" />
    <path d="M20 16H6l3 3" />
  </Icone>
);

export const IconeConta = (p: Props) => (
  <Icone {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Icone>
);

export const IconeAdministracao = (p: Props) => (
  <Icone {...p}>
    <path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6z" />
    <path d="m9 12 2 2 4-4" />
  </Icone>
);

export const IconeOlho = (p: Props) => (
  <Icone {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Icone>
);

export const IconeOlhoFechado = (p: Props) => (
  <Icone {...p}>
    <path d="M3 3l18 18" />
    <path d="M10.6 5.1A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1" />
    <path d="M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7a10 10 0 0 0 5.4-1.6" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </Icone>
);

export const IconeSetaCima = (p: Props) => (
  <Icone {...p}>
    <path d="M12 19V5" />
    <path d="m6 11 6-6 6 6" />
  </Icone>
);

export const IconeSetaBaixo = (p: Props) => (
  <Icone {...p}>
    <path d="M12 5v14" />
    <path d="m6 13 6 6 6-6" />
  </Icone>
);

export const IconeTraco = (p: Props) => (
  <Icone {...p}>
    <path d="M6 12h12" />
  </Icone>
);

export const IconeAlerta = (p: Props) => (
  <Icone {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5" />
    <path d="M12 16.5h.01" />
  </Icone>
);
