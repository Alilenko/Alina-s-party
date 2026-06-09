interface BalanceCardProps {
  balance: number;
}

export default function BalanceCard({ balance }: BalanceCardProps) {
  return (
    <div className="party-card p-3 text-center">
      <p className="text-[10px] font-medium tracking-widest text-party-gold/70">
        ТВІЙ БАЛАНС
      </p>
      <p className="party-title mt-0.5 text-3xl font-bold text-party-gold">
        ${balance}
      </p>
    </div>
  );
}
