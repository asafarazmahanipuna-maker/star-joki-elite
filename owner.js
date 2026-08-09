const $=s=>document.querySelector(s); let token=sessionStorage.getItem("sje_owner_token")||"";
const rupiah=n=>"Rp "+Number(n).toLocaleString("id-ID");
function showDashboard(){ $("#loginView").classList.add("hidden"); $("#dashboard").classList.remove("hidden"); load(); }
if(token)showDashboard();
$("#login").onclick=async()=>{
 const p=$("#password").value; if(!p)return;
 const r=await fetch("/api/owner/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:p})});
 const d=await r.json(); if(!r.ok){$("#loginMsg").textContent=d.error||"Login gagal";return}
 token=d.token; sessionStorage.setItem("sje_owner_token",token); showDashboard();
};
$("#logout").onclick=()=>{sessionStorage.removeItem("sje_owner_token");location.reload()};
$("#refresh").onclick=load; $("#filter").oninput=load;
async function load(){
 const r=await fetch("/api/owner/orders",{headers:{Authorization:"Bearer "+token}});
 const d=await r.json(); if(!r.ok){sessionStorage.removeItem("sje_owner_token");location.reload();return}
 const list=d.orders||[]; const q=($("#filter").value||"").toLowerCase();
 $("#total").textContent=list.length; $("#waiting").textContent=list.filter(o=>o.status==="Menunggu").length; $("#processing").textContent=list.filter(o=>o.status==="Diproses").length; $("#done").textContent=list.filter(o=>o.status==="Selesai").length;
 const shown=list.filter(o=>[o.code,o.customer,o.phone,o.package].join(" ").toLowerCase().includes(q));
 $("#orders").innerHTML=shown.length?shown.map(o=>`
 <article class="order-item"><div><h3>${esc(o.code)} <span class="status">${esc(o.status)}</span></h3>
 <div class="meta">#${o.queue} • ${esc(o.customer)} • ${esc(o.phone)}<br>${esc(o.package)} • ${rupiah(o.price)}<br>${esc(o.note||"Tidak ada catatan")}<br>${new Date(o.createdAt).toLocaleString("id-ID")}</div>
 ${o.proof?`<a href="${o.proof}" target="_blank"><img class="proof" src="${o.proof}" alt="Bukti pembayaran"></a>`:""}</div>
 <div class="order-actions"><button onclick="statusOrder('${o.id}','Menunggu')">MENUNGGU</button><button onclick="statusOrder('${o.id}','Diproses')">DIPROSES</button><button onclick="statusOrder('${o.id}','Selesai')">SELESAI</button><button onclick="statusOrder('${o.id}','Ditolak')">TOLAK</button><button onclick="deleteOrder('${o.id}')">HAPUS</button></div></article>`).join(""):"<div class='panel'>Belum ada order.</div>";
}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
window.statusOrder=async(id,status)=>{await fetch("/api/owner/orders/"+id,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({status})});load()}
window.deleteOrder=async id=>{if(!confirm("Hapus order ini?"))return;await fetch("/api/owner/orders/"+id,{method:"DELETE",headers:{Authorization:"Bearer "+token}});load()}
