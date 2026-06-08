interface BalanceCardProps {
  balance: number;
}

export default function BalanceCard({ balance }: BalanceCardProps) {
  return (
    <div className="party-card mx-4 p-5 text-center">
      <p className="text-xs font-medium tracking-widest text-party-gold/70">
        ТВІЙ БАЛАНС
      </p>
      <p className="party-title mt-1 text-4xl font-bold text-party-gold">
        ${balance}
      </p>
      <p className="mt-2 text-xs text-party-cream/50">
        Мінімальна купюра — $100
      </p>
    </div>
  );
}
