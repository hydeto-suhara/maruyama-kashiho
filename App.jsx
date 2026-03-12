import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer
} from "recharts";

// ─── マスタデータ ───────────────────────────────────
const STORES = [
  { id: "honten",   name: "本店" },
  { id: "himuro",   name: "氷室店" },
  { id: "tomita",   name: "富田店" },
  { id: "kojo",     name: "工場店" },
  { id: "ikeda",    name: "池田店" },
  { id: "icity",    name: "アイシティ21店" },
];

const CATEGORIES = [
  { id: "karen",    name: "あづみ野 花恋",  color: "#e8a0a0" },
  { id: "meika",    name: "郷土銘菓",       color: "#a0c8e8" },
  { id: "seasonal", name: "季節のお菓子",   color: "#a0e8b0" },
  { id: "western",  name: "洋菓子",         color: "#e8d0a0" },
  { id: "gelato",   name: "ジェラート",     color: "#c0a0e8" },
  { id: "gift",     name: "贈答品・その他", color: "#e8c0a0" },
];

const MONTHS = ["1","2","3","4","5","6","7","8","9","10","11","12"];
const YEARS  = ["2023","2024","2025","2026"];

// 初期データ（デモ用サンプル）
const generateSampleData = () => {
  const data = {};
  STORES.forEach(s => {
    data[s.id] = {};
    YEARS.forEach(y => {
      data[s.id][y] = {};
      MONTHS.forEach(m => {
        data[s.id][y][m] = {};
        CATEGORIES.forEach(c => {
          let base = Math.floor(Math.random() * 300000) + 100000;
          if (s.id === "himuro" && c.id === "western") base *= 1.8;
          if (s.id === "tomita" && c.id === "gelato") base *= 2.2;
          if (s.id === "honten" && c.id === "meika")  base *= 1.5;
          if (s.id === "ikeda"  && c.id === "gift")   base *= 1.6;
          if (s.id === "icity"  && parseInt(y) < 2026) base = 0;
          if (s.id === "icity"  && y === "2026")       base = Math.floor(base * 0.6);
          data[s.id][y][m][c.id] = Math.floor(base / 1000) * 1000;
        });
      });
    });
  });
  return data;
};

const fmt = (v) => new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(v);
const fmtShort = (v) => {
  if (v >= 1000000) return (v / 1000000).toFixed(1) + "M";
  if (v >= 1000)    return (v / 1000).toFixed(0) + "K";
  return v;
};

