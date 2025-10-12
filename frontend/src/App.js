import { useState, useEffect } from "react";

function App() {
  const [desc, setDesc] = useState("");
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [displayTeam, setDisplayTeam] = useState([]);

  async function generate() {
    setLoading(true);
    setSpinning(true);
    setTeam([]);
    const res = await fetch("http://localhost:4000/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: desc })
    });
    const data = await res.json();
    const resultTeam = data.team || [];

    let spinTime = 2000;
    const interval = setInterval(() => {
      setDisplayTeam(Array.from({ length: 6 }, () => randomPokemonPlaceholder()));
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      setDisplayTeam(resultTeam);
      setSpinning(false);
      setLoading(false);
    }, spinTime);
  }

  function randomPokemonPlaceholder() {
    const randomId = Math.floor(Math.random() * 898) + 1;
    return {
      name: "???",
      reason: "",
      types: [],
      image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${randomId}.png`
    };
  }

  return (
    <div className="items-center" style={{ padding: 20, textAlign: "center" }}>
      <h1>Pokémon Teamer</h1>
      <textarea
        value={desc}
        onChange={e => setDesc(e.target.value)}
        rows={6}
        cols={60}
        placeholder="Describe yourself..."
      />
      <br />
      <button onClick={generate} disabled={loading || spinning} style={{ marginTop: 10 }}>
        {loading || spinning ? "Generating..." : "Generate team"}
      </button>

      {loading && <p>Thinking...</p>}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 16,
          marginTop: 24
        }}
      >
        {displayTeam.map((p, i) => (
          <div
            key={i}
            style={{
              width: 160,
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 10,
              transition: "transform 0.6s ease",
              transform: spinning ? "rotateY(360deg)" : "rotateY(0deg)",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              background: "white"
            }}
          >
            <img
              src={p.image}
              alt={p.name}
              style={{
                width: "100%",
                animation: spinning ? "spin 0.4s linear infinite" : "none"
              }}
            />
            <h4>{p.name}</h4>
            {!spinning && (
              <>
                <p style={{ fontSize: 12 }}>{p.reason}</p>
                <p style={{ fontSize: 11, color: "#555" }}>{p.types?.join(", ")}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Slot-spin keyframes */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

export default App;
