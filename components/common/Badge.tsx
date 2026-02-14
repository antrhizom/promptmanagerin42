import styles from './Badge.module.css';

type BadgeVariant = 'platform' | 'model' | 'format' | 'usecase' | 'function' | 'tag' | 'role' | 'level';

interface BadgeProps {
  children: React.ReactNode;
  variant: BadgeVariant;
  onClick?: () => void;
}

export function Badge({ children, variant, onClick }: BadgeProps) {
  const className = `${styles.badge} ${styles[variant]}`;

  if (onClick) {
    return (
      <button className={className} onClick={onClick}>
        {children}
      </button>
    );
  }

  return <span className={className}>{children}</span>;
}