export default function App() {
  const [salesData, setSalesData] = useState(generateSampleData);
  const [activeTab, setActiveTab] = useState("input");
  const [selectedStore, setSelectedStore] = useState("honten");
  const [selectedYear,  setSelectedYear]  = useState("2026");
  const [selectedMonth, setSelectedMonth] = useState("3");
  const [reportYear,    setReportYear]    = useState("2026");
  const [reportMonth,   setReportMonth]   = useState("3");
  const [compareYear,   setCompareYear]   = useState("2026");

  const handleInput = (catId, value) => {
    const num = parseInt(value.replace(/[^0-9]/g, "")) || 0;
    setSalesData(prev => ({
      ...prev,
      [selectedStore]: {
        ...prev[selectedStore],
        [selectedYear]: {
          ...prev[selectedStore]?.[selectedYear],
          [selectedMonth]: {
            ...prev[selectedStore]?.[selectedYear]?.[selectedMonth],
            [catId]: num,
          }
        }
      }
    }));
  };

  const currentEntry = salesData[selectedStore]?.[selectedYear]?.[selectedMonth] || {};
  const currentTotal = Object.values(currentEntry).reduce((a, b) => a + b, 0);

  const reportMonthData = STORES.map(s => {
    const entry = salesData[s.id]?.[reportYear]?.[reportMonth] || {};
    const total  = Object.values(entry).reduce((a, b) => a + b, 0);
    const obj = { name: s.name, 合計: total };
    CATEGORIES.forEach(c => { obj[c.name] = entry[c.id] || 0; });
    return obj;
  });

  const reportPieData = CATEGORIES.map(c => ({
    name: c.name,
    value: STORES.reduce((sum, s) =>
      sum + (salesData[s.id]?.[reportYear]?.[reportMonth]?.[c.id] || 0), 0),
    color: c.color,
  })).filter(d => d.value > 0);

  const reportMonthlyTrend = MONTHS.map(m => {
    const obj = { month: m + "月" };
    STORES.forEach(s => {
      const entry = salesData[s.id]?.[reportYear]?.[m] || {};
      obj[s.name] = Object.values(entry).reduce((a, b) => a + b, 0);
    });
    return obj;
  });

  const storeColors = ["#e87070","#70a8e8","#70c870","#e8c070","#a870e8","#e89870"];
  const grandTotal = reportMonthData.reduce((s, r) => s + r["合計"], 0);

  return (
    <div style={{ fontFamily: "'Segoe UI','Hiragino Sans',sans-serif", backgroundColor: "#fdf8f0", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg,#8b4513,#c8783a)", color: "#fff", padding: "16px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
        <div style={{ fontSize: 22, fontWeight: "bold", letterSpacing: 2 }}>🏮 丸山菓子舗　売上管理システム</div>
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>創業明治42年 ― 安曇野・松本 全6店舗</div>
      </div>

      <div style={{ display: "flex", background: "#fff", borderBottom: "2px solid #d4a070", padding: "0 24px" }}>
        {[
          { id: "input",   label: "📝 売上入力" },
          { id: "report",  label: "📊 月次レポート" },
          { id: "compare", label: "🏪 店舗比較" },
          { id: "trend",   label: "📈 年間推移" },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              padding: "12px 20px", border: "none", cursor: "pointer", fontSize: 14, fontWeight: "bold",
              background: "transparent", borderBottom: activeTab === t.id ? "3px solid #8b4513" : "3px solid transparent",
              color: activeTab === t.id ? "#8b4513" : "#666", transition: "all 0.2s",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>

        {activeTab === "input" && (
          <div>
            <h2 style={{ color: "#8b4513", marginBottom: 16 }}>売上入力</h2>
            <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
              <label style={labelStyle}>店舗<select value={selectedStore} onChange={e => setSelectedStore(e.target.value)} style={selectStyle}>{STORES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
              <label style={labelStyle}>年<select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={selectStyle}>{YEARS.map(y => <option key={y} value={y}>{y}年</option>)}</select></label>
              <label style={labelStyle}>月<select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={selectStyle}>{MONTHS.map(m => <option key={m} value={m}>{m}月</option>)}</select></label>
            </div>
            <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize: 15, fontWeight: "bold", marginBottom: 16, color: "#555" }}>
                {STORES.find(s => s.id === selectedStore)?.name} ／ {selectedYear}年{selectedMonth}月
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f5ede0" }}>
                    <th style={thStyle}>商品カテゴリ</th>
                    <th style={{ ...thStyle, width: 220 }}>売上金額（円）</th>
                    <th style={thStyle}>構成比</th>
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.map(c => {
                    const val  = currentEntry[c.id] || 0;
                    const pct  = currentTotal > 0 ? ((val / currentTotal) * 100).toFixed(1) : "0.0";
                    return (
                      <tr key={c.id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 12, height: 12, borderRadius: "50%", background: c.color, display: "inline-block" }} />
                          {c.name}
                        </td>
                        <td style={{ padding: "8px 16px" }}>
                          <input type="text" value={val.toLocaleString("ja-JP")} onChange={e => handleInput(c.id, e.target.value)}
                            style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, textAlign: "right", fontFamily: "monospace" }} />
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1, height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                              <div style={{ width: pct + "%", height: "100%", background: c.color, borderRadius: 4, transition: "width 0.3s" }} />
                            </div>
                            <span style={{ fontSize: 12, color: "#888", minWidth: 40 }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: "#f5ede0", fontWeight: "bold" }}>
                    <td style={{ padding: "14px 16px" }}>合　計</td>
                    <td style={{ padding: "14px 16px", textAlign: "right", fontFamily: "monospace", fontSize: 16 }}>{currentTotal.toLocaleString("ja-JP")} 円</td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "report" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
              <h2 style={{ color: "#8b4513", margin: 0 }}>月次レポート</h2>
              <label style={labelStyle}>年<select value={reportYear} onChange={e => setReportYear(e.target.value)} style={selectStyle}>{YEARS.map(y => <option key={y} value={y}>{y}年</option>)}</select></label>
              <label style={labelStyle}>月<select value={reportMonth} onChange={e => setReportMonth(e.target.value)} style={selectStyle}>{MONTHS.map(m => <option key={m} value={m}>{m}月</option>)}</select></label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginBottom: 28 }}>
              <div style={kpiCard("#8b4513","#fff2e6")}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>全店合計</div>
                <div style={{ fontSize: 20, fontWeight: "bold", marginTop: 4 }}>{fmt(grandTotal)}</div>
              </div>
              {STORES.map((s,i) => {
                const entry = salesData[s.id]?.[reportYear]?.[reportMonth] || {};
                const total = Object.values(entry).reduce((a,b) => a+b, 0);
                return (
                  <div key={s.id} style={kpiCard(storeColors[i],"#fff")}>
                    <div style={{ fontSize: 12 }}>{s.name}</div>
                    <div style={{ fontSize: 16, fontWeight: "bold", marginTop: 4 }}>{fmtShort(total)}</div>
                  </div>
                );
              })}
            </div>
            <div style={cardStyle}>
              <h3 style={{ color: "#8b4513", marginTop: 0 }}>店舗別 商品カテゴリ内訳</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={reportMonthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={fmtShort} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Legend />
                  {CATEGORIES.map(c => <Bar key={c.id} dataKey={c.name} stackId="a" fill={c.color} />)}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
              <div style={cardStyle}>
                <h3 style={{ color: "#8b4513", marginTop: 0 }}>全店カテゴリ構成比</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={reportPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                      {reportPieData.map((d,i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={cardStyle}>
                <h3 style={{ color: "#8b4513", marginTop: 0 }}>店舗別売上一覧</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr style={{ background: "#f5ede0" }}><th style={thStyle}>店舗</th><th style={{ ...thStyle, textAlign: "right" }}>売上</th><th style={{ ...thStyle, textAlign: "right" }}>構成比</th></tr></thead>
                  <tbody>
                    {reportMonthData.slice().sort((a, b) => b["合計"] - a["合計"]).map((row, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "8px 12px" }}>{row.name}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "monospace" }}>{fmt(row["合計"])}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right" }}>{grandTotal > 0 ? ((row["合計"] / grandTotal) * 100).toFixed(1) : "0.0"}%</td>
                      </tr>
                    ))}
                    <tr style={{ background: "#f5ede0", fontWeight: "bold" }}>
                      <td style={{ padding: "8px 12px" }}>合計</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "monospace" }}>{fmt(grandTotal)}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "compare" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <h2 style={{ color: "#8b4513", margin: 0 }}>店舗比較</h2>
              <label style={labelStyle}>年<select value={compareYear} onChange={e => setCompareYear(e.target.value)} style={selectStyle}>{YEARS.map(y => <option key={y} value={y}>{y}年</option>)}</select></label>
            </div>
            <div style={cardStyle}>
              <h3 style={{ color: "#8b4513", marginTop: 0 }}>月別 店舗別売上推移（{compareYear}年）</h3>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={reportMonthlyTrend.map(d => {
                  const obj = { month: d.month };
                  STORES.forEach(s => {
                    const entry = salesData[s.id]?.[compareYear]?.[d.month.replace("月","")] || {};
                    obj[s.name] = Object.values(entry).reduce((a,b) => a+b, 0);
                  });
                  return obj;
                })}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={fmtShort} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Legend />
                  {STORES.map((s,i) => <Line key={s.id} type="monotone" dataKey={s.name} stroke={storeColors[i]} strokeWidth={2} dot={{ r: 4 }} />)}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ ...cardStyle, marginTop: 20 }}>
              <h3 style={{ color: "#8b4513", marginTop: 0 }}>年間売上合計（{compareYear}年）</h3>
              {(() => {
                const annualData = STORES.map((s,i) => {
                  const total = MONTHS.reduce((sum, m) => {
                    const entry = salesData[s.id]?.[compareYear]?.[m] || {};
                    return sum + Object.values(entry).reduce((a,b) => a+b, 0);
                  }, 0);
                  return { name: s.name, total, color: storeColors[i] };
                }).sort((a,b) => b.total - a.total);
                const max = annualData[0]?.total || 1;
                return annualData.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 32, textAlign: "center", fontWeight: "bold", color: i === 0 ? "#e8a020" : "#888" }}>{i + 1}位</div>
                    <div style={{ width: 120, fontSize: 13 }}>{d.name}</div>
                    <div style={{ flex: 1, height: 28, background: "#f0f0f0", borderRadius: 6, overflow: "hidden" }}>
                      <div style={{ width: `${(d.total / max) * 100}%`, height: "100%", background: d.color, borderRadius: 6, display: "flex", alignItems: "center", paddingLeft: 8, fontSize: 12, color: "#fff", fontWeight: "bold", transition: "width 0.5s" }}>
                        {fmtShort(d.total)}
                      </div>
                    </div>
                    <div style={{ width: 120, textAlign: "right", fontFamily: "monospace", fontSize: 13 }}>{fmt(d.total)}</div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {activeTab === "trend" && (
          <div>
            <h2 style={{ color: "#8b4513", marginBottom: 24 }}>年間推移（全店舗合計）</h2>
            <div style={cardStyle}>
              <h3 style={{ color: "#8b4513", marginTop: 0 }}>年別 月次売上推移</h3>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={MONTHS.map(m => {
                  const obj = { month: m + "月" };
                  YEARS.forEach(y => {
                    obj[y + "年"] = STORES.reduce((sum, s) => {
                      const entry = salesData[s.id]?.[y]?.[m] || {};
                      return sum + Object.values(entry).reduce((a,b) => a+b, 0);
                    }, 0);
                  });
                  return obj;
                })}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={fmtShort} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Legend />
                  {YEARS.map((y,i) => <Line key={y} type="monotone" dataKey={y + "年"} stroke={["#8b4513","#c8783a","#a0c850","#5090c8"][i]} strokeWidth={2} dot={{ r: 3 }} />)}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ ...cardStyle, marginTop: 20 }}>
              <h3 style={{ color: "#8b4513", marginTop: 0 }}>カテゴリ別 年間売上（全店舗合計）</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={YEARS.map(y => {
                  const obj = { year: y + "年" };
                  CATEGORIES.forEach(c => {
                    obj[c.name] = STORES.reduce((sum, s) => {
                      return sum + MONTHS.reduce((msum, m) => msum + (salesData[s.id]?.[y]?.[m]?.[c.id] || 0), 0);
                    }, 0);
                  });
                  return obj;
                })}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={v => (v/1000000).toFixed(0) + "M"} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Legend />
                  {CATEGORIES.map(c => <Bar key={c.id} dataKey={c.name} stackId="a" fill={c.color} />)}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>

      <div style={{ textAlign: "center", padding: "20px", color: "#999", fontSize: 12, marginTop: 40 }}>
        丸山菓子舗 売上管理システム デモ版 ― データはデモ用サンプルです
      </div>
    </div>
  );
}

const labelStyle = { display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "#666", fontWeight: "bold" };
const selectStyle = { padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6, fontSize: 14, cursor: "pointer" };
const thStyle = { padding: "10px 16px", textAlign: "left", fontWeight: "bold", fontSize: 13 };
const cardStyle = { background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" };
const kpiCard = (color, bg) => ({
  background: bg, border: `2px solid ${color}`, borderRadius: 10, padding: "14px 16px",
  color: color, boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
});
