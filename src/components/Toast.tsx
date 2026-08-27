export default function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      style={{
        position: "fixed",
        right: 26,
        bottom: 26,
        background: "#17202a",
        color: "#fff",
        padding: "13px 18px",
        borderRadius: 10,
        fontFamily: "Barlow, Helvetica, sans-serif",
        fontSize: 14,
        fontWeight: 500,
        boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
        zIndex: 50,
      }}
    >
      {message}
    </div>
  );
}
