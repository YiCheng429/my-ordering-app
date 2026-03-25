import { useEffect, useRef } from "react";

export default function QRCode({ url }) {
  const imgRef = useRef();

  useEffect(() => {
    if (imgRef.current) {
      imgRef.current.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    }
  }, [url]);

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,padding:24,background:"#fff",borderRadius:16,border:"1.5px solid #E8D9C0"}}>
      <div style={{fontSize:14,fontWeight:700,color:"#8C7355"}}>掃描點餐</div>
      <img ref={imgRef} alt="QR Code" style={{width:200,height:200,borderRadius:8}} />
      <div style={{fontSize:12,color:"#8C7355",wordBreak:"break-all",textAlign:"center",maxWidth:200}}>{url}</div>
    </div>
  );
}