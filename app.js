const $=s=>document.querySelector(s);
const rupiah=n=>"Rp "+Number(n).toLocaleString("id-ID");

function compressImage(file,max=1400,quality=.78){
 return new Promise((resolve,reject)=>{
  const r=new FileReader();
  r.onload=()=>{
   const img=new Image();
   img.onload=()=>{
    const scale=Math.min(1,max/Math.max(img.width,img.height));
    const c=document.createElement("canvas"); c.width=Math.round(img.width*scale); c.height=Math.round(img.height*scale);
    c.getContext("2d").drawImage(img,0,0,c.width,c.height);
    resolve(c.toDataURL("image/jpeg",quality));
   };
   img.onerror=reject; img.src=r.result;
  };
  r.onerror=reject; r.readAsDataURL(file);
 });
}
document.querySelectorAll(".plan").forEach(btn=>btn.addEventListener("click",()=>{
 $("#package").value=`${btn.dataset.name} — ${btn.dataset.duration}`;
 $("#duration").value=btn.dataset.duration; $("#price").value=btn.dataset.price;
 document.querySelector("#order").scrollIntoView({behavior:"smooth"});
}));

$("#orderForm").addEventListener("submit",async e=>{
 e.preventDefault();
 if(!$("#package").value){alert("Pilih paket terlebih dahulu.");return}
 const file=$("#proof").files[0]; if(!file){alert("Upload bukti pembayaran.");return}
 if(file.size>8*1024*1024){alert("File terlalu besar. Pilih gambar maksimal 8 MB.");return}
 const send=$("#send"); send.disabled=true; send.textContent="MENGIRIM...";
 try{
  const proof=await compressImage(file);
  const payload={package:$("#package").value,duration:$("#duration").value,price:$("#price").value,customer:$("#customer").value.trim(),phone:$("#phone").value.trim(),note:$("#note").value.trim(),proof};
  const res=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const data=await res.json(); if(!res.ok) throw new Error(data.error||"Gagal mengirim order.");
  $("#success").classList.remove("hidden");
  $("#success").innerHTML=`<p class="eyebrow">ORDER BERHASIL TERKIRIM</p><b>Kode: ${data.order.code}</b><p>Nomor antrian: <b>#${data.order.queue}</b><br>Status: <b>${data.order.status}</b></p><p>Screenshot/simpan kode ini untuk cek antrian.</p>`;
  e.target.reset(); $("#package").value=""; $("#duration").value=""; $("#price").value="";
  $("#success").scrollIntoView({behavior:"smooth",block:"center"});
 }catch(err){alert(err.message)}finally{send.disabled=false;send.textContent="KIRIM ORDER"}
});

$("#search").addEventListener("click",async()=>{
 const q=$("#code").value.trim().toUpperCase(); if(!q)return;
 const box=$("#result"); box.classList.remove("hidden"); box.innerHTML="Mencari...";
 try{
  const res=await fetch("/api/orders?code="+encodeURIComponent(q)); const d=await res.json();
  if(!res.ok) throw new Error(d.error||"Tidak ditemukan.");
  box.innerHTML=`<p class="eyebrow">HASIL PENCARIAN</p><b>${d.order.code}</b><p>Nomor antrian: <b>#${d.order.queue}</b><br>Paket: ${d.order.package}<br>Harga: ${rupiah(d.order.price)}<br>Status: <b>${d.order.status}</b></p>`;
 }catch(e){box.innerHTML=`<b>Tidak ditemukan</b><p>${e.message}</p>`}
});
