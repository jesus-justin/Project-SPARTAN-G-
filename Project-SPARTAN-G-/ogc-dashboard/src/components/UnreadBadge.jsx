export default function UnreadBadge({ count = 0 }) {
  return (
    <span
      style={{
        background: '#CC0000',
        color: '#fff',
        borderRadius: 999,
        padding: '4px 9px',
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      Unread: {count}
    </span>
  );
}
