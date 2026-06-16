import { useNavigate } from 'react-router-dom'

export default function Remitos() {
  const navigate = useNavigate()
  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#050510,#080818)',
      display:'flex',alignItems:'center',justifyContent:'center',
      fontFamily:"'Nunito Sans',system-ui,sans-serif",color:'#F0EFFF'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:48,marginBottom:16,opacity:0.5}}>🚧</div>
        <div style={{fontSize:22,fontWeight:900,fontFamily:"'Syne',sans-serif",marginBottom:8}}>Remitos</div>
        <div style={{fontSize:13,color:'#8884A8',marginBottom:24}}>Módulo en construcción — próximamente</div>
        <button onClick={()=>navigate(-1)}
          style={{padding:'10px 24px',borderRadius:12,border:'none',cursor:'pointer',
            background:'linear-gradient(135deg,#E8860A,#F5A623)',
            color:'#000',fontSize:13,fontWeight:700}}>
          ← Volver
        </button>
      </div>
    </div>
  )
}
