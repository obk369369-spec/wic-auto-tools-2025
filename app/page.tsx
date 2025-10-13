"use client";
import { useState } from "react";

export default function Home() {
  const [tocIn, setTocIn] = useState("");
  const [tocOut, setTocOut] = useState("");
  const [url, setUrl] = useState("");
  const [leads, setLeads] = useState<any>(null);

  async function runToc() {
    const r = await fetch("/api/tools/toc/toc-normalize", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ toc: tocIn }) });
    const j = await r.json();
    setTocOut(j.output || j.error || "");
  }
  async function runLeads() {
    const r = await fetch("/api/tools/scrape/lead-scan", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ url }) });
    setLeads(await r.json());
  }

  return (
    <main style={{maxWidth:980, margin:"40px auto", padding:"0 16px", fontFamily:"ui-sans-serif"}}>
      <h1>WIC Toolset</h1>

      <section style={{marginTop:24}}>
        <h2>1) TOC 정리 (상위/하위 2단계, 번호 보존)</h2>
        <textarea value={tocIn} onChange={e=>setTocIn(e.target.value)} placeholder="여기에 발행사 TOC 붙여넣기" style={{width:"100%",height:160}}/>
        <div style={{marginTop:8}}>
          <button onClick={runToc}>정리 실행</button>
        </div>
        <pre style={{whiteSpace:"pre-wrap", background:"#0b0b0b", color:"#e8e8e8", padding:12, borderRadius:8, marginTop:12}}>{tocOut}</pre>
      </section>

      <section style={{marginTop:32}}>
        <h2>2) 리드 추출 (연락처•연구비 시그널)</h2>
        <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..." style={{width:"100%"}}/>
        <div style={{marginTop:8}}>
          <button onClick={runLeads}>추출 실행</button>
        </div>
        <pre style={{whiteSpace:"pre-wrap", background:"#0b0b0b", color:"#e8e8e8", padding:12, borderRadius:8, marginTop:12}}>
{leads ? JSON.stringify(leads, null, 2) : ""}
        </pre>
      </section>
    </main>
  );
}
