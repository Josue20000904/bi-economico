import { ImageResponse } from "next/og";

export const alt = "BI.ECONÔMICO — inteligência econômica orientada por dados";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

const cards = [
  { label: "Receita líquida", value: "R$ 127,4 bi", change: "↗ 6,5%" },
  { label: "Taxa Selic", value: "15,0% a.a.", change: "BCB" },
  { label: "Correlação", value: "0,81", change: "Forte positiva" },
];

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background:
            "radial-gradient(circle at 75% 15%, #123150 0%, #07111f 38%, #050b14 75%)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Arial, sans-serif",
          height: "100%",
          justifyContent: "space-between",
          padding: "64px 72px",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div
            style={{
              alignItems: "center",
              display: "flex",
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: -1,
            }}
          >
            <span>BI.</span>
            <span style={{ color: "#fbbf24" }}>ECONÔMICO</span>
          </div>

          <div
            style={{
              border: "1px solid rgba(52, 211, 153, 0.35)",
              borderRadius: 999,
              color: "#6ee7b7",
              display: "flex",
              fontSize: 18,
              padding: "10px 18px",
            }}
          >
            Painel interativo
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              color: "#fbbf24",
              display: "flex",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 4,
              marginBottom: 18,
              textTransform: "uppercase",
            }}
          >
            Dados • Economia • Estatística
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 58,
              fontWeight: 800,
              letterSpacing: -2,
              lineHeight: 1.08,
              maxWidth: 950,
            }}
          >
            Entenda o desempenho das empresas e suas relações com a economia.
          </div>

          <div
            style={{
              color: "#94a3b8",
              display: "flex",
              fontSize: 23,
              marginTop: 20,
            }}
          >
            Séries históricas, correlação, defasagem e diagnóstico estatístico.
          </div>
        </div>

        <div style={{ display: "flex", gap: 18, width: "100%" }}>
          {cards.map((card) => (
            <div
              key={card.label}
              style={{
                background: "rgba(7, 17, 31, 0.88)",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: 18,
                display: "flex",
                flex: 1,
                flexDirection: "column",
                padding: "20px 24px",
              }}
            >
              <span style={{ color: "#94a3b8", fontSize: 17 }}>
                {card.label}
              </span>
              <div
                style={{
                  alignItems: "flex-end",
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 8,
                }}
              >
                <span style={{ fontSize: 30, fontWeight: 800 }}>
                  {card.value}
                </span>
                <span style={{ color: "#34d399", fontSize: 16 }}>
                  {card.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
