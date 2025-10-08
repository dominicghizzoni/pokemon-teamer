import { useState } from "react";

function App() {
  const [desc, setDesc] = useState("");
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    const res = await fetch("http://localhost:4000/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: desc })
    });
    const data = await res.json();
    setTeam(data.team || []);
    setLoading(false);
  }

  return (
    <div className="items-center" style={{ padding: 20 }}>
      <h1>Pokémon Teamer</h1>
      <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={6} cols={60} />
      <br />
      <button onClick={generate} disabled={loading}>Generate team</button>
      {loading && <p>Thinking...</p>}
      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        {team?.map(p => (
          <div key={p.name} style={{ width: 160, border: "1px solid #ddd", padding: 8 }}>
            <img src={p.image} alt={p.name} style={{ width: "100%" }} />
            <h4>{p.name}</h4>
            <p style={{ fontSize: 12 }}>{p.reason}</p>
            <p style={{ fontSize: 11, color: "#555" }}>{p.types?.join(", ")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
