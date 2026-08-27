import React from "react";

type MarkProps = {
  className?: string;
};

const tile = "h-5 w-8 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-white/15";

const VisaMark: React.FC<MarkProps> = ({ className }) => (
  <svg viewBox="0 0 32 20" className={className} role="img" aria-label="Visa">
    <rect width="32" height="20" rx="2.5" fill="#1A1F71" />
    <text
      x="16"
      y="13.4"
      textAnchor="middle"
      fill="#fff"
      fontFamily="Arial, Helvetica, sans-serif"
      fontSize="8"
      fontWeight="800"
      fontStyle="italic"
      letterSpacing="0.4"
    >
      VISA
    </text>
  </svg>
);

const MastercardMark: React.FC<MarkProps> = ({ className }) => (
  <svg viewBox="0 0 32 20" className={className} role="img" aria-label="Mastercard">
    <rect width="32" height="20" rx="2.5" fill="#fff" />
    <circle cx="13.2" cy="10" r="5" fill="#EB001B" />
    <circle cx="18.8" cy="10" r="5" fill="#F79E1B" />
    <path d="M16 6.1a5 5 0 0 1 0 7.8 5 5 0 0 1 0-7.8Z" fill="#FF5F00" />
  </svg>
);

const AmexMark: React.FC<MarkProps> = ({ className }) => (
  <svg viewBox="0 0 32 20" className={className} role="img" aria-label="American Express">
    <rect width="32" height="20" rx="2.5" fill="#2E77BC" />
    <text
      x="16"
      y="13.2"
      textAnchor="middle"
      fill="#fff"
      fontFamily="Arial, Helvetica, sans-serif"
      fontSize="7"
      fontWeight="800"
      letterSpacing="0.6"
    >
      AMEX
    </text>
  </svg>
);

const BkashMark: React.FC<MarkProps> = ({ className }) => (
  <svg viewBox="0 0 32 20" className={className} role="img" aria-label="bKash">
    <rect width="32" height="20" rx="2.5" fill="#E2136E" />
    <text
      x="16"
      y="13.2"
      textAnchor="middle"
      fill="#fff"
      fontFamily="Arial, Helvetica, sans-serif"
      fontSize="7"
      fontWeight="700"
    >
      bKash
    </text>
  </svg>
);

const NagadMark: React.FC<MarkProps> = ({ className }) => (
  <svg viewBox="0 0 32 20" className={className} role="img" aria-label="Nagad">
    <rect width="32" height="20" rx="2.5" fill="#F47321" />
    <text
      x="16"
      y="13.2"
      textAnchor="middle"
      fill="#fff"
      fontFamily="Arial, Helvetica, sans-serif"
      fontSize="7"
      fontWeight="700"
    >
      Nagad
    </text>
  </svg>
);

const RocketMark: React.FC<MarkProps> = ({ className }) => (
  <svg viewBox="0 0 32 20" className={className} role="img" aria-label="Rocket">
    <rect width="32" height="20" rx="2.5" fill="#8C3494" />
    <text
      x="16"
      y="13.2"
      textAnchor="middle"
      fill="#fff"
      fontFamily="Arial, Helvetica, sans-serif"
      fontSize="6.5"
      fontWeight="700"
    >
      Rocket
    </text>
  </svg>
);

const CodMark: React.FC<MarkProps> = ({ className }) => (
  <svg viewBox="0 0 32 20" className={className} role="img" aria-label="Cash on Delivery">
    <rect width="32" height="20" rx="2.5" fill="#111" />
    <text
      x="16"
      y="13.2"
      textAnchor="middle"
      fill="#fff"
      fontFamily="Arial, Helvetica, sans-serif"
      fontSize="7.5"
      fontWeight="800"
      letterSpacing="0.4"
    >
      COD
    </text>
  </svg>
);

const MARKS = [
  { id: "visa", label: "Visa", Mark: VisaMark },
  { id: "mastercard", label: "Mastercard", Mark: MastercardMark },
  { id: "amex", label: "American Express", Mark: AmexMark },
  { id: "bkash", label: "bKash", Mark: BkashMark },
  { id: "nagad", label: "Nagad", Mark: NagadMark },
  { id: "rocket", label: "Rocket", Mark: RocketMark },
  { id: "cod", label: "Cash on Delivery", Mark: CodMark },
] as const;

const PaymentMarks: React.FC = () => {
  return (
    <ul className="flex items-center gap-1">
      {MARKS.map(({ id, label, Mark }) => (
        <li key={id} title={label}>
          <Mark className={tile} />
        </li>
      ))}
    </ul>
  );
};

export default PaymentMarks;
