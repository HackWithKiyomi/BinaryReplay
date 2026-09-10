import "./globals.css";
import Link from "next/link";
export const metadata={title:"BinaryReplay — DreamDEX Event Contract replay",description:"Deterministic replay and shadow execution for Somnia Event Contracts."};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body><div className="shell"><nav className="nav"><Link className="brand" href="/">Binary<i>Replay</i></Link>{[["Live","/live"],["Archive","/archive"],["Replay","/replay/demo"],["Lab","/lab"],["Runs","/runs"],["Shadow","/shadow"],["Proof","/proof"],["Docs","/docs"]].map(([n,h])=><Link key={h} href={h}>{n}</Link>)}<span className="pill">SHANNON · 50312</span><button className="connect">Connect Wallet</button></nav>{children}</div></body></html>}
